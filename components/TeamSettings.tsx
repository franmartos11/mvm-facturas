"use client";

import { useActionState, useState } from "react";
import { inviteMember, removeMember, updateMemberRole, type ActionResponse } from "@/app/settings/actions";
import { Users, Loader2, Shield, User, Mail, Plus } from "lucide-react";
import { motion } from "framer-motion";

const initialState: ActionResponse = {};

export default function TeamSettings({ members, currentUserRole }: { members: any[], currentUserRole: string }) {
  const [inviteState, inviteAction, isInvitePending] = useActionState(inviteMember, initialState);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<number | null>(null);

  const isAdmin = currentUserRole === 'admin';

  const handleRemove = async (userId: number) => {
    if (!confirm("¿Seguro que deseas eliminar a este usuario de la empresa?")) return;
    setIsRemoving(userId);
    const res = await removeMember(userId);
    if (res.error) alert(res.error);
    setIsRemoving(null);
  };

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'member') => {
    setIsUpdatingRole(userId);
    const res = await updateMemberRole(userId, newRole);
    if (res.error) alert(res.error);
    setIsUpdatingRole(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden w-full max-w-4xl">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Miembros del Equipo</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Gestiona quién tiene acceso a la empresa y sus roles.</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                {isAdmin && <th className="px-4 py-3 text-right rounded-tr-lg">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-4 font-medium flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      {member.email[0].toUpperCase()}
                    </div>
                    {member.email}
                  </td>
                  <td className="px-4 py-4">
                    {isAdmin ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member')}
                        disabled={isUpdatingRole === member.id}
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 outline-none text-xs"
                      >
                        <option value="admin">Administrador</option>
                        <option value="member">Miembro</option>
                      </select>
                    ) : (
                      member.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                          <User className="w-3 h-3" /> Miembro
                        </span>
                      )
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={isRemoving === member.id}
                        className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                      >
                        {isRemoving === member.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isAdmin && (
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-base font-semibold mb-4">Invitar Nuevo Miembro</h3>
            <form action={inviteAction} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-5 h-5 text-zinc-400" />
                  <input id="email" name="email" type="email" required placeholder="correo@ejemplo.com" className="w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="w-full sm:w-48 space-y-1.5">
                <label htmlFor="role" className="block text-sm font-medium">Rol</label>
                <select id="role" name="role" className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={isInvitePending} className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-white bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 flex items-center justify-center gap-2 disabled:opacity-50">
                {isInvitePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Invitar
              </button>
            </form>
            
            {inviteState?.success && <div className="mt-4 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm">{inviteState.success}</div>}
            {inviteState?.error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{inviteState.error}</div>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
