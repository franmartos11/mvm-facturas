import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import TeamSettings from '@/components/TeamSettings';

export default async function SettingsTeamPage() {
  const user = await getSession();

  if (!user) {
    return redirect('/login');
  }

  const membersRes = await query(`
    SELECT u.id, u.email, cm.role, cm.joined_at 
    FROM users u
    JOIN company_members cm ON u.id = cm.user_id
    WHERE cm.company_id = $1
    ORDER BY cm.joined_at ASC
  `, [user.companyId]);

  return (
    <div className="w-full">
      <TeamSettings members={membersRes.rows} currentUserRole={user.role} />
    </div>
  );
}
