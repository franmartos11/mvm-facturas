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
DATABASE SCHEMA (PostgreSQL, read-only access, user_id = ${userId}):

TABLE: invoices
  - id (integer, PK)
  - user_id (integer) ← ALWAYS filter by this = ${userId}
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

TABLE: invoice_items
  - id (integer, PK)
  - invoice_id (integer, FK → invoices.id)
  - description (varchar)
  - quantity (numeric)
  - unit_price (numeric)
  - total_price (numeric)
  - category (varchar)

SQL RULES:
1. ALWAYS include WHERE user_id = ${userId} or JOIN that enforces user_id = ${userId}.
2. ONLY SELECT. Never UPDATE, INSERT, DELETE, ALTER, DROP, TRUNCATE, EXECUTE.
3. Filter invoices by status = 'analyzed' unless the user explicitly asks otherwise.
4. For "este mes": EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
5. Use invoice_date (not created_at) for financial filtering.
6. Limit to 50 rows maximum.
7. Do NOT use -- comments or /* */ blocks in SQL.
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

  let body: { message: string; history?: { role: string; content: string }[]; sessionId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const { message, history = [], sessionId } = body;
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
  const aiUrl = userSettings?.ai_url || process.env.LOCAL_AI_URL;
  const aiModel = userSettings?.ai_model || process.env.LOCAL_AI_MODEL || 'google/gemma-4-e4b';

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
      // Generate a short title using AI
      let title = 'Nuevo Chat';
      try {
        const titleResponse = await openai.chat.completions.create({
          model: aiModel,
          messages: [{ role: 'user', content: `Resume esto en un título corto de máximo 4 palabras (solo el texto, sin comillas): "${message}"` }],
          temperature: 0.3,
          max_tokens: 15,
        });
        title = titleResponse.choices[0]?.message?.content?.trim() || 'Nuevo Chat';
        title = title.replace(/['"]/g, ''); // remove quotes just in case
      } catch (e) {
        console.error('Error generating title', e);
      }

      const sessionRes = await query(
        'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id',
        [user.id, title]
      );
      currentSessionId = sessionRes.rows[0].id;
    } else {
      // Update session updated_at
      await query('UPDATE chat_sessions SET updated_at = now() WHERE id = $1 AND user_id = $2', [currentSessionId, user.id]);
    }

    // ── Step 1: Intent Classification (hardened) ────────────────────────────
    const intentMessages: any[] = [
      {
        role: 'system',
        content: HARDENED_CHAT_SYSTEM_PROMPT(user.id, DB_SCHEMA(user.id)),
      },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Add the SQL generation instruction
    intentMessages.push({
      role: 'system',
      content: `Based on the user question above, generate a SQL query to answer it.
Return ONLY this JSON (nothing before or after):
{
  "sql": "SELECT ...",
  "explanation": "brief note"
}
If the question is not about financial data or invoices, return:
{
  "sql": null,
  "explanation": null,
  "direct_answer": "Lo siento, solo puedo responder preguntas sobre tus facturas y datos financieros del sistema."
}`,
    });

    const sqlResponse = await openai.chat.completions.create({
      model: aiModel,
      messages: intentMessages,
      temperature: 0.05,
      max_tokens: 600,
    });

    const rawOutput = sqlResponse.choices[0]?.message?.content?.trim() || '';

    let sqlPlan: {
      sql: string | null;
      explanation: string | null;
      direct_answer?: string;
    };

    try {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      sqlPlan = JSON.parse(jsonMatch ? jsonMatch[0] : rawOutput);
    } catch {
      sqlPlan = { sql: null, explanation: null, direct_answer: rawOutput };
    }

    // ── Step 2: Handle direct answers ────────────────────────────────────────
    if (!sqlPlan.sql) {
      const answer =
        sqlPlan.direct_answer ||
        'Lo siento, solo puedo responder preguntas sobre tus facturas y datos financieros del sistema.';

      await query(
        'INSERT INTO chat_history (user_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
        [user.id, currentSessionId, 'user', message]
      );
      await query(
        'INSERT INTO chat_history (user_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
        [user.id, currentSessionId, 'assistant', answer]
      );

      return NextResponse.json({ answer, sql: null, sessionId: currentSessionId });
    }

    // ── Step 3: Validate SQL (hardened) ──────────────────────────────────────
    const sqlValidation = validateSql(sqlPlan.sql, user.id);
    if (!sqlValidation.isValid) {
      console.warn(`[SECURITY] Invalid SQL generated for user ${user.id}: ${sqlValidation.error}\nSQL: ${sqlPlan.sql}`);
      return NextResponse.json({
        answer: 'No pude generar una consulta segura para esa pregunta. ¿Podrías reformularla?',
        sql: null,
      });
    }

    // ── Step 4: Execute SQL in READ-ONLY transaction ──────────────────────────
    let queryResult: any[] = [];
    let sqlError: string | null = null;

    try {
      // Use a read-only transaction for extra safety
      await query('BEGIN READ ONLY');
      try {
        const result = await query(sqlPlan.sql);
        queryResult = result.rows;
        await query('COMMIT');
      } catch (e) {
        await query('ROLLBACK');
        throw e;
      }
    } catch (e: any) {
      sqlError = e.message;
    }

    // ── Step 5: Format answer ─────────────────────────────────────────────────
    const answerContent = sqlError
      ? `The user asked: "${message}"\nThe query failed: ${sqlError}\nExplain in Spanish that there was a data retrieval error and suggest rephrasing.`
      : ANSWER_PROMPT(message, queryResult, sqlPlan.sql);

    const answerResponse = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: 'You are a financial data assistant. Answer ONLY in Spanish. Be concise and factual. Never invent data.',
        },
        { role: 'user', content: answerContent },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const answer =
      answerResponse.choices[0]?.message?.content?.trim() ||
      'No pude generar una respuesta.';

    // ── Step 6: Save to history ───────────────────────────────────────────────
    await query(
      'INSERT INTO chat_history (user_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
      [user.id, currentSessionId, 'user', message]
    );
    await query(
      'INSERT INTO chat_history (user_id, session_id, role, content, sql_query) VALUES ($1, $2, $3, $4, $5)',
      [user.id, currentSessionId, 'assistant', answer, sqlPlan.sql]
    );

    return NextResponse.json({
      answer,
      sql: sqlPlan.sql,
      rowCount: queryResult.length,
      rawData: queryResult.slice(0, 10),
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
    'SELECT role, content, sql_query, created_at FROM chat_history WHERE user_id = $1 AND session_id = $2 ORDER BY created_at ASC',
    [user.id, sessionId]
  );

  return NextResponse.json({ history: result.rows });
}

export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await query('DELETE FROM chat_history WHERE user_id = $1', [user.id]);
  return NextResponse.json({ success: true });
}
