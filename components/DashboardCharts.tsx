
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
  AreaChart,
  Area,
} from 'recharts';

interface DashboardChartsProps {
  items: any[];
}

export default function DashboardCharts({ items }: DashboardChartsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Aggregate data by date
  const chartData = useMemo(() => {
    // ... existing logic ...
    // Note: Re-using existing logic inside useMemo, 
    // just wrapping the return in a conditional render structure or button
    if (!items || items.length === 0) return [];

    const groupedData: Record<string, number> = {};

    items.forEach((item) => {
        const dateStr = item.invoices?.created_at; 
        if (!dateStr) return;
        const date = new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
        });
        if (!groupedData[date]) {
            groupedData[date] = 0;
        }
        groupedData[date] += Number(item.total_price) || 0;
    });
    
    return Object.entries(groupedData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
         const [dayA, monthA] = a.name.split('/');
         const [dayB, monthB] = b.name.split('/');
         return (Number(monthA) * 31 + Number(dayA)) - (Number(monthB) * 31 + Number(dayB));
      })
      .slice(-14);
  }, [items]);

  if (chartData.length === 0) return null;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-8">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Análisis de Gastos
        </h3>
        <button 
          className="text-sm font-medium text-primary hover:underline"
        >
          {isOpen ? 'Ocultar Gráficos' : 'Ver Gráficos'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 pt-0 animate-in slide-in-from-top-4 fade-in">
            <p className="text-sm text-muted-foreground mb-6">
                Evolución del gasto diario en los últimos 14 días.
            </p>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    />
                    <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gasto Total']}
                    />
                    <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={50}
                    />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}
    </div>
  );
}
