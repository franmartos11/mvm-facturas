'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';

interface SpendPredictionProps {
  invoices: any[];
}

export default function SpendPrediction({ invoices }: SpendPredictionProps) {
  const { 
    currentSpend, 
    projectedSpend, 
    daysElapsed, 
    daysInMonth, 
    chartData,
    lastMonthTotal 
  } = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Past month total
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    const lastMonthTotal = analyzed
      .filter(inv => {
        const d = new Date(inv.invoice_date || inv.created_at);
        return d >= lastMonthStart && d <= lastMonthEnd;
      })
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    // Current month invoices
    const thisMonthInvoices = analyzed.filter(inv => {
      const d = new Date(inv.invoice_date || inv.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // Calculate cumulative spend up to today
    let currentSpend = 0;
    const dailyMap: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) dailyMap[i] = 0;

    thisMonthInvoices.forEach(inv => {
      const d = new Date(inv.invoice_date || inv.created_at);
      const day = d.getDate();
      dailyMap[day] += Number(inv.total) || 0;
    });

    let cumulative = 0;
    const chartData = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      if (i <= today) {
        cumulative += dailyMap[i];
        currentSpend = cumulative;
        chartData.push({ day: i, real: cumulative, projected: null });
      } else {
        chartData.push({ day: i, real: null, projected: null }); // fill later
      }
    }

    // Prediction formula: Simple daily average run rate
    const dailyVelocity = today > 0 ? currentSpend / today : 0;
    const projectedSpend = currentSpend + (dailyVelocity * (daysInMonth - today));

    // Fill projected curve
    let projCumulative = currentSpend;
    for (let i = today; i <= daysInMonth; i++) {
      if (i === today) {
        chartData[i - 1].projected = currentSpend;
      } else {
        projCumulative += dailyVelocity;
        chartData[i - 1].projected = projCumulative;
      }
    }

    return { 
      currentSpend, 
      projectedSpend, 
      daysElapsed: today, 
      daysInMonth, 
      chartData,
      lastMonthTotal
    };
  }, [invoices]);

  if (currentSpend === 0) return null;

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: 'hsl(var(--foreground))',
  };

  const isOverspending = lastMonthTotal > 0 && projectedSpend > lastMonthTotal;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-6">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Predicción de Gasto Mensual
          <span className="text-xs font-normal text-muted-foreground">— Proyección al fin de mes</span>
        </h3>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Stats Column */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gasto Actual (Día {daysElapsed})</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              ${currentSpend.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Proyección Cierre de Mes</p>
            <p className={`text-4xl font-bold mt-1 ${isOverspending ? 'text-amber-500' : 'text-green-500'}`}>
              ${projectedSpend.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            {lastMonthTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Mes anterior: ${lastMonthTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                {isOverspending ? ' (Aumento esperado)' : ' (Baja esperada)'}
              </p>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              La IA proyecta tu gasto asumiendo una velocidad diaria promedio de <strong>${(currentSpend / daysElapsed).toLocaleString('es-ES', { maximumFractionDigits: 0 })}/día</strong>.
            </p>
          </div>
        </div>

        {/* Chart Column */}
        <div className="lg:col-span-2 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`, 
                  name === 'real' ? 'Gasto Acumulado' : 'Proyección'
                ]}
                labelFormatter={(label) => `Día ${label}`}
              />
              
              <ReferenceArea x1={daysElapsed} x2={daysInMonth} fill="hsl(var(--muted))" fillOpacity={0.5} />

              <Line 
                type="monotone" 
                dataKey="real" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }} 
              />
              
              <Line 
                type="monotone" 
                dataKey="projected" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
