import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserSettings, getBudgets } from '@/app/actions';
import SettingsClient from './SettingsClient';
import BudgetSettings from '@/components/BudgetSettings';

export default async function SettingsPage() {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  const settings = await getUserSettings();
  const budgets = await getBudgets();

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Configuración</h1>
      <p className="text-muted-foreground mb-8">Administra tus preferencias y la conexión con la Inteligencia Artificial local.</p>

      <SettingsClient initialSettings={settings} />
      <BudgetSettings initialBudgets={budgets} />
    </div>
  );
}
