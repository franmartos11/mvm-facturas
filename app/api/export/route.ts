import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const supplier = searchParams.get('supplier') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';

    // Build query conditions
    const conditions = ['inv.user_id = $1'];
    const values: any[] = [user.id];
    let paramCount = 1;

    // By default, exclude invalid and error unless explicitly requested
    if (!status) {
      conditions.push(`inv.status NOT IN ('invalid', 'error')`);
    } else {
      paramCount++;
      conditions.push(`inv.status = $${paramCount}`);
      values.push(status);
    }

    if (supplier) {
      paramCount++;
      conditions.push(`inv.supplier = $${paramCount}`);
      values.push(supplier);
    }

    if (dateFrom) {
      paramCount++;
      conditions.push(`(inv.invoice_date >= $${paramCount} OR (inv.invoice_date IS NULL AND inv.created_at >= $${paramCount}))`);
      values.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      conditions.push(`(inv.invoice_date <= $${paramCount} OR (inv.invoice_date IS NULL AND inv.created_at <= $${paramCount}))`);
      values.push(dateTo + ' 23:59:59');
    }

    if (minAmount) {
      paramCount++;
      conditions.push(`inv.total >= $${paramCount}`);
      values.push(minAmount);
    }

    if (maxAmount) {
      paramCount++;
      conditions.push(`inv.total <= $${paramCount}`);
      values.push(maxAmount);
    }

    const whereClause = conditions.join(' AND ');

    // 1. Get Invoices for "Resumen" sheet
    let invoicesQuery = `
      SELECT 
        inv.id as invoice_id,
        inv.filename,
        inv.supplier,
        inv.invoice_date,
        inv.created_at,
        inv.subtotal,
        inv.tax,
        inv.total,
        inv.status,
        inv.tags
      FROM invoices inv
      WHERE ${whereClause}
      ORDER BY inv.created_at DESC
    `;

    // 2. Get Items for "Desglose" sheet
    let itemsQuery = `
      SELECT 
        inv.id as invoice_id,
        inv.filename,
        inv.supplier,
        inv.invoice_date,
        ii.description,
        ii.category,
        ii.quantity,
        ii.unit_price,
        ii.total_price
      FROM invoices inv
      JOIN invoice_items ii ON inv.id = ii.invoice_id
      WHERE ${whereClause}
      ORDER BY inv.created_at DESC, ii.id ASC
    `;

    const [invoicesResult, itemsResult] = await Promise.all([
      query(invoicesQuery, values),
      query(itemsQuery, values)
    ]);

    // Additional JS-level filtering for "search" (tags, filename, supplier) since tags is a string[] in postgres which is trickier to query without specific operators
    let filteredInvoices = invoicesResult.rows;
    let filteredItems = itemsResult.rows;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(inv => {
        return (
          inv.filename.toLowerCase().includes(searchLower) ||
          (inv.supplier && inv.supplier.toLowerCase().includes(searchLower)) ||
          (inv.tags && inv.tags.some((t: string) => t.toLowerCase().includes(searchLower)))
        );
      });
      
      const validInvoiceIds = new Set(filteredInvoices.map(inv => inv.invoice_id));
      filteredItems = filteredItems.filter(item => validInvoiceIds.has(item.invoice_id));
    }

    if (filteredInvoices.length === 0) {
      return new NextResponse('No hay datos para exportar con los filtros actuales.', { status: 404 });
    }

    // Prepare Data for Excel
    const resumenData = filteredInvoices.map(row => ({
      'ID': row.invoice_id,
      'Archivo': row.filename,
      'Proveedor': row.supplier || 'Desconocido',
      'Fecha Factura': row.invoice_date ? new Date(row.invoice_date).toLocaleDateString('es-ES') : new Date(row.created_at).toLocaleDateString('es-ES'),
      'Subtotal': Number(row.subtotal) || 0,
      'IVA': Number(row.tax) || 0,
      'Total': Number(row.total) || 0,
      'Estado': row.status,
      'Etiquetas': row.tags ? row.tags.join(', ') : ''
    }));

    const desgloseData = filteredItems.map(row => ({
      'ID Factura': row.invoice_id,
      'Archivo': row.filename,
      'Proveedor': row.supplier || 'Desconocido',
      'Producto/Servicio': row.description,
      'Categoría': row.category,
      'Cantidad': Number(row.quantity) || 1,
      'Precio Unitario': Number(row.unit_price) || 0,
      'Total Producto': Number(row.total_price) || 0
    }));

    // Create Excel Workbook
    const wb = XLSX.utils.book_new();

    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Facturas');

    if (desgloseData.length > 0) {
      const wsDesglose = XLSX.utils.json_to_sheet(desgloseData);
      XLSX.utils.book_append_sheet(wb, wsDesglose, 'Desglose Ítems');
    }

    // Write to buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="exportacion_facturas.xlsx"',
      },
    });

  } catch (error) {
    console.error('Error exportando Excel:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
