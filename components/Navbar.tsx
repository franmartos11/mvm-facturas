import Link from "next/link";
import { getSession } from "@/lib/auth";
import UserDropdown from "@/components/UserDropdown";

export default async function Navbar() {
  const user = await getSession();

  return (
    <nav className="w-full flex justify-center border-b border-border h-16 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="w-full max-w-7xl flex justify-between items-center px-6 text-sm">
        <Link href="/" className="font-bold text-xl">
          Facturas IA
        </Link>
        <div className="flex gap-4 items-center">
          {user ? (
            <UserDropdown user={user} />
          ) : (
            <Link
              href="/login"
              className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
