'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';

export type ActionResponse = { error?: string; success?: string };

export async function updateCompanyInfo(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return { error: 'No autorizado' };
  }

  const name = formData.get('name') as string;
  const cuit = formData.get('cuit') as string;

  if (!name) return { error: 'El nombre es requerido' };

  try {
    await query('UPDATE companies SET name = $1, cuit = $2 WHERE id = $3', [name, cuit, user.companyId]);
    revalidatePath('/settings/company');
    return { success: 'Información actualizada correctamente' };
  } catch (e) {
    return { error: 'Error al actualizar la información' };
  }
}

export async function inviteMember(prevState: ActionResponse, formData: FormData): Promise<ActionResponse> {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return { error: 'No autorizado' };
  }

  const email = formData.get('email') as string;
  const role = formData.get('role') as string;

  if (!email || !role) return { error: 'Email y rol son requeridos' };

  try {
    // 1. Chequear si el usuario existe
    let targetUserRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    let targetUserId;
    let newPassword = null;

    if (targetUserRes.rows.length > 0) {
      targetUserId = targetUserRes.rows[0].id;
    } else {
      // 2. Crear usuario si no existe
      newPassword = Math.random().toString(36).slice(-8); // Contraseña temporal
      const hashed = await hashPassword(newPassword);
      const newUserRes = await query<{ id: number }>('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [email, hashed]);
      targetUserId = newUserRes.rows[0].id;
    }

    // 3. Vincular a la empresa
    // Chequear si ya pertenece
    const memberRes = await query('SELECT id FROM company_members WHERE company_id = $1 AND user_id = $2', [user.companyId, targetUserId]);
    
    if (memberRes.rows.length > 0) {
      return { error: 'El usuario ya es miembro de la empresa' };
    }

    await query('INSERT INTO company_members (company_id, user_id, role) VALUES ($1, $2, $3)', [user.companyId, targetUserId, role]);
    
    revalidatePath('/settings/team');
    
    if (newPassword) {
      return { success: `Usuario agregado. Contraseña temporal: ${newPassword}` };
    } else {
      return { success: 'Usuario existente agregado a la empresa exitosamente' };
    }

  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'Error al invitar miembro' };
  }
}

export async function removeMember(userId: number) {
  const sessionUser = await getSession();
  if (!sessionUser || sessionUser.role !== 'admin') {
    return { error: 'No autorizado' };
  }

  if (sessionUser.id === userId) {
    return { error: 'No puedes eliminarte a ti mismo' };
  }

  try {
    // Verificar que no sea el último admin
    const targetUserRes = await query('SELECT role FROM company_members WHERE company_id = $1 AND user_id = $2', [sessionUser.companyId, userId]);
    if (targetUserRes.rows.length === 0) return { error: 'Miembro no encontrado' };
    
    if (targetUserRes.rows[0].role === 'admin') {
      const adminsCount = await query<{ count: string }>('SELECT count(*) FROM company_members WHERE company_id = $1 AND role = $2', [sessionUser.companyId, 'admin']);
      if (parseInt(adminsCount.rows[0].count) <= 1) {
        return { error: 'No puedes eliminar al único administrador' };
      }
    }

    await query('DELETE FROM company_members WHERE company_id = $1 AND user_id = $2', [sessionUser.companyId, userId]);
    revalidatePath('/settings/team');
    return { success: true };
  } catch (e) {
    return { error: 'Error al eliminar miembro' };
  }
}

export async function updateMemberRole(userId: number, newRole: 'admin' | 'member') {
  const sessionUser = await getSession();
  if (!sessionUser || sessionUser.role !== 'admin') {
    return { error: 'No autorizado' };
  }

  try {
    if (newRole === 'member') {
      const adminsCount = await query<{ count: string }>('SELECT count(*) FROM company_members WHERE company_id = $1 AND role = $2', [sessionUser.companyId, 'admin']);
      
      const targetUserRes = await query('SELECT role FROM company_members WHERE company_id = $1 AND user_id = $2', [sessionUser.companyId, userId]);
      
      if (targetUserRes.rows[0].role === 'admin' && parseInt(adminsCount.rows[0].count) <= 1) {
        return { error: 'No puedes degradar al único administrador' };
      }
    }

    await query('UPDATE company_members SET role = $1 WHERE company_id = $2 AND user_id = $3', [newRole, sessionUser.companyId, userId]);
    revalidatePath('/settings/team');
    return { success: true };
  } catch (e) {
    return { error: 'Error al actualizar rol' };
  }
}
