import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // 1. Verificar sesión
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Reconstruir el file_path relativo (ej: "42/1750000000_factura.pdf")
  const resolvedParams = await params;
  const relPath = resolvedParams.path.join('/');

  // 3. Verificar que el archivo pertenece al usuario autenticado
  const result = await query(
    'SELECT id FROM invoices WHERE file_path = $1 AND user_id = $2',
    [relPath, user.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  // 4. Leer y servir el archivo
  try {
    const absolutePath = path.join(UPLOADS_DIR, relPath);
    const fileBuffer = await readFile(absolutePath);

    const ext = path.extname(relPath).toLowerCase();
    let contentType = 'application/pdf';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(relPath)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error leyendo el archivo' }, { status: 500 });
  }
}
