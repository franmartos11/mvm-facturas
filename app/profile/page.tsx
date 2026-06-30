import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserProfile from '@/components/UserProfile';

export default async function ProfilePage() {
  const user = await getSession();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center justify-center p-4">
      <UserProfile user={user} />
    </div>
  );
}

