
'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';

interface DashboardChartsProps {
  items: any[];
  invoices?: any[];
}

export default function DashboardCharts({ items, invoices = [] }: DashboardChartsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { monthlyTrendData, avgMonthlySpend } = useMemo(() => {
    if (!invoices || invoices.length === 0) return { monthlyTrendData: [], avgMonthlySpend: 0 };

    const analyzed = invoices.filter(inv => inv.status === 'analyzed');

    const now = new Date();
    const labels: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'short' });
      labels.push({ key, label });
    }

    const monthMap: Record<string, number> = {};
    labels.forEach(l => { monthMap[l.key] = 0; });

    analyzed.forEach(inv => {
      const dateStr = inv.invoice_date || inv.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key] !== undefined) {
        monthMap[key] += Number(inv.total) || 0;
      }
    });

    const trend = labels.map(l => ({
      name: l.label,
      gasto: monthMap[l.key],
    }));

    const nonZero = trend.filter(t => t.gasto > 0);
    const avg = nonZero.length > 0
      ? nonZero.reduce((s, t) => s + t.gasto, 0) / nonZero.length
      : 0;

    return { monthlyTrendData: trend, avgMonthlySpend: avg };
  }, [invoices]);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: 'hsl(var(--foreground))',
  };

  if (monthlyTrendData.length === 0 && items.length === 0) return null;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-6">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Tendencia de Gasto
          <span className="text-xs font-normal text-muted-foreground">— Últimos 12 meses</span>
        </h3>
        <button className="text-sm font-medium text-primary hover:underline">
          {isOpen ? 'Ocultar Gráficos' : 'Ver Gráficos'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 pt-0 animate-in slide-in-from-top-4 fade-in space-y-8">
          {/* Monthly Trend Line */}
          {monthlyTrendData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Gasto Mensual — Últimos 12 Meses</p>
                {avgMonthlySpend > 0 && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    Promedio: ${avgMonthlySpend.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gasto']}
                    />
                    {avgMonthlySpend > 0 && (
                      <ReferenceLine
                        y={avgMonthlySpend}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="4 4"
                        label={{ value: 'Promedio', position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="gasto"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
