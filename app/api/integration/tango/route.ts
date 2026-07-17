import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { invoiceIds, newMappings } = body as { 
      invoiceIds: number[], 
      newMappings?: { mapping_type: string, source_name: string, tango_code: string }[] 
    };

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'No se enviaron facturas para sincronizar' }, { status: 400 });
    }

    // 1. Get user's tango token
    const userRes = await query<any>('SELECT tango_token FROM users WHERE id = $1', [user.id]);
    const tangoToken = userRes.rows[0]?.tango_token || process.env.TANGO_DEFAULT_TOKEN;
    if (!tangoToken || typeof tangoToken !== 'string') {
      return NextResponse.json({ error: 'No se encontró un Access Token de Tango configurado. Por favor, configúralo en tu perfil.' }, { status: 400 });
    }

    // 2. Save new mappings if provided
    if (newMappings && Array.isArray(newMappings)) {
      for (const mapping of newMappings) {
        if (!mapping.mapping_type || !mapping.source_name || !mapping.tango_code) continue;
        await query(
          `INSERT INTO tango_mappings (company_id, mapping_type, source_name, tango_code) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (company_id, mapping_type, source_name) 
           DO UPDATE SET tango_code = EXCLUDED.tango_code, created_at = CURRENT_TIMESTAMP`,
          [user.companyId, mapping.mapping_type, mapping.source_name, mapping.tango_code]
        );
      }
    }

    // 3. Get all user mappings
    const mappingsRes = await query<any>('SELECT mapping_type, source_name, tango_code FROM tango_mappings WHERE company_id = $1', [user.companyId]);
    const customerMap: Record<string, string> = {};
    const itemMap: Record<string, string> = {};
    for (const m of mappingsRes.rows) {
      if (m.mapping_type === 'customer') customerMap[m.source_name] = m.tango_code;
      if (m.mapping_type === 'item') itemMap[m.source_name] = m.tango_code;
    }

    // 4. Fetch invoices
    const invoicesRes = await query<any>(
      `SELECT id, invoice_date, supplier, total, filename 
       FROM invoices WHERE id = ANY($1::int[]) AND company_id = $2`,
      [invoiceIds, user.companyId]
    );

    if (invoicesRes.rows.length === 0) {
      return NextResponse.json({ error: 'No se encontraron las facturas solicitadas' }, { status: 404 });
    }

    // 5. Fetch invoice items
    const itemsRes = await query<any>(
      `SELECT invoice_id, description, quantity, unit_price, total_price 
       FROM invoice_items WHERE invoice_id = ANY($1::int[])`,
      [invoiceIds]
    );

    const itemsByInvoice: Record<number, any[]> = {};
    for (const item of itemsRes.rows) {
      if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
      itemsByInvoice[item.invoice_id].push(item);
    }

    const results = [];
    const missingMappings = [];

    // 6. Process each invoice
    for (const invoice of invoicesRes.rows) {
      const supplierName = invoice.supplier || 'Desconocido';
      const customerTangoCode = customerMap[supplierName]; // Esperamos que sea el CUIT o DNI

      if (!customerTangoCode) {
        missingMappings.push({ type: 'customer', name: supplierName, invoiceId: invoice.id });
      }

      const invoiceItems = itemsByInvoice[invoice.id] || [];
      const tangoItems = [];

      for (const item of invoiceItems) {
        const itemDesc = item.description || 'Item';
        const itemTangoCode = itemMap[itemDesc];
        
        if (!itemTangoCode) {
          missingMappings.push({ type: 'item', name: itemDesc, invoiceId: invoice.id });
        } else {
          tangoItems.push({
            SKU: itemTangoCode,
            Quantity: Number(item.quantity) || 1,
            UnitPrice: Number(item.unit_price) || 0,
            Description: itemDesc
          });
        }
      }

      // Si nos faltan mapeos para esta factura u otras, abortamos para que el frontend pida completarlos
      if (missingMappings.length > 0) continue;

      // 7. Construir payload para Tango
      const payload = {
        OrderNumber: `API-${invoice.id}`,
        Date: new Date(String(invoice.invoice_date)).toISOString(),
        Customer: {
          DocumentType: customerTangoCode.length > 10 ? 80 : 96, // 80: CUIT, 96: DNI
          DocumentNumber: customerTangoCode,
          Name: supplierName,
          Email: "nodisponible@ejemplo.com", // Requerido por el esquema pero no lo tenemos
          Address: {
             Street: "S/D",
             Number: "S/D",
             PostalCode: "0000",
             City: "S/D",
             ProvinceCode: "X" // Opcional o genérico
          }
        },
        Items: tangoItems,
        Payments: [
          {
            PaymentMethodId: "EFECTIVO", // Asumimos efectivo por defecto
            Amount: Number(invoice.total) || 0
          }
        ]
      };

      // 8. Enviar a Tango
      try {
        const tangoRes = await fetch('https://tiendas.axoft.com/api/Aperture/Order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accesstoken': tangoToken
          },
          body: JSON.stringify(payload)
        });

        if (!tangoRes.ok) {
          const errText = await tangoRes.text();
          results.push({ invoiceId: invoice.id, status: 'error', error: `Tango API Error: ${tangoRes.status} ${errText}` });
          continue;
        }

        // Marcar como sincronizada
        await query('UPDATE invoices SET tango_synced = true WHERE id = $1', [invoice.id]);
        results.push({ invoiceId: invoice.id, status: 'success' });
      } catch (err: any) {
        results.push({ invoiceId: invoice.id, status: 'error', error: err.message });
      }
    }

    if (missingMappings.length > 0) {
      return NextResponse.json({ 
        error: 'Faltan mapeos requeridos para Tango', 
        missingMappings 
      }, { status: 428 }); // 428 Precondition Required
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('Error syncing to Tango:', error);
    return NextResponse.json({ error: 'Error interno del servidor al sincronizar' }, { status: 500 });
  }
}
