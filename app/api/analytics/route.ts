import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Totals
    const totalsQuery = await query(`
      SELECT 
        SUM(CASE WHEN date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE) THEN total ELSE 0 END) as current_month,
        SUM(CASE WHEN date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN total ELSE 0 END) as prev_month
      FROM invoices 
      WHERE user_id = $1 AND status = 'analyzed'
    `, [user.id]);

    // 2. Expenses by Month (Last 6 months)
    const monthlyQuery = await query(`
      SELECT 
        to_char(date_trunc('month', invoice_date), 'Mon YYYY') as month,
        SUM(total) as total
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY date_trunc('month', invoice_date)
      ORDER BY date_trunc('month', invoice_date)
    `, [user.id]);

    // 3. Expenses by Category (All time or current month? Let's do all time for now)
    const categoryQuery = await query(`
      SELECT 
        category,
        SUM(total) as total
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND category IS NOT NULL
      GROUP BY category
      ORDER BY total DESC
    `, [user.id]);

    // 4. Top Suppliers
    const suppliersQuery = await query(`
      SELECT 
        supplier,
        SUM(total) as total,
        COUNT(id) as count
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND supplier IS NOT NULL AND supplier != 'Desconocido'
      GROUP BY supplier
      ORDER BY total DESC
      LIMIT 5
    `, [user.id]);

    return NextResponse.json({
      totals: {
        currentMonth: Number(totalsQuery.rows[0]?.current_month || 0),
        prevMonth: Number(totalsQuery.rows[0]?.prev_month || 0),
      },
      monthly: monthlyQuery.rows.map((r: any) => ({ ...r, total: Number(r.total) })),
      categories: categoryQuery.rows.map((r: any) => ({ ...r, total: Number(r.total) })),
      suppliers: suppliersQuery.rows.map((r: any) => ({ ...r, total: Number(r.total) }))
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
