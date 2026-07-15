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
  const result = await query<{ id: number; email: string; password_hash: string; company_id: number; role: 'admin' | 'member' }>(
    `SELECT u.id, u.email, u.password_hash, cm.company_id, cm.role 
     FROM users u 
     LEFT JOIN company_members cm ON u.id = cm.user_id 
     WHERE u.email = $1 LIMIT 1`,
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

  if (!user.company_id) {
    redirect(`/login?error=${encodeURIComponent('El usuario no pertenece a ninguna empresa')}`);
  }

  // Crear JWT y setear cookie
  const token = await createToken({ 
    id: user.id, 
    email: user.email, 
    companyId: user.company_id, 
    role: user.role 
  });
  await setSessionCookie(token);

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  let companyName = formData.get('companyName') as string;

  if (!email || !password) {
    redirect(`/register?error=${encodeURIComponent('Email y contraseña son requeridos')}`);
  }

  if (password.length < 6) {
    redirect(`/register?error=${encodeURIComponent('La contraseña debe tener al menos 6 caracteres')}`);
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
  const insertUserResult = await query<{ id: number; email: string }>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash]
  );
  const newUser = insertUserResult.rows[0];

  if (!companyName) {
    companyName = email.split('@')[0];
  }

  const insertCompanyResult = await query<{ id: number }>(
    'INSERT INTO companies (name) VALUES ($1) RETURNING id',
    [companyName]
  );
  const newCompanyId = insertCompanyResult.rows[0].id;

  await query(
    'INSERT INTO company_members (company_id, user_id, role) VALUES ($1, $2, $3)',
    [newCompanyId, newUser.id, 'admin']
  );

  // Crear JWT y setear cookie
  const token = await createToken({ 
    id: newUser.id, 
    email: newUser.email, 
    companyId: newCompanyId, 
    role: 'admin' 
  });
  await setSessionCookie(token);

  revalidatePath('/', 'layout');
  redirect('/');
}

