import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import OpenAI from 'openai';
import {
  detectPromptInjection,
  validateSql,
  checkRateLimit,
  isObviouslyOffTopic,
  HARDENED_CHAT_SYSTEM_PROMPT,
} from '@/lib/guardrails';

// ─── Schema description sent to the AI ────────────────────────────────────────
const DB_SCHEMA = (userId: number) => `
DATABASE SCHEMA (PostgreSQL, read-only access, company_id = ${userId}):

TABLE: invoices
  - id (integer, PK)
  - company_id (integer) ← ALWAYS filter by this = ${userId}
  - filename (varchar)
  - supplier (varchar)
  - invoice_date (date)
  - created_at (timestamptz)
  - status (varchar) — 'analyzed' | 'pending' | 'error' | 'invalid'
  - subtotal (numeric)
  - tax (numeric)
  - total (numeric)
  - category (varchar) — "Alimentación" | "Hogar" | "Tecnología" | "Transporte" | "Salud" | "Servicios" | "Otros"
  - tags (text[])
  - invoice_type (varchar) — 'compra' (gastos/costos) | 'venta' (ingresos/ventas a clientes)
  - anomaly_score (numeric) — desviaciones estándar sobre la media del proveedor; >= 2.0 = anormal

TABLE: invoice_items
  - id (integer, PK)
  - invoice_id (integer, FK → invoices.id)
  - description (varchar)
  - quantity (numeric)
  - unit_price (numeric)
  - total_price (numeric)
  - category (varchar)

SQL RULES:
1. ALWAYS include WHERE company_id = ${userId} or JOIN that enforces company_id = ${userId}.
2. ONLY SELECT. Never UPDATE, INSERT, DELETE, ALTER, DROP, TRUNCATE, EXECUTE.
3. Filter invoices by status = 'analyzed' unless the user explicitly asks otherwise.
4. For "este mes": EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
5. Use invoice_date (not created_at) for financial filtering.
6. Limit to 50 rows maximum.
7. Do NOT use -- comments or /* */ blocks in SQL.
8. When asked about specific products, amounts, or items, query invoice_items.description using ILIKE (e.g. ILIKE '%cerdo%').
9. IMPORTANT: When the user asks about "gastos" or "costos" or "compras", filter by invoice_type = 'compra'. When they ask about "ingresos" or "ventas" or "facturación", filter by invoice_type = 'venta'. For general totals, include both.
10. To find anomalous invoices, filter by anomaly_score >= 2.0 AND invoice_type = 'compra'.
`;


const ANSWER_PROMPT = (question: string, sqlResult: any[], sql: string) => `
The user asked: "${question}"
SQL used: ${sql}
Results: ${JSON.stringify(sqlResult, null, 2)}

Write a clear, helpful, natural-language answer in Spanish.
- Be concise but informative.
- Format monetary values with 2 decimal places.
- If results are empty, say no data was found.
- Do NOT mention SQL or technical implementation details.
- Do NOT include any markdown headers or code blocks.
`;

// ─── Route Handlers ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // ── Rate Limiting ───────────────────────────────────────────────────────────
  const rateLimitResult = checkRateLimit(user.id);
  if (!rateLimitResult.allowed) {
    const resetMinutes = Math.ceil(rateLimitResult.resetInMs / 60000);
    return NextResponse.json(
      { error: `Límite de mensajes alcanzado. Intentá de nuevo en ${resetMinutes} minutos.` },
      { status: 429 }
    );
  }

  let body: { message: string; history?: { role: string; content: string }[]; sessionId?: number; attachedInvoiceIds?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const { message, history = [], sessionId, attachedInvoiceIds = [] } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
  }

  // ── Fast Off-Topic Check ────────────────────────────────────────────────────
  if (isObviouslyOffTopic(message)) {
    return NextResponse.json({
      answer: 'Lo siento, solo puedo responder preguntas sobre tus facturas y datos financieros del sistema. ¿En qué te puedo ayudar con tus gastos?',
      sql: null,
    });
  }

  // ── Prompt Injection Detection ──────────────────────────────────────────────
  const injectionCheck = detectPromptInjection(message);
  if (injectionCheck.isInjection) {
    console.warn(`[SECURITY] Prompt injection attempt by user ${user.id}: "${message.slice(0, 100)}"`);
    return NextResponse.json({
      answer: 'Lo siento, esa solicitud no está permitida en este sistema. ¿Puedo ayudarte con alguna consulta sobre tus facturas?',
      sql: null,
    });
  }

  // ── Get AI Config ───────────────────────────────────────────────────────────
  const userResult = await query('SELECT ai_url, ai_model FROM users WHERE id = $1', [user.id]);
  const userSettings = userResult.rows[0];
  const aiUrl: string = String(userSettings?.ai_url || process.env.LOCAL_AI_URL || '');
  const aiModel: string = String(userSettings?.ai_model || process.env.LOCAL_AI_MODEL || 'google/gemma-4-e4b');

  if (!aiUrl) {
    return NextResponse.json({
      error: 'No hay URL de IA configurada. Por favor, configúrala en Ajustes.',
    }, { status: 400 });
  }

  const openai = new OpenAI({ baseURL: aiUrl, apiKey: 'lm-studio' });

  try {
    let currentSessionId = sessionId;

    // Create a new session if one doesn't exist
    if (!currentSessionId) {
      let title = 'Nuevo Chat';
      try {
        const titleResponse = await openai.chat.completions.create({
          model: aiModel,
          messages: [{ role: 'user', content: `Resume esto en un título corto de máximo 4 palabras (solo el texto, sin comillas): "${message}"` }],
          temperature: 0.3,
          max_tokens: 15,
        });
        title = titleResponse.choices[0]?.message?.content?.trim() || 'Nuevo Chat';
        title = title.replace(/['"]/g, '');
      } catch (e) {
        console.error('Error generating title', e);
      }

      const sessionRes = await query(
        'INSERT INTO chat_sessions (company_id, title) VALUES ($1, $2) RETURNING id',
        [user.companyId, title]
      );
      currentSessionId = Number(sessionRes.rows[0].id);
    } else {
      await query('UPDATE chat_sessions SET updated_at = now() WHERE id = $1 AND company_id = $2', [currentSessionId, user.companyId]);
    }

    // ── Fetch attached invoices context ────────────────────────────────────
    let attachedContext = '';
    const validAttachedIds: { id: number; supplier: string; invoice_date: string; invoice_number: string | null }[] = [];

    if (attachedInvoiceIds.length > 0) {
      // Limit to 3 invoices max to avoid context overflow
      const safeIds = attachedInvoiceIds.slice(0, 3).filter(id => Number.isInteger(id) && id > 0);
      if (safeIds.length > 0) {
        const invRes = await query<any>(
          `SELECT id, supplier, invoice_date, invoice_number, total FROM invoices WHERE id = ANY($1::int[]) AND company_id = $2`,
          [safeIds, user.companyId]
        );
        const itemsRes = await query<any>(
          `SELECT invoice_id, description, quantity, unit_price, total_price FROM invoice_items WHERE invoice_id = ANY($1::int[]) ORDER BY invoice_id, id`,
          [safeIds]
        );

        const itemsByInvoice: Record<number, any[]> = {};
        for (const row of itemsRes.rows) {
          if (!itemsByInvoice[row.invoice_id]) itemsByInvoice[row.invoice_id] = [];
          itemsByInvoice[row.invoice_id].push(row);
        }

        const contextBlocks = invRes.rows.map(inv => {
          validAttachedIds.push({ id: inv.id, supplier: inv.supplier, invoice_date: inv.invoice_date, invoice_number: inv.invoice_number });
          const dateStr = inv.invoice_date ? new Date(String(inv.invoice_date)).toLocaleDateString('es-ES') : 'Sin fecha';
          const items = (itemsByInvoice[inv.id] || []).map((it: any) =>
            `  - ${it.description} | Cant: ${it.quantity} | P.Unit: $${Number(it.unit_price).toFixed(2)} | Total: $${Number(it.total_price).toFixed(2)}`
          ).join('\n');
          return `Factura ID=${inv.id} — ${inv.supplier}${inv.invoice_number ? ` (${inv.invoice_number})` : ''}, Fecha: ${dateStr}, Total: $${Number(inv.total).toFixed(2)}\nProductos:\n${items || '  (sin items)'}`;
        });

        if (contextBlocks.length > 0) {
          attachedContext = `\n\nCONTEXTO — El usuario adjuntó las siguientes facturas para consultar:
${contextBlocks.join('\n\n')}`;
        }
      }
    }

    // ── Step 1: Generate SQL ─────────────────────────────────────────────────
    // Ask the model to output ONLY a SQL SELECT — no JSON, no wrappers.
    // We then extract the SELECT via regex, which works even if the model
    // adds extra text or markdown around it.
    const sqlMessages: any[] = [
      {
        role: 'system',
        content: `${HARDENED_CHAT_SYSTEM_PROMPT(user.id, DB_SCHEMA(user.id))}${attachedContext}

Your task: write a single PostgreSQL SELECT query that answers the user's question.
Output ONLY the raw SQL query, nothing else. No explanations, no markdown, no JSON.
If the question can be answered DIRECTLY from the CONTEXT above (attached invoices) without needing a DB query, output exactly the word: NO_SQL
If the question is NOT about financial data, invoices, products bought, or business analytics at all, output exactly the word: NO_SQL`,
      },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const sqlResponse = await openai.chat.completions.create({
      model: aiModel,
      messages: sqlMessages,
      temperature: 0.05,
      max_tokens: 500,
    });

    const rawSqlOutput = sqlResponse.choices[0]?.message?.content?.trim() || '';

    // Extract the first SELECT statement found anywhere in the output
    // This handles cases where the model wraps SQL in markdown or adds text
    const selectMatch = rawSqlOutput.match(/SELECT[\s\S]+?(?=;|$)/i);
    const extractedSql = selectMatch ? selectMatch[0].replace(/```/g, '').trim() : null;

    // ── Step 2: Handle non-SQL responses ────────────────────────────────────
    if (!extractedSql || rawSqlOutput.trim().toUpperCase().startsWith('NO_SQL')) {
      let answer = 'Lo siento, solo puedo responder preguntas sobre tus facturas y datos financieros del sistema. ¿En qué te puedo ayudar con tus gastos?';

      // If we have attached invoice context, answer directly from it (no SQL needed)
      if (attachedContext) {
        const invLinkGuide = validAttachedIds.length > 0
          ? `\nWhen mentioning any invoice, use these markdown links: ${validAttachedIds.map(inv => {
              const d = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('es-ES') : '';
              return `[${inv.supplier}${d ? ' - ' + d : ''}](/invoices/${inv.id})`;
            }).join(', ')}.`
          : '';
        const contextResponse = await openai.chat.completions.create({
          model: aiModel,
          messages: [
            { role: 'system', content: `Eres un asistente financiero. Responde SIEMPRE en español. Sé conciso, claro y amigable. Nunca menciones SQL ni detalles técnicos.${invLinkGuide}` },
            { role: 'user', content: `${attachedContext}\n\nPregunta del usuario: ${message}` },
          ],
          temperature: 0.4,
          max_tokens: 600,
        });
        answer = contextResponse.choices[0]?.message?.content?.trim() || answer;
      }

      await query(
        'INSERT INTO chat_history (company_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
        [user.companyId, currentSessionId, 'user', message]
      );
      await query(
        'INSERT INTO chat_history (company_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
        [user.companyId, currentSessionId, 'assistant', answer]
      );

      return NextResponse.json({ answer, sessionId: currentSessionId });
    }

    // ── Step 3: Validate SQL (security) ──────────────────────────────────────
    const sqlValidation = validateSql(extractedSql, user.id);
    if (!sqlValidation.isValid) {
      console.warn(`[SECURITY] Invalid SQL for user ${user.id}: ${sqlValidation.error}\nSQL: ${extractedSql}`);
      return NextResponse.json({
        answer: 'No pude generar una consulta segura para esa pregunta. ¿Podrías reformularla?',
      });
    }

    // ── Step 4: Execute SQL (read-only) ───────────────────────────────────────
    let queryResult: any[] = [];
    let sqlError: string | null = null;

    try {
      await query('BEGIN READ ONLY');
      try {
        const result = await query(extractedSql);
        queryResult = result.rows;
        await query('COMMIT');
      } catch (e) {
        await query('ROLLBACK');
        throw e;
      }
    } catch (e: any) {
      sqlError = e.message;
      console.error('[SQL ERROR]', e.message, '\nSQL:', extractedSql);
    }

    // ── Step 5: Generate natural language answer ──────────────────────────────
    // Build a lookup of all invoice IDs known from query results + attached invoices
    const knownInvoiceIds: Record<number, { supplier: string; date: string }> = {};
    for (const inv of validAttachedIds) {
      const dateStr = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('es-ES') : '';
      knownInvoiceIds[inv.id] = { supplier: inv.supplier || 'Factura', date: dateStr };
    }
    // Also pick up IDs from SQL results
    for (const row of queryResult) {
      if (row.id && row.supplier) {
        const dateStr = row.invoice_date ? new Date(row.invoice_date).toLocaleDateString('es-ES') : '';
        knownInvoiceIds[Number(row.id)] = { supplier: row.supplier, date: dateStr };
      }
    }

    const invoiceLinkGuide = Object.keys(knownInvoiceIds).length > 0
      ? `\nWhen mentioning any of these invoices by name or date, format them as markdown links exactly like this: [Supplier - Date](/invoices/ID). Known invoices: ${Object.entries(knownInvoiceIds).map(([id, v]) => `ID=${id}: "${v.supplier}" (${v.date}) → [${v.supplier}${v.date ? ' - ' + v.date : ''}](/invoices/${id})`).join(', ')}.`
      : '';

    const resultSummary = sqlError
      ? `The query failed with error: ${sqlError}. Tell the user in Spanish there was an error retrieving data and suggest rephrasing.`
      : `${attachedContext ? 'CONTEXT (attached invoices): use this to answer if relevant.\n' + attachedContext + '\n\n' : ''}The user asked: "${message}"
Query results (${queryResult.length} rows): ${JSON.stringify(queryResult, null, 2)}

Write a clear, natural answer in Spanish.
- Be concise but informative.
- Format monetary values nicely (e.g. $1.234,56).
- If results are empty, say no data was found for the period.
- Do NOT mention SQL, databases, queries, or any technical details.
- Do NOT use markdown headers or code blocks.
- Write as if you are a helpful financial assistant explaining the data.${invoiceLinkGuide}`;

    const answerResponse = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente financiero. Responde SIEMPRE en español. Sé conciso, claro y amigable. Nunca menciones SQL ni detalles técnicos. Nunca inventes datos.',
        },
        { role: 'user', content: resultSummary },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const answer =
      answerResponse.choices[0]?.message?.content?.trim() ||
      'No pude generar una respuesta en este momento.';

    // ── Step 6: Save to history ───────────────────────────────────────────────
    await query(
      'INSERT INTO chat_history (company_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
      [user.companyId, currentSessionId, 'user', message]
    );
    await query(
      'INSERT INTO chat_history (company_id, session_id, role, content, sql_query) VALUES ($1, $2, $3, $4, $5)',
      [user.companyId, currentSessionId, 'assistant', answer, extractedSql]
    );

    return NextResponse.json({
      answer,
      sessionId: currentSessionId,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Error al comunicarse con la IA: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Falta sessionId' }, { status: 400 });
  }

  const result = await query(
    'SELECT role, content, sql_query, created_at FROM chat_history WHERE company_id = $1 AND session_id = $2 ORDER BY created_at ASC',
    [user.companyId, sessionId]
  );

  return NextResponse.json({ history: result.rows });
}

export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await query('DELETE FROM chat_history WHERE company_id = $1', [user.companyId]);
  return NextResponse.json({ success: true });
}
