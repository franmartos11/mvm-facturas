"use client";

import { useActionState } from "react";
import { updateCompanyInfo, type ActionResponse } from "@/app/settings/actions";
import { Building2, Loader2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

const initialState: ActionResponse = {};

export default function CompanyInfoForm({ company, currentUserRole }: { company: any, currentUserRole: string }) {
  const [infoState, infoAction, isInfoPending] = useActionState(updateCompanyInfo, initialState);

  if (currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-zinc-500 mt-2">Solo los administradores pueden gestionar la empresa.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden w-full max-w-4xl">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Información de la Empresa</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Actualiza los datos básicos de tu organización.</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <form action={infoAction} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nombre de la Empresa
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={company.name}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cuit" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                CUIT <span className="text-zinc-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="cuit"
                name="cuit"
                type="text"
                defaultValue={company.cuit || ''}
                placeholder="Ej: 30-12345678-9"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isInfoPending}
              className="w-full md:w-auto flex justify-center items-center px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isInfoPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : "Guardar Cambios"}
            </button>
          </div>
          
          {infoState?.success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{infoState.success}</div>}
          {infoState?.error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{infoState.error}</div>}
        </form>
      </div>
    </motion.div>
  );
}
