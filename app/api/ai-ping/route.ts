import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import OpenAI from 'openai';

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    // Obtener config de IA del usuario
    const userResult = await query('SELECT ai_url, ai_model FROM users WHERE id = $1', [user.id]);
    const userSettings = userResult.rows[0];
    const aiUrl = String(userSettings?.ai_url || process.env.LOCAL_AI_URL || '');
    const aiModel = String(userSettings?.ai_model || process.env.LOCAL_AI_MODEL || 'google/gemma-4-e4b');

    if (!aiUrl) {
      return NextResponse.json({ error: 'No hay URL de IA configurada en Ajustes.', status: 'unconfigured' }, { status: 400 });
    }

    const openai = new OpenAI({ baseURL: aiUrl, apiKey: 'lm-studio', timeout: 5000 }); // 5s timeout

    // Hacer un ping muy básico al modelo
    await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    });

    return NextResponse.json({ status: 'ok', model: aiModel });
  } catch (error: any) {
    console.error('AI Ping error:', error);
    return NextResponse.json({ 
      error: 'Error de conexión con la IA. Asegurate de que LM Studio o el servidor local esté corriendo.',
      details: error.message,
      status: 'error'
    }, { status: 500 });
  }
}
