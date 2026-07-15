import { signup } from '@/app/login/actions';
import AuthLayout from '@/components/AuthLayout';
import PasswordInput from '@/components/PasswordInput';
import Link from 'next/link';

export default async function RegisterPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams.error as string
  const message = searchParams.message as string

  return (
    <AuthLayout 
      title="Crear Cuenta" 
      subtitle="Únete a Facturas IA y centraliza la gestión de tu empresa."
    >
      {message && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              ¡Registro completado!
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Hemos enviado un enlace de confirmación a tu correo. Por favor, revísalo para activar tu cuenta.
            </p>
            <Link 
              href="/login" 
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition-colors"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      )}

      <form className="space-y-5" action={signup}>
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
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="companyName">
            Empresa <span className="text-zinc-400 font-normal">(Requerido)</span>
          </label>
          <input 
            id="companyName" 
            name="companyName" 
            type="text" 
            required
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Ej: Acme Corp"
          />
        </div>

        <PasswordInput id="password" name="password" required placeholder="••••••••" />
        
        <div className="pt-2">
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            Registrarse
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
