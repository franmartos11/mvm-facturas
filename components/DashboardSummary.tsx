'use client';

interface DashboardSummaryProps {
  invoices: any[];
  items: any[];
}

export default function DashboardSummary({ invoices, items }: DashboardSummaryProps) {
  // Calculate stats
  const totalInvoices = invoices.length;
  const analyzedInvoices = invoices.filter(i => i.status === 'analyzed').length;
  
  const totalSpent = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
  
  const averageTicket = analyzedInvoices > 0 ? totalSpent / analyzedInvoices : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Spent Card */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:border-blue-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Gasto Total Acumulado</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            ${totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="mt-4 flex items-center text-xs text-green-500 bg-green-900/20 w-fit px-2 py-1 rounded-full">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Actualizado hoy
        </div>
      </div>

      {/* Invoices Count Card */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:border-purple-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Facturas Procesadas</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-foreground">
              {analyzedInvoices}
            </p>
            <span className="text-sm text-slate-400">
              de {totalInvoices} subidas
            </span>
          </div>
        </div>
        <div className="mt-4 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${totalInvoices > 0 ? (analyzedInvoices / totalInvoices) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Average Ticket Card */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:border-amber-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
          <p className="text-3xl font-bold text-foreground mt-2">
             ${averageTicket.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          Promedio por factura analizada
        </div>
      </div>
    </div>
  );
}
