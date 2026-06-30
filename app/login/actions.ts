'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  createToken,
  setSessionCookie,
} from '@/lib/auth';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Email y contraseña son requeridos')}`);
  }

  // Buscar usuario en la DB
  const result = await query<{ id: number; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    redirect(`/login?error=${encodeURIComponent('Email o contraseña incorrectos')}`);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    redirect(`/login?error=${encodeURIComponent('Email o contraseña incorrectos')}`);
  }

  // Crear JWT y setear cookie
  const token = await createToken({ id: user.id, email: user.email });
  await setSessionCookie(token);

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Email y contraseña son requeridos')}`);
  }

  if (password.length < 6) {
    redirect(`/login?error=${encodeURIComponent('La contraseña debe tener al menos 6 caracteres')}`);
  }

  // Verificar si ya existe
  const existing = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    redirect(`/login?error=${encodeURIComponent('Ya existe una cuenta con ese email')}`);
  }

  // Crear usuario
  const passwordHash = await hashPassword(password);
  const insertResult = await query<{ id: number; email: string }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash]
  );

  const newUser = insertResult.rows[0];

  // Crear JWT y setear cookie
  const token = await createToken({ id: newUser.id, email: newUser.email });
  await setSessionCookie(token);

  revalidatePath('/', 'layout');
  redirect('/');
}

