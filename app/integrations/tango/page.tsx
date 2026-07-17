import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import TangoIntegrationManager from '@/components/TangoIntegrationManager';

export default async function TangoIntegrationPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }

  // Obtener facturas analizadas que no han sido sincronizadas
  const invoicesRes = await query<any>(
    `SELECT * FROM invoices 
     WHERE company_id = $1 
     AND status = 'analyzed' 
     AND supplier IS NOT NULL 
     AND tango_synced = false 
     ORDER BY invoice_date DESC`,
    [user.companyId]
  );
  const pendingInvoices = invoicesRes.rows;

  // Obtener mapeos actuales
  const mappingsRes = await query<any>(
    `SELECT mapping_type, source_name, tango_code, created_at 
     FROM tango_mappings 
     WHERE company_id = $1 
     ORDER BY created_at DESC`,
    [user.companyId]
  );
  const mappings = mappingsRes.rows;

  return (
    <main className="min-h-screen p-8 bg-muted/40 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Integración Tango (Axoft)
            </h1>
            <p className="text-muted-foreground mt-1">
              Sincroniza tus facturas de venta directamente con el ERP de Axoft.
            </p>
          </div>
        </header>

        <TangoIntegrationManager 
          pendingInvoices={pendingInvoices} 
          initialMappings={mappings} 
        />
      </div>
    </main>
  );
}
