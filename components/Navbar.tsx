import Link from "next/link";
import { getSession } from "@/lib/auth";
import UserDropdown from "@/components/UserDropdown";
import GlobalSearch from "@/components/GlobalSearch";
import { query } from '@/lib/db';

export default async function Navbar() {
  const user = await getSession();
  let companyName = '';
  if (user) {
    const res = await query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [user.companyId]);
    if (res.rows.length > 0) companyName = res.rows[0].name;
  }

  return (
    <nav className="w-full flex justify-center border-b border-border h-16 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="w-full max-w-7xl flex justify-between items-center px-6 text-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            Facturas IA
          </Link>
          <div className="hidden sm:flex gap-4 items-center">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Facturas
            </Link>
            <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Análisis
            </Link>
            <Link href="/integrations/tango" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Integraciones
            </Link>
            <Link href="/chat" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium">
              <span className="inline-flex w-4 h-4 bg-violet-500/20 text-violet-500 rounded-full items-center justify-center text-[9px]">✦</span>
              Chat IA
            </Link>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {user && <GlobalSearch />}
          {user ? (
            <UserDropdown user={user} companyName={companyName} />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="py-2 px-3 flex rounded-md no-underline hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300 font-medium"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="py-2 px-4 flex rounded-md no-underline bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium shadow-sm"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
