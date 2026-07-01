import { getInvoices, getAllInvoiceItems } from '@/app/actions';
import DashboardViews from '@/components/DashboardViews';
import InvoiceList from '@/components/InvoiceList';
import ProductsList from '@/components/ProductsList';
import DashboardSummary from '@/components/DashboardSummary';
import DashboardClient from '@/components/DashboardClient';

export default async function Dashboard() {
  const invoices = await getInvoices();
  const items = await getAllInvoiceItems();

  return (
    <main className="min-h-screen p-8 bg-muted/40 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Gestión de Facturas
            </h1>
            <p className="text-muted-foreground mt-1">
              Sube tus facturas PDF y deja que la IA extraiga los datos por ti.
            </p>
          </div>
          <a href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard de Análisis
          </a>
        </header>

        {/* Overview Summary */}
        <DashboardSummary invoices={invoices || []} items={items || []} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload */}
          <div className="lg:col-span-1">
            <DashboardClient />
          </div>

          {/* Right Column: Lists */}
          <div className="lg:col-span-2">
            <DashboardViews 
              invoicesView={<InvoiceList invoices={invoices || []} />}
              productsView={<ProductsList items={items || []} />} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}
