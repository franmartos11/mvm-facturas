import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await query(
      'SELECT id, title, updated_at FROM chat_sessions WHERE company_id = $1 ORDER BY updated_at DESC',
      [user.companyId]
    );
    return NextResponse.json({ sessions: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    if (id) {
      // Delete a single session
      await query('DELETE FROM chat_sessions WHERE company_id = $1 AND id = $2', [user.companyId, id]);
    } else {
      // Delete all sessions
      await query('DELETE FROM chat_sessions WHERE company_id = $1', [user.companyId]);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
