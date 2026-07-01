'use client';

import { useMemo } from 'react';

interface BusinessKPIsProps {
  invoices: any[];
  items: any[];
}

export default function BusinessKPIs({ invoices, items }: BusinessKPIsProps) {
  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const analyzedInvoices = invoices.filter(i => i.status === 'analyzed');
    const pendingInvoices = invoices.filter(i => i.status === 'pending');

    // Spending this month vs last month
    const getMonthlySpend = (start: Date, end: Date) => {
      return analyzedInvoices
        .filter(inv => {
          const d = new Date(inv.invoice_date || inv.created_at);
          return d >= start && d <= end;
        })
        .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    };

    const thisMonthSpend = getMonthlySpend(thisMonthStart, now);
    const lastMonthSpend = getMonthlySpend(lastMonthStart, lastMonthEnd);
    const monthlyChange = lastMonthSpend > 0
      ? ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100
      : null;

    // Top supplier this month
    const supplierTotals: Record<string, number> = {};
    analyzedInvoices
      .filter(inv => new Date(inv.invoice_date || inv.created_at) >= thisMonthStart)
      .forEach(inv => {
        const s = inv.supplier || 'Desconocido';
        supplierTotals[s] = (supplierTotals[s] || 0) + (Number(inv.total) || 0);
      });
    const topSupplier = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0];

    // Category with highest spend total
    const categoryTotals: Record<string, number> = {};
    items.forEach(item => {
      const cat = item.category || 'Otros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.total_price) || 0);
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    // Supplier concentration (% of spend from top supplier)
    const totalAllTime = analyzedInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const supplierAllTime: Record<string, number> = {};
    analyzedInvoices.forEach(inv => {
      const s = inv.supplier || 'Desconocido';
      supplierAllTime[s] = (supplierAllTime[s] || 0) + (Number(inv.total) || 0);
    });
    const topSupplierAllTime = Object.entries(supplierAllTime).sort((a, b) => b[1] - a[1])[0];
    const concentration = totalAllTime > 0 && topSupplierAllTime
      ? (topSupplierAllTime[1] / totalAllTime) * 100
      : 0;

    return {
      thisMonthSpend,
      lastMonthSpend,
      monthlyChange,
      topSupplier,
      topCategory,
      concentration,
      topSupplierAllTime,
      pendingCount: pendingInvoices.length,
      analyzedCount: analyzedInvoices.length,
    };
  }, [invoices, items]);

  if (kpis.analyzedCount === 0) return null;

  const now = new Date();
  const monthName = now.toLocaleDateString('es-ES', { month: 'long' });

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-lg font-semibold text-foreground">Panel Ejecutivo</h2>
        <span className="text-xs text-muted-foreground ml-1">KPIs del negocio</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gasto del Mes */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-violet-500/40 group">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Gasto en {monthName}
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            ${kpis.thisMonthSpend.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {kpis.monthlyChange !== null && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${
              kpis.monthlyChange > 0 ? 'text-red-500' : kpis.monthlyChange < 0 ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              {kpis.monthlyChange > 0 ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {Math.abs(kpis.monthlyChange).toFixed(1)}% vs mes anterior
            </div>
          )}
          {kpis.monthlyChange === null && (
            <p className="mt-2 text-xs text-muted-foreground">Sin datos del mes anterior</p>
          )}
        </div>

        {/* Top Proveedor del Mes */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-blue-500/40 group">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Top Proveedor ({monthName})
          </p>
          {kpis.topSupplier ? (
            <>
              <p className="text-lg font-bold text-foreground mt-1 truncate" title={kpis.topSupplier[0]}>
                {kpis.topSupplier[0]}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                ${Number(kpis.topSupplier[1]).toLocaleString('es-ES', { minimumFractionDigits: 2 })} facturado
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Sin facturas este mes</p>
          )}
        </div>

        {/* Categoría con más gasto */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-amber-500/40 group">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Categoría Principal
          </p>
          {kpis.topCategory ? (
            <>
              <p className="text-lg font-bold text-foreground mt-1 truncate">
                {kpis.topCategory[0]}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                ${Number(kpis.topCategory[1]).toLocaleString('es-ES', { minimumFractionDigits: 2 })} en total
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Sin datos</p>
          )}
        </div>

        {/* Concentración de Proveedor */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all group">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Concentración
          </p>
          <p className={`text-2xl font-bold mt-1 ${
            kpis.concentration > 60 ? 'text-red-500' : kpis.concentration > 40 ? 'text-amber-500' : 'text-green-500'
          }`}>
            {kpis.concentration.toFixed(0)}%
          </p>
          <p className="mt-2 text-xs text-muted-foreground truncate" title={kpis.topSupplierAllTime?.[0]}>
            {kpis.concentration > 60
              ? '⚠️ Alta dependencia de '
              : kpis.concentration > 40
              ? '⚡ Dependencia media de '
              : '✅ Riesgo bajo — '
            }
            {kpis.topSupplierAllTime?.[0]}
          </p>
        </div>
      </div>
    </div>
  );
}
