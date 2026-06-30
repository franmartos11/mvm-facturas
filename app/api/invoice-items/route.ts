import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const invoiceId = url.searchParams.get('invoiceId');

  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId requerido' }, { status: 400 });
  }

  // Verificar sesión
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Verificar propiedad de la factura
  const result = await query(
    `SELECT ii.*
     FROM invoice_items ii
     JOIN invoices inv ON inv.id = ii.invoice_id
     WHERE ii.invoice_id = $1 AND inv.user_id = $2
     ORDER BY ii.id ASC`,
    [invoiceId, user.id]
  );

  return NextResponse.json(result.rows);
}
