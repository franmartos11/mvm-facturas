import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const result = await query(
    `SELECT id, filename, supplier, invoice_date
     FROM invoices
     WHERE company_id = $1 AND status = 'analyzed'
     ORDER BY invoice_date DESC NULLS LAST, created_at DESC
     LIMIT 100`,
    [user.companyId]
  );

  return NextResponse.json({ invoices: result.rows });
}
