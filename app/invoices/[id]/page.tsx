import { getInvoiceById } from '@/app/actions';
import InvoiceDetailView from '@/components/InvoiceDetailView';
import { notFound } from 'next/navigation';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoiceId = parseInt(params.id, 10);
  if (isNaN(invoiceId)) {
    notFound();
  }

  const data = await getInvoiceById(invoiceId);
  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/40 font-[family-name:var(--font-geist-sans)]">
      <InvoiceDetailView invoice={data.invoice} items={data.items} />
    </main>
  );
}
