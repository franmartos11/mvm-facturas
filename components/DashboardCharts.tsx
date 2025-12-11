
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
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mb-8 transition-all">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Análisis de Gastos
        </h3>
        <button 
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isOpen ? 'Ocultar Gráficos' : 'Ver Gráficos'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 pt-0 animate-in slide-in-from-top-4 fade-in">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Evolución del gasto diario en los últimos 14 días.
            </p>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:stroke-zinc-800" />
                    <XAxis 
                    dataKey="name" 
                    stroke="#71717A" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    />
                    <YAxis 
                    stroke="#71717A" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '8px', 
                        border: '1px solid #E4E4E7',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gasto Total']}
                    />
                    <Bar 
                    dataKey="value" 
                    fill="#2563EB" 
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
