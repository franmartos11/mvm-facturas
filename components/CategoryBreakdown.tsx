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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface CategoryBreakdownProps {
  items: any[];
  invoices: any[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentación': '#10b981',
  'Hogar': '#f59e0b',
  'Tecnología': '#3b82f6',
  'Transporte': '#6366f1',
  'Salud': '#ef4444',
  'Servicios': '#8b5cf6',
  'Otros': '#94a3b8',
};

const getColor = (cat: string) => CATEGORY_COLORS[cat] || '#94a3b8';

export default function CategoryBreakdown({ items, invoices }: CategoryBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { pieData, monthlyData, months } = useMemo(() => {
    if (!items || items.length === 0) {
      return { pieData: [], monthlyData: [], months: [] };
    }

    // Pie: total per category
    const catTotals: Record<string, number> = {};
    items.forEach(item => {
      const cat = item.category || 'Otros';
      catTotals[cat] = (catTotals[cat] || 0) + (Number(item.total_price) || 0);
    });
    const pie = Object.entries(catTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly breakdown: last 6 months per category
    const now = new Date();
    const monthLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
    }

    // Build a map: month -> category -> total
    const monthly: Record<string, Record<string, number>> = {};
    monthLabels.forEach(m => { monthly[m] = {}; });

    // Map invoices by id for date lookup
    const invById: Record<number, any> = {};
    invoices.forEach(inv => { invById[inv.id] = inv; });

    items.forEach(item => {
      const inv = invById[item.invoice_id];
      if (!inv) return;
      const dateStr = inv.invoice_date || inv.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      if (!monthly[label]) return;
      const cat = item.category || 'Otros';
      monthly[label][cat] = (monthly[label][cat] || 0) + (Number(item.total_price) || 0);
    });

    const monthlyArr = monthLabels.map(month => ({
      month,
      ...monthly[month],
    }));

    const categories = [...new Set(items.map(i => i.category || 'Otros'))];

    return { pieData: pie, monthlyData: monthlyArr, months: categories };
  }, [items, invoices]);

  if (pieData.length === 0) return null;

  const totalSpend = pieData.reduce((s, c) => s + c.value, 0);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-6">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          Desglose por Categoría
          <span className="text-xs font-normal text-muted-foreground">— ¿En qué se va el dinero?</span>
        </h3>
        <button className="text-sm font-medium text-primary hover:underline">
          {isOpen ? 'Ocultar' : 'Ver análisis'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 pt-0 animate-in slide-in-from-top-4 fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Distribución Total de Gasto</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={getColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [
                        `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${totalSpend > 0 ? ((value / totalSpend) * 100).toFixed(1) : 0}%)`,
                        'Gasto'
                      ]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category cards */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Resumen por Categoría</p>
              <div className="space-y-2.5">
                {pieData.slice(0, 7).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getColor(cat.name) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                        <span className="text-sm font-semibold text-foreground">
                          ${cat.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${totalSpend > 0 ? (cat.value / totalSpend) * 100 : 0}%`,
                            backgroundColor: getColor(cat.name),
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                      {totalSpend > 0 ? ((cat.value / totalSpend) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Stacked Chart */}
          <div className="mt-8">
            <p className="text-sm font-medium text-foreground mb-3">
              Gasto por Categoría — Últimos 6 Meses
            </p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '11px' }}>{v}</span>} />
                  {months.map((cat) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="cats"
                      fill={getColor(cat)}
                      maxBarSize={60}
                      radius={months[months.length - 1] === cat ? [4, 4, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
