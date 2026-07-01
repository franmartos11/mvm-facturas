'use client';

import { useMemo } from 'react';

interface RecurringSuppliersProps {
  invoices: any[];
}

export default function RecurringSuppliers({ invoices }: RecurringSuppliersProps) {
  const recurring = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];

    const supplierData: Record<string, { months: Set<string>, totalSpent: number, count: number }> = {};

    invoices.forEach(inv => {
      const supplier = inv.supplier;
      if (!supplier || supplier === 'Desconocido' || inv.status !== 'analyzed') return;

      const dateStr = inv.invoice_date || inv.created_at;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      if (!supplierData[supplier]) {
        supplierData[supplier] = { months: new Set(), totalSpent: 0, count: 0 };
      }

      supplierData[supplier].months.add(monthKey);
      supplierData[supplier].totalSpent += Number(inv.total) || 0;
      supplierData[supplier].count += 1;
    });

    const results = Object.entries(supplierData)
      .filter(([_, data]) => data.months.size >= 2) // At least 2 different months
      .map(([supplier, data]) => ({
        supplier,
        monthsCount: data.months.size,
        totalInvoices: data.count,
        averagePerMonth: data.totalSpent / data.months.size
      }))
      .sort((a, b) => b.averagePerMonth - a.averagePerMonth);

    return results;
  }, [invoices]);

  if (recurring.length === 0) return null;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm mb-8 overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Servicios Recurrentes Detectados
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Proveedores con facturas en 2 o más meses distintos.
        </p>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recurring.map(data => (
          <div key={data.supplier} className="bg-background border border-border p-4 rounded-lg flex flex-col justify-between group hover:border-indigo-500 transition-colors">
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold text-foreground truncate" title={data.supplier}>{data.supplier}</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {data.monthsCount} Meses
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">
                ${data.averagePerMonth.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Promedio mensual</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
