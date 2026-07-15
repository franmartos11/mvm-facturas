import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { User, Building2, Users } from 'lucide-react';
import SettingsTabs from './SettingsTabs';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) {
    return redirect('/login');
  }

  // Define tabs based on role
  const tabs = [
    { name: 'Mi Perfil', href: '/settings/profile', icon: <User className="w-4 h-4" /> },
  ];

  if (user.role === 'admin') {
    tabs.push({ name: 'Empresa', href: '/settings/company', icon: <Building2 className="w-4 h-4" /> });
    tabs.push({ name: 'Equipo', href: '/settings/team', icon: <Users className="w-4 h-4" /> });
  } else {
    // Miembros can only see team, not edit
    tabs.push({ name: 'Equipo', href: '/settings/team', icon: <Users className="w-4 h-4" /> });
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar / Tabs */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Configuración</h1>
        <SettingsTabs tabs={tabs} />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
