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
    // 1. Totals (month vs prev month)
    const totalsQuery = await query(`
      SELECT 
        SUM(CASE WHEN date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE) THEN total ELSE 0 END) as current_month,
        SUM(CASE WHEN date_trunc('month', invoice_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN total ELSE 0 END) as prev_month
      FROM invoices 
      WHERE company_id = $1 AND status = 'analyzed'
    `, [user.companyId]);

    // 2. Monthly by invoice_type (last 12 months) — compras vs ventas
    const monthlyQuery = await query(`
      SELECT 
        to_char(date_trunc('month', invoice_date), 'Mon YYYY') as month,
        date_trunc('month', invoice_date) as month_date,
        SUM(CASE WHEN invoice_type = 'compra' OR invoice_type IS NULL THEN total ELSE 0 END) as compras,
        SUM(CASE WHEN invoice_type = 'venta' THEN total ELSE 0 END) as ventas,
        SUM(total) as total
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed' 
        AND invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
      GROUP BY date_trunc('month', invoice_date)
      ORDER BY date_trunc('month', invoice_date)
    `, [user.companyId]);

    // 3. Categories
    const categoryQuery = await query(`
      SELECT 
        category,
        SUM(total) as total,
        COUNT(*) as count
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed' AND category IS NOT NULL
      GROUP BY category
      ORDER BY total DESC
    `, [user.companyId]);

    // 4. Top Suppliers with frequency and avg ticket
    const suppliersQuery = await query(`
      SELECT 
        supplier,
        SUM(total) as total,
        COUNT(id) as count,
        AVG(total) as avg_ticket,
        MAX(invoice_date) as last_invoice
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed' 
        AND supplier IS NOT NULL AND supplier != 'Desconocido'
      GROUP BY supplier
      ORDER BY total DESC
      LIMIT 10
    `, [user.companyId]);

    // 5. Tax pressure by category — avg(tax/subtotal) per category
    const taxPressureQuery = await query(`
      SELECT 
        category,
        ROUND(AVG(CASE WHEN subtotal > 0 THEN (tax / subtotal) * 100 ELSE 0 END)::numeric, 1) as avg_tax_rate,
        SUM(tax) as total_tax,
        COUNT(*) as count
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed' 
        AND category IS NOT NULL AND subtotal > 0
      GROUP BY category
      ORDER BY avg_tax_rate DESC
    `, [user.companyId]);

    // 6. Daily heatmap — spend per day (last 90 days)
    const heatmapQuery = await query(`
      SELECT 
        invoice_date::text as date,
        SUM(total) as total,
        COUNT(*) as count
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed'
        AND invoice_date >= CURRENT_DATE - INTERVAL '90 days'
        AND invoice_date IS NOT NULL
      GROUP BY invoice_date
      ORDER BY invoice_date
    `, [user.companyId]);

    // 7. Result by month (ventas - compras)
    const resultQuery = await query(`
      SELECT 
        to_char(date_trunc('month', invoice_date), 'Mon YYYY') as month,
        date_trunc('month', invoice_date) as month_date,
        SUM(CASE WHEN invoice_type = 'venta' THEN total ELSE 0 END) -
        SUM(CASE WHEN invoice_type = 'compra' OR invoice_type IS NULL THEN total ELSE 0 END) as resultado,
        SUM(CASE WHEN invoice_type = 'venta' THEN total ELSE 0 END) as ingresos,
        SUM(CASE WHEN invoice_type = 'compra' OR invoice_type IS NULL THEN total ELSE 0 END) as egresos
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed'
        AND invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
      GROUP BY date_trunc('month', invoice_date)
      ORDER BY date_trunc('month', invoice_date)
    `, [user.companyId]);

    // 8. Duplicate invoices detection (same supplier_cuit + invoice_number)
    const duplicatesQuery = await query(`
      SELECT 
        supplier,
        supplier_cuit,
        invoice_number,
        COUNT(*) as occurrences,
        ARRAY_AGG(id) as invoice_ids,
        ARRAY_AGG(total::text) as totals,
        ARRAY_AGG(invoice_date::text) as dates
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed'
        AND invoice_number IS NOT NULL AND supplier_cuit IS NOT NULL
      GROUP BY supplier, supplier_cuit, invoice_number
      HAVING COUNT(*) > 1
      LIMIT 20
    `, [user.companyId]);

    // 9. Payment method distribution with amounts
    const paymentQuery = await query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total) as total
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed'
        AND payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY total DESC
    `, [user.companyId]);

    // 10. Payment terms (avg days between invoice_date and due_date) per supplier
    const paymentTermsQuery = await query(`
      SELECT 
        supplier,
        ROUND(AVG(due_date - invoice_date)::numeric, 0) as avg_days_to_pay,
        COUNT(*) as count
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed'
        AND due_date IS NOT NULL AND invoice_date IS NOT NULL
        AND supplier IS NOT NULL AND supplier != 'Desconocido'
        AND due_date > invoice_date
      GROUP BY supplier
      HAVING COUNT(*) >= 2
      ORDER BY avg_days_to_pay DESC
      LIMIT 10
    `, [user.companyId]);

    // 11. Top customers (from sales invoices)
    const customersQuery = await query(`
      SELECT 
        customer_name,
        customer_cuit,
        SUM(total) as total,
        COUNT(*) as count,
        AVG(total) as avg_ticket
      FROM invoices
      WHERE company_id = $1 AND status = 'analyzed'
        AND invoice_type = 'venta'
        AND customer_name IS NOT NULL
      GROUP BY customer_name, customer_cuit
      ORDER BY total DESC
      LIMIT 10
    `, [user.companyId]);

    // 12. Product inflation — avg unit_price per description per month
    const inflationQuery = await query(`
      SELECT 
        ii.description,
        to_char(date_trunc('month', inv.invoice_date), 'Mon YYYY') as month,
        date_trunc('month', inv.invoice_date) as month_date,
        ROUND(AVG(ii.unit_price)::numeric, 2) as avg_price,
        COUNT(*) as count
      FROM invoice_items ii
      JOIN invoices inv ON inv.id = ii.invoice_id
      WHERE inv.company_id = $1 AND inv.status = 'analyzed'
        AND inv.invoice_date IS NOT NULL
        AND ii.description IS NOT NULL
        AND ii.unit_price > 0
      GROUP BY ii.description, date_trunc('month', inv.invoice_date)
      HAVING COUNT(*) >= 1
      ORDER BY ii.description, date_trunc('month', inv.invoice_date)
    `, [user.companyId]);

    // Group inflation data by product
    const inflationByProduct: Record<string, any[]> = {};
    for (const row of inflationQuery.rows) {
      const desc = String(row.description);
      if (!inflationByProduct[desc]) {
        inflationByProduct[desc] = [];
      }
      inflationByProduct[desc].push({
        month: row.month,
        avg_price: Number(row.avg_price),
        count: Number(row.count),
      });
    }
    // Only keep products that appear in at least 2 months
    const productInflation = Object.entries(inflationByProduct)
      .filter(([, points]) => points.length >= 2)
      .map(([description, points]) => {
        const first = points[0].avg_price;
        const last = points[points.length - 1].avg_price;
        const change = first > 0 ? ((last - first) / first) * 100 : 0;
        return { description, points, change: Number(change.toFixed(1)) };
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 10);

    return NextResponse.json({
      totals: {
        currentMonth: Number(totalsQuery.rows[0]?.current_month || 0),
        prevMonth: Number(totalsQuery.rows[0]?.prev_month || 0),
      },
      monthly: monthlyQuery.rows.map((r: any) => ({
        month: r.month,
        compras: Number(r.compras),
        ventas: Number(r.ventas),
        total: Number(r.total),
      })),
      categories: categoryQuery.rows.map((r: any) => ({
        ...r,
        total: Number(r.total),
        count: Number(r.count),
      })),
      suppliers: suppliersQuery.rows.map((r: any) => ({
        ...r,
        total: Number(r.total),
        count: Number(r.count),
        avg_ticket: Number(r.avg_ticket),
      })),
      taxPressure: taxPressureQuery.rows.map((r: any) => ({
        ...r,
        avg_tax_rate: Number(r.avg_tax_rate),
        total_tax: Number(r.total_tax),
        count: Number(r.count),
      })),
      heatmap: heatmapQuery.rows.map((r: any) => ({
        date: r.date,
        total: Number(r.total),
        count: Number(r.count),
      })),
      result: resultQuery.rows.map((r: any) => ({
        month: r.month,
        resultado: Number(r.resultado),
        ingresos: Number(r.ingresos),
        egresos: Number(r.egresos),
      })),
      duplicates: duplicatesQuery.rows.map((r: any) => ({
        ...r,
        occurrences: Number(r.occurrences),
      })),
      paymentMethods: paymentQuery.rows.map((r: any) => ({
        ...r,
        count: Number(r.count),
        total: Number(r.total),
      })),
      paymentTerms: paymentTermsQuery.rows.map((r: any) => ({
        ...r,
        avg_days_to_pay: Number(r.avg_days_to_pay),
        count: Number(r.count),
      })),
      customers: customersQuery.rows.map((r: any) => ({
        ...r,
        total: Number(r.total),
        count: Number(r.count),
        avg_ticket: Number(r.avg_ticket),
      })),
      productInflation,
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

