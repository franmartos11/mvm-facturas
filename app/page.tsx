import { createClient } from '@/utils/supabase/server';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard />;
}
