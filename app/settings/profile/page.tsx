import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import UserProfile from '@/components/UserProfile';

export default async function SettingsProfilePage() {
  const user = await getSession();

  if (!user) {
    return redirect('/login');
  }

  const userRes = await query<{ tango_token: string }>('SELECT tango_token FROM users WHERE id = $1', [user.id]);
  const tangoToken = userRes.rows[0]?.tango_token || '';

  const compRes = await query<{ name: string }>('SELECT name FROM companies WHERE id = $1', [user.companyId]);
  const companyName = compRes.rows[0]?.name || 'Empresa Desconocida';

  return (
    <div className="w-full">
      <UserProfile user={user} initialTangoToken={tangoToken} companyName={companyName} />
    </div>
  );
}
