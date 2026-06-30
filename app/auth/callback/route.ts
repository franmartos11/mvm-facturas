
import { NextResponse } from 'next/server';

// Este callback era para Supabase OAuth. Con auth propia (JWT + bcrypt), ya no se utiliza.
// Redirige al inicio por compatibilidad.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}

