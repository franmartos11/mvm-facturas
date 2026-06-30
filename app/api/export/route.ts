import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Obtener ítems con información de la factura
    const result = await query(`
      SELECT 
        inv.id as invoice_id,
        inv.filename,
        inv.supplier,
        inv.invoice_date,
        inv.subtotal,
        inv.tax,
        inv.total,
        inv.status,
        ii.description,
        ii.quantity,
        ii.unit_price,
        ii.total_price
      FROM invoices inv
      LEFT JOIN invoice_items ii ON inv.id = ii.invoice_id
      WHERE inv.user_id = $1
      ORDER BY inv.created_at DESC, ii.id ASC
    `, [user.id]);

    const rows = result.rows;

    if (rows.length === 0) {
      return new NextResponse('No hay datos para exportar.', { status: 404 });
    }

    // Construir CSV
    const headers = [
      'ID Factura', 'Archivo', 'Proveedor', 'Fecha Factura', 
      'Subtotal Factura', 'IVA Factura', 'Total Factura', 'Estado',
      'Producto', 'Cantidad', 'Precio Unitario', 'Total Producto'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '';
      const stringified = String(str);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    let csvContent = headers.join(',') + '\n';

    rows.forEach(row => {
      const rowData = [
        row.invoice_id,
        row.filename,
        row.supplier,
        row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : '',
        row.subtotal,
        row.tax,
        row.total,
        row.status,
        row.description,
        row.quantity,
        row.unit_price,
        row.total_price
      ];
      csvContent += rowData.map(escapeCsv).join(',') + '\n';
    });

    return new NextResponse('\uFEFF' + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="exportacion_facturas.csv"',
      },
    });

  } catch (error) {
    console.error('Error exportando CSV:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
