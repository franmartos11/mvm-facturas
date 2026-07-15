import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import CompanyInfoForm from '@/components/CompanyInfoForm';

export default async function SettingsCompanyPage() {
  const user = await getSession();

  if (!user) {
    return redirect('/login');
  }

  if (user.role !== 'admin') {
    return redirect('/settings/profile');
  }

  const companyRes = await query('SELECT * FROM companies WHERE id = $1', [user.companyId]);
  const company = companyRes.rows[0];

  return (
    <div className="w-full">
      <CompanyInfoForm company={company} currentUserRole={user.role} />
    </div>
  );
}
