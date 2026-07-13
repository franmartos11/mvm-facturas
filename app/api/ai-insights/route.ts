import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/guardrails';

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const rateLimitResult = checkRateLimit(user.id);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: `Límite alcanzado. Intentá de nuevo en ${Math.ceil(rateLimitResult.resetInMs / 60000)} minutos.` },
      { status: 429 }
    );
  }

  let body: { type: 'savings' | 'narrative'; invoiceStats?: any };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const { type } = body;
  if (!type || !['savings', 'narrative'].includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido. Usa "savings" o "narrative".' }, { status: 400 });
  }

  // ── Obtener config de IA del usuario ──────────────────────────────────────
  const userResult = await query('SELECT ai_url, ai_model FROM users WHERE id = $1', [user.id]);
  const userSettings = userResult.rows[0];
  const aiUrl: string = String(userSettings?.ai_url || process.env.LOCAL_AI_URL || '');
  const aiModel: string = String(userSettings?.ai_model || process.env.LOCAL_AI_MODEL || 'google/gemma-4-e4b');

  if (!aiUrl) {
    return NextResponse.json({ error: 'No hay URL de IA configurada en Ajustes.' }, { status: 400 });
  }

  // ── Construir contexto estadístico de los datos del usuario ───────────────
  try {
    // Top categorías (solo compras)
    const categoryRes = await query(`
      SELECT category, 
             COUNT(*) as invoice_count,
             SUM(total) as total_amount,
             AVG(total) as avg_amount
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND invoice_type = 'compra' AND total > 0
      GROUP BY category ORDER BY total_amount DESC LIMIT 7
    `, [user.id]);

    // Top proveedores (solo compras)
    const supplierRes = await query(`
      SELECT supplier,
             COUNT(*) as invoice_count,
             SUM(total) as total_amount
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND invoice_type = 'compra' AND supplier IS NOT NULL AND total > 0
      GROUP BY supplier ORDER BY total_amount DESC LIMIT 5
    `, [user.id]);

    // Resumen de ventas
    const salesRes = await query(`
      SELECT COUNT(*) as invoice_count,
             SUM(total) as total_revenue,
             AVG(total) as avg_amount
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND invoice_type = 'venta' AND total > 0
    `, [user.id]);

    // Tendencia mensual (últimos 6 meses, solo compras)
    const monthlyRes = await query(`
      SELECT TO_CHAR(DATE_TRUNC('month', invoice_date), 'YYYY-MM') as month,
             SUM(total) as total,
             COUNT(*) as invoice_count
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND invoice_type = 'compra'
        AND invoice_date >= NOW() - INTERVAL '6 months'
        AND total > 0
      GROUP BY DATE_TRUNC('month', invoice_date)
      ORDER BY month ASC
    `, [user.id]);

    // Facturas con anomalías (solo compras)
    const anomalyRes = await query(`
      SELECT supplier, total, anomaly_score
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND invoice_type = 'compra'
        AND anomaly_score >= 2.0
      ORDER BY anomaly_score DESC LIMIT 3
    `, [user.id]);

    // Totales globales
    const totalsRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN invoice_type = 'compra' THEN total ELSE 0 END), 0) as total_purchases,
        COALESCE(SUM(CASE WHEN invoice_type = 'venta' THEN total ELSE 0 END), 0) as total_sales,
        COUNT(CASE WHEN invoice_type = 'compra' THEN 1 END) as purchase_count,
        COUNT(CASE WHEN invoice_type = 'venta' THEN 1 END) as sales_count
      FROM invoices
      WHERE user_id = $1 AND status = 'analyzed' AND total > 0
    `, [user.id]);

    const stats = totalsRes.rows[0];
    const categories = categoryRes.rows;
    const suppliers = supplierRes.rows;
    const monthly = monthlyRes.rows;
    const anomalies = anomalyRes.rows;
    const sales = salesRes.rows[0];

    const contextSummary = `
RESUMEN FINANCIERO DEL USUARIO (datos reales de su sistema de facturas):

📊 TOTALES GLOBALES:
- Total facturado en compras: $${Number(stats.total_purchases).toLocaleString('es-ES', { maximumFractionDigits: 2 })} (${stats.purchase_count} facturas)
- Total facturado en ventas: $${Number(stats.total_sales).toLocaleString('es-ES', { maximumFractionDigits: 2 })} (${stats.sales_count} facturas)

🛒 TOP CATEGORÍAS DE GASTO (compras):
${categories.map(c => `- ${c.category}: $${Number(c.total_amount).toLocaleString('es-ES', { maximumFractionDigits: 0 })} total (${c.invoice_count} facturas, promedio $${Number(c.avg_amount).toLocaleString('es-ES', { maximumFractionDigits: 0 })})`).join('\n')}

🏢 TOP PROVEEDORES (compras):
${suppliers.map(s => `- ${s.supplier}: $${Number(s.total_amount).toLocaleString('es-ES', { maximumFractionDigits: 0 })} total (${s.invoice_count} facturas)`).join('\n')}

📅 TENDENCIA MENSUAL (últimos 6 meses, compras):
${monthly.map(m => `- ${m.month}: $${Number(m.total).toLocaleString('es-ES', { maximumFractionDigits: 0 })} (${m.invoice_count} facturas)`).join('\n')}

💰 VENTAS:
${(sales as any).invoice_count > 0 ? `- Ingresos totales por ventas: $${Number((sales as any).total_revenue).toLocaleString('es-ES', { maximumFractionDigits: 0 })}\n- Promedio por venta: $${Number((sales as any).avg_amount).toLocaleString('es-ES', { maximumFractionDigits: 0 })}` : '- No hay facturas de venta registradas'}

⚠️ ANOMALÍAS DETECTADAS (compras inusualmente altas):
${anomalies.length > 0 ? anomalies.map(a => `- ${a.supplier}: $${Number(a.total).toLocaleString('es-ES', { maximumFractionDigits: 0 })} (score: ${Number(a.anomaly_score).toFixed(1)}σ)`).join('\n') : '- No se detectaron anomalías'}
`.trim();

    const openai = new OpenAI({ baseURL: aiUrl, apiKey: 'lm-studio' });

    let systemPrompt: string;
    let userPrompt: string;

    if (type === 'savings') {
      systemPrompt = `Eres un asesor financiero experto para pequeñas y medianas empresas. 
Analiza los datos de gastos del usuario y genera sugerencias de ahorro concretas, prácticas y accionables.
Responde SIEMPRE en español. Sé directo, claro y amigable. No uses markdown headers ni código.
Cada sugerencia debe incluir: qué hacer, por qué, y el impacto estimado en pesos.`;

      userPrompt = `${contextSummary}

Basándote en estos datos reales, genera entre 4 y 6 sugerencias de ahorro concretas y personalizadas. 
Para cada sugerencia:
1. Describe qué debería hacer el usuario
2. Justifica por qué con datos concretos de sus facturas
3. Estima el ahorro potencial en porcentaje o monto

Considera también la relación compras vs ventas si corresponde.
Sé específico y usa los nombres de proveedores/categorías reales del usuario.`;

    } else {
      // narrative — explicación de tendencias
      systemPrompt = `Eres un analista financiero que explica tendencias de gastos en lenguaje natural, amigable y claro.
Analiza los datos y redacta un párrafo narrativo que explique qué está pasando con los gastos del usuario.
Responde SIEMPRE en español. Máximo 3 párrafos. No uses markdown headers ni código.`;

      userPrompt = `${contextSummary}

Redacta un análisis narrativo de 2-3 párrafos que explique:
1. La tendencia general de gastos (¿está subiendo, bajando o estable?)
2. Las categorías o proveedores más relevantes
3. Una observación sobre la relación ingresos (ventas) vs gastos (compras) si hay datos de ambos
4. Si hay anomalías, mencionalas brevemente

Usa un tono profesional pero accesible.`;
    }

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const result = response.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ result, type });

  } catch (error: any) {
    console.error('AI insights error:', error);
    return NextResponse.json({ error: 'Error al comunicarse con la IA: ' + error.message }, { status: 500 });
  }
}
