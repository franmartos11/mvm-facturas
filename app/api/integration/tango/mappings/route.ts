import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

// GET: Retrieve all mappings for the current user
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await query(
      'SELECT mapping_type, source_name, tango_code FROM tango_mappings WHERE company_id = $1',
      [user.companyId]
    );
    return NextResponse.json({ mappings: result.rows });
  } catch (error: any) {
    console.error('Error fetching mappings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Bulk insert or update mappings
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { mappings } = body as { mappings: { mapping_type: string, source_name: string, tango_code: string }[] };

    if (!Array.isArray(mappings)) {
      return NextResponse.json({ error: 'Formato inválido. Se espera un array de mappings.' }, { status: 400 });
    }

    // Insert or update on conflict
    for (const mapping of mappings) {
      if (!mapping.mapping_type || !mapping.source_name || !mapping.tango_code) continue;
      
      await query(
        `INSERT INTO tango_mappings (company_id, mapping_type, source_name, tango_code) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, mapping_type, source_name) 
         DO UPDATE SET tango_code = EXCLUDED.tango_code, created_at = CURRENT_TIMESTAMP`,
        [user.companyId, mapping.mapping_type, mapping.source_name, mapping.tango_code]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving mappings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE: Delete a mapping
export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const mapping_type = searchParams.get('mapping_type');
    const source_name = searchParams.get('source_name');

    if (!mapping_type || !source_name) {
      return NextResponse.json({ error: 'Faltan parámetros de búsqueda' }, { status: 400 });
    }

    await query(
      'DELETE FROM tango_mappings WHERE company_id = $1 AND mapping_type = $2 AND source_name = $3',
      [user.companyId, mapping_type, source_name]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting mapping:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
