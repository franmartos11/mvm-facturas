import { getSession } from '@/lib/auth';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
import { Suspense } from 'react';
import DashboardSkeleton from '@/components/DashboardSkeleton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getSession();

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

