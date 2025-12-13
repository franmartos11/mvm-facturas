import { getInvoices, getAllInvoiceItems } from '@/app/actions';
import DashboardViews from '@/components/DashboardViews';
import InvoiceList from '@/components/InvoiceList';
import ProductsList from '@/components/ProductsList';
import DashboardSummary from '@/components/DashboardSummary';
import DashboardClient from '@/components/DashboardClient';
import DashboardCharts from '@/components/DashboardCharts';

export default async function Dashboard() {
  const invoices = await getInvoices();
  const items = await getAllInvoiceItems();

  return (
    <main className="min-h-screen p-8 bg-muted/40 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Gestor de Facturas
            </h1>
            <p className="text-muted-foreground mt-1">
              Sube tus facturas PDF y deja que la IA extraiga los datos por ti.
            </p>
          </div>
        </header>

        {/* Summary Cards */}
        <DashboardSummary invoices={invoices || []} items={items || []} />

        {/* Charts */}
        <DashboardCharts items={items || []} />

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
