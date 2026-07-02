'use client';

import { useMemo } from 'react';

interface TaxReportProps {
  invoices: any[];
}

export default function TaxReport({ invoices }: TaxReportProps) {
  const data = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed' && inv.invoice_date);

    const monthMap: Record<string, { month: string; subtotal: number; tax: number; total: number; timestamp: number }> = {};

    analyzed.forEach(inv => {
      const d = new Date(inv.invoice_date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          subtotal: 0,
          tax: 0,
          total: 0,
          timestamp: d.getTime()
        };
      }

      monthMap[monthKey].subtotal += Number(inv.subtotal || 0);
      monthMap[monthKey].tax += Number(inv.tax || 0);
      monthMap[monthKey].total += Number(inv.total || 0);
    });

    return Object.values(monthMap).sort((a, b) => b.timestamp - a.timestamp);
  }, [invoices]);

  if (data.length === 0) return null;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
          </svg>
          Reporte Impositivo (IVA)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Crédito fiscal acumulado por mes para declaración jurada.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Período</th>
              <th className="px-6 py-3 font-medium text-right">Neto Gravado (Subtotal)</th>
              <th className="px-6 py-3 font-medium text-right text-indigo-500">IVA (Crédito Fiscal)</th>
              <th className="px-6 py-3 font-medium text-right">Total Facturado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-muted/10 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{row.month}</td>
                <td className="px-6 py-4 text-right">${row.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-right font-semibold text-indigo-500">${row.tax.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-right font-medium">${row.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
