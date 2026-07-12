import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import UserProfile from '@/components/UserProfile';

export default async function ProfilePage() {
  const user = await getSession();

  if (!user) {
    return redirect('/login');
  }

  const userRes = await query<any>('SELECT tango_token FROM users WHERE id = $1', [user.id]);
  const tangoToken = userRes.rows[0]?.tango_token || '';

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center justify-center p-4">
      <UserProfile user={user} initialTangoToken={tangoToken} />
    </div>
  );
}

