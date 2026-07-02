'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpenseHeatmapProps {
  invoices: any[];
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ExpenseHeatmap({ invoices }: ExpenseHeatmapProps) {
  const data = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed' && inv.invoice_date);
    
    // Initialize array for 7 days
    const daysData = DAYS.map(day => ({ name: day, short: day.substring(0, 3), amount: 0, count: 0 }));

    analyzed.forEach(inv => {
      const d = new Date(inv.invoice_date);
      const dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday...
      // Avoid out of bounds if date is weird
      if (dayIndex >= 0 && dayIndex <= 6) {
        daysData[dayIndex].amount += Number(inv.total || 0);
        daysData[dayIndex].count += 1;
      }
    });

    // Reorder so Monday is first
    const mondayFirst = [...daysData.slice(1), daysData[0]];
    return mondayFirst;
  }, [invoices]);

  if (data.every(d => d.amount === 0)) return null;

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Estacionalidad (Gastos por día)</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="short" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={val => `$${val}`} width={60} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              formatter={(value: number, name: string) => [
                name === 'amount' ? `$${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}` : value,
                name === 'amount' ? 'Monto Total' : 'Nº Facturas'
              ]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
            />
            <Bar dataKey="amount" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
