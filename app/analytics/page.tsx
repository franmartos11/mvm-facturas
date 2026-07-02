import { getInvoices, getAllInvoiceItems, getBudgets } from '@/app/actions';
import DashboardCharts from '@/components/DashboardCharts';
import BudgetAlerts from '@/components/BudgetAlerts';
import RecurringSuppliers from '@/components/RecurringSuppliers';
import BusinessKPIs from '@/components/BusinessKPIs';
import SupplierAnalysis from '@/components/SupplierAnalysis';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import DashboardSummary from '@/components/DashboardSummary';
import SpendPrediction from '@/components/SpendPrediction';
import ExportPDFButton from '@/components/ExportPDFButton';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const invoices = await getInvoices();
  const items = await getAllInvoiceItems();
  const budgets = await getBudgets();

  return (
    <main className="min-h-screen p-8 bg-muted/40 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8" id="analytics-report-container">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Análisis del Negocio
            </h1>
            <p className="text-muted-foreground mt-1">
              Métricas, tendencias y análisis de todos tus gastos.
            </p>
          </div>
          <div>
            <ExportPDFButton invoices={invoices || []} />
          </div>
        </header>

        {/* Global Summary */}
        <DashboardSummary invoices={invoices || []} items={items || []} />

        {/* Executive KPIs */}
        <BusinessKPIs invoices={invoices || []} items={items || []} />

        {/* Budgets & Recurring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BudgetAlerts budgets={budgets || []} items={items || []} />
          <RecurringSuppliers invoices={invoices || []} />
        </div>

        {/* Deep Analytics */}
        <div className="space-y-6">
          <SpendPrediction invoices={invoices || []} />
          <DashboardCharts items={items || []} invoices={invoices || []} />
          <SupplierAnalysis invoices={invoices || []} />
          <CategoryBreakdown items={items || []} invoices={invoices || []} />
        </div>
      </div>
    </main>
  );
}
