'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Need to bypass RLS or ensure policy allows select. Using Service Role Key if available is safest for server actions.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadPdf(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No se ha proporcionado ningún archivo');
  }

  // 1. Upload file to Supabase Storage
  // Create a unique file path: uploads/TIMESTAMP_FILENAME
  const filePath = `uploads/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  
  const { data: storageData, error: storageError } = await supabaseAdmin
    .storage
    .from('facturas')
    .upload(filePath, file);

  if (storageError) {
    console.error('Storage Error:', storageError);
    throw new Error('Error subiendo el archivo a Storage');
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabaseAdmin
    .storage
    .from('facturas')
    .getPublicUrl(storageData.path);

  // 3. Insert record into Database
  const { error: dbError } = await supabaseAdmin
    .from('invoices')
    .insert({
      filename: file.name,
      file_url: publicUrl,
    });

  if (dbError) {
    console.error('Database Error:', dbError);
    // Optional: Cleanup stored file if DB insert fails
    await supabaseAdmin.storage.from('facturas').remove([storageData.path]);
    throw new Error('Error guardando en la base de datos');
  }

  return { success: true };
}

export async function getInvoices() {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
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
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    // 0. Check if already analyzed
    const { data: invoiceCheck } = await supabase
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
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
      Analiza esta factura y extrae los ítems comprados.
      Devuélveme SOLO un JSON válido con esta estructura:
      [
        {
          "description": "Nombre del producto",
          "quantity": 1,
          "unit_price": 10.50,
          "total_price": 10.50
        }
      ]
      No incluyas markdown, ni comillas extra, solo el array JSON crudo.
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
    const items = JSON.parse(jsonStr);

    // 4. Save to Database
    
    // DEBUG: Check which key we are using
    const usingServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('Analyzing invoice', invoiceId, 'Using Service Key:', usingServiceKey);

    // Update invoice status using Admin client to bypass RLS
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'analyzed' })
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
    
    // Mark as error in DB using Admin client
    await supabaseAdmin
      .from('invoices')
      .update({ status: 'error' })
      .eq('id', invoiceId);
      
    throw error;
  }
}

export async function deleteInvoice(invoiceId: number, fileUrl: string) {
  try {
    // 1. Delete from Storage
    // Extract path from URL. fileUrl format: .../storage/v1/object/public/facturas/uploads/filename
    // We need 'uploads/filename'
    const storagePath = fileUrl.split('/facturas/')[1];

    if (storagePath) {
      const { error: storageError } = await supabaseAdmin
        .storage
        .from('facturas')
        .remove([storagePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue to delete DB record even if storage fails (orphan cleanup)
      }
    }

    // 2. Delete from Database
    const { error: dbError } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (dbError) throw dbError;

    return { success: true };

  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

export async function updateInvoiceItem(itemId: number, updates: { description?: string; quantity?: number; unit_price?: number; total_price?: number }) {
  try {
    const { error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from('invoice_items')
    .select(`
      *,
      invoices (
        filename,
        created_at,
        file_url
      )
    `)
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching invoice items:', JSON.stringify(error, null, 2));
    return [];
  }

  return data;
}
