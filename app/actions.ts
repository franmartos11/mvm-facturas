'use server';

import { createClient } from '@/utils/supabase/server';
// We still need admin for specific background tasks if RLS is too strict, 
// but primarily we should use the user's client. 
// For now, keeping admin client init for analyzeInvoice fallback if needed, 
// but ideally we switch to user client.

import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/login');
}

export type ActionState = {
  error: string | null;
  success: string | null;
};

export async function changePassword(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return { error: 'Por favor, completa todos los campos.', success: null };
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.', success: null };
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.', success: null };
  }

  const { error } = await supabase.auth.updateUser({ password: password });

  if (error) {
    console.error('Error updating password:', error);
    return { error: error.message, success: null };
  }

  revalidatePath('/profile');
  return { success: 'Contraseña actualizada correctamente.', error: null };
}

export async function uploadPdf(formData: FormData) {
  const supabase = await createClient();
  
  // Check Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Debes iniciar sesión para subir facturas.');
  }

  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No se ha proporcionado ningún archivo');
  }

  // 1. Upload file to Supabase Storage
  // Create a unique file path: uploads/USERID/TIMESTAMP_FILENAME to isolate files per folder
  const filePath = `uploads/${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('facturas')
    .upload(filePath, file);

  if (storageError) {
    console.error('Storage Error:', storageError);
    throw new Error('Error subiendo el archivo a Storage');
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('facturas')
    .getPublicUrl(storageData.path);

  // 3. Insert record into Database
  const { error: dbError } = await supabase
    .from('invoices')
    .insert({
      filename: file.name,
      file_url: publicUrl,
      user_id: user.id // IMPORTANT: User ID
    });

  if (dbError) {
    console.error('Database Error:', dbError);
    // Optional: Cleanup stored file if DB insert fails
    await supabase.storage.from('facturas').remove([storageData.path]);
    throw new Error('Error guardando en la base de datos');
  }

  return { success: true };
}

export async function getInvoices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id) // Filter by user explicitly (redundant if RLS enabled, but safe)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return data;
}

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
// Note: This relies on GEMINI_API_KEY being set in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeInvoice(invoiceId: number, fileUrl: string) {
  // We use admin for background processing logic to ensure it runs even if RLS is tricky for updates
  // BUT we should verify ownership first if possible. 
  // For MVP, we assume if the user triggered it via UI, they have access.
  // Ideally, use authenticated client here too if passed, or just Admin is fine for the heavy lifting 
  // as long as we don't return data to the wrong user.
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    // 0. Check if already analyzed (Using Admin to bypass RLS if triggered by server component)
    const { data: invoiceCheck } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .single();

    if (invoiceCheck?.status === 'analyzed') {
      throw new Error('Esta factura ya ha sido analizada.');
    }

    // 1. Fetch the PDF file
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // 2. Prepare Gemini Model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
      Analiza esta factura e identifica:
      1. El nombre del PROVEEDOR (ej: Mercadona, Endesa, Farmacia X). Si no es obvio, pon "Desconocido".
      2. Los ítems comprados.

      Devuélveme SOLO un JSON válido con esta estructura:
      {
        "supplier": "Nombre Proveedor",
        "items": [
          {
            "description": "Nombre del producto",
            "quantity": 1,
            "unit_price": 10.50,
            "total_price": 10.50
          }
        ]
      }
      No incluyas markdown, ni comillas extra, solo el objeto JSON crudo.
    `;

    // 3. Generate Content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf',
        },
      },
    ]);

    const text = result.response.text();
    
    // Clean markdown if present (```json ... ```)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);
    
    // Compatibility: Handle if AI returns just array (fallback) or new object
    const items = Array.isArray(data) ? data : data.items;
    const supplier = Array.isArray(data) ? 'Desconocido' : (data.supplier || 'Desconocido');

    // 4. Save to Database
    // Using Admin to ensure status update success regardless of complex RLS
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ 
        status: 'analyzed',
        supplier: supplier
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice status:', JSON.stringify(updateError, null, 2));
      throw new Error(`Error updating status: ${updateError.message}`);
    }

    // Insert items using Admin client
    const itemsToInsert = items.map((item: any) => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));

    const { error: insertError } = await supabaseAdmin
      .from('invoice_items')
      .insert(itemsToInsert);

    if (insertError) throw insertError;

    return { success: true };


  } catch (error) {
    console.error('Error analyzing invoice:', error);
    
    // Mark as error
    await supabaseAdmin
      .from('invoices')
      .update({ status: 'error' })
      .eq('id', invoiceId);
      
    throw error;
  }
}

export async function deleteInvoice(invoiceId: number, fileUrl: string) {
  const supabase = await createClient();
  // Check auth implicitly via RLS or explicit check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  try {
    // 1. Delete from Storage
    // Extract path. URL format: .../uploads/USER_ID/TIME_NAME or .../uploads/TIME_NAME (old)
    const storagePath = fileUrl.split('/facturas/')[1];

    if (storagePath) {
      const { error: storageError } = await supabase
        .storage
        .from('facturas')
        .remove([storagePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }

    // 2. Delete from Database
    const { error: dbError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id); // Validating ownership

    if (dbError) throw dbError;

    return { success: true };

  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

export async function updateInvoiceItem(itemId: number, updates: { description?: string; quantity?: number; unit_price?: number; total_price?: number }) {
  const supabase = await createClient();
  try {
    // We rely on RLS on 'invoice_items' which should check if the parent invoice belongs to user.
    // If RLS is hard to set up for JOINs, we might need a two-step check here.
    // However, if we don't have RLS, we should verify. 
    // For MVP with RLS pending, we can try using the 'supabase' (auth) client.
    
    // NOTE: RLS on related tables (invoice_items) often requires using a functions or correct policies.
    // Assuming simple RLS:
    const { error } = await supabase
      .from('invoice_items')
      .update(updates)
      .eq('id', itemId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice item:', error);
    throw error;
  }
}

export async function getAllInvoiceItems() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('invoice_items')
    .select(`
      *,
      invoices!inner (
        filename,
        created_at,
        file_url,
        user_id
      )
    `)
    .eq('invoices.user_id', user.id) // Filter by user via join
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching invoice items:', JSON.stringify(error, null, 2));
    return [];
  }

  return data;
}
