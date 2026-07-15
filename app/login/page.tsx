import { login } from '@/app/login/actions';
import AuthLayout from '@/components/AuthLayout';
import PasswordInput from '@/components/PasswordInput';
import Link from 'next/link';

export default async function LoginPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams.error as string

  return (
    <AuthLayout 
      title="Bienvenido de nuevo" 
      subtitle="Ingresa a tu cuenta para gestionar tus facturas e integraciones."
    >
      <form className="space-y-5" action={login}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">
            Email
          </label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="tu@email.com"
          />
        </div>
        
        <PasswordInput id="password" name="password" required placeholder="••••••••" />
        
        <div className="pt-2">
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            Iniciar Sesión
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Crea una aquí
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
