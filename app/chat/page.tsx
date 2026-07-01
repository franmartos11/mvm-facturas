import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

export const metadata = {
  title: 'Chat con IA — Facturas IA',
  description: 'Consultá tus facturas y gastos con lenguaje natural.',
};

export default async function ChatPage() {
  const user = await getSession();
  if (!user) redirect('/login');

  return (
    <main className="h-[calc(100vh_-_4rem)] bg-muted/40 font-[family-name:var(--font-geist-sans)]">
      <ChatInterface />
    </main>
  );
}
