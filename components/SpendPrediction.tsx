'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from 'recharts';

interface SpendPredictionProps {
  invoices: any[];
}

type NarrativeState = 'idle' | 'loading' | 'done' | 'error';

export default function SpendPrediction({ invoices }: SpendPredictionProps) {
  const [narrativeState, setNarrativeState] = useState<NarrativeState>('idle');
  const [narrative, setNarrative] = useState<string>('');
  const [narrativeError, setNarrativeError] = useState<string>('');

  const {
    currentPurchaseSpend,
    projectedPurchaseSpend,
    currentSalesRevenue,
    projectedSalesRevenue,
    daysElapsed,
    daysInMonth,
    chartData,
    lastMonthPurchases,
    lastMonthSales,
    hasSales,
  } = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Past month
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const inLastMonth = (inv: any) => {
      const d = new Date(inv.invoice_date || inv.created_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    };

    const lastMonthPurchases = analyzed
      .filter(inv => inLastMonth(inv) && inv.invoice_type !== 'venta')
      .reduce((s, inv) => s + (Number(inv.total) || 0), 0);

    const lastMonthSales = analyzed
      .filter(inv => inLastMonth(inv) && inv.invoice_type === 'venta')
      .reduce((s, inv) => s + (Number(inv.total) || 0), 0);

    // Current month
    const thisMonth = analyzed.filter(inv => {
      const d = new Date(inv.invoice_date || inv.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // Separate by type
    const purchases = thisMonth.filter(inv => inv.invoice_type !== 'venta');
    const sales = thisMonth.filter(inv => inv.invoice_type === 'venta');

    const hasSales = analyzed.some(inv => inv.invoice_type === 'venta');

    // Build daily maps
    const purchaseMap: Record<number, number> = {};
    const salesMap: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) { purchaseMap[i] = 0; salesMap[i] = 0; }

    purchases.forEach(inv => {
      const day = new Date(inv.invoice_date || inv.created_at).getDate();
      purchaseMap[day] = (purchaseMap[day] || 0) + (Number(inv.total) || 0);
    });
    sales.forEach(inv => {
      const day = new Date(inv.invoice_date || inv.created_at).getDate();
      salesMap[day] = (salesMap[day] || 0) + (Number(inv.total) || 0);
    });

    // Build chart data
    let cumulativePurchase = 0;
    let cumulativeSales = 0;
    let currentPurchaseSpend = 0;
    let currentSalesRevenue = 0;

    const chartData: {
      day: number;
      compras: number | null;
      ventas: number | null;
      proyCompras: number | null;
      proyVentas: number | null;
    }[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      if (i <= today) {
        cumulativePurchase += purchaseMap[i];
        cumulativeSales += salesMap[i];
        currentPurchaseSpend = cumulativePurchase;
        currentSalesRevenue = cumulativeSales;
        chartData.push({ day: i, compras: cumulativePurchase, ventas: cumulativeSales, proyCompras: null, proyVentas: null });
      } else {
        chartData.push({ day: i, compras: null, ventas: null, proyCompras: null, proyVentas: null });
      }
    }

    // Daily velocities
    const purchaseVelocity = today > 0 ? currentPurchaseSpend / today : 0;
    const salesVelocity = today > 0 ? currentSalesRevenue / today : 0;
    const projectedPurchaseSpend = currentPurchaseSpend + purchaseVelocity * (daysInMonth - today);
    const projectedSalesRevenue = currentSalesRevenue + salesVelocity * (daysInMonth - today);

    // Fill projected
    let projPurchase = currentPurchaseSpend;
    let projSales = currentSalesRevenue;
    for (let i = today; i <= daysInMonth; i++) {
      if (i === today) {
        chartData[i - 1].proyCompras = currentPurchaseSpend;
        chartData[i - 1].proyVentas = currentSalesRevenue;
      } else {
        projPurchase += purchaseVelocity;
        projSales += salesVelocity;
        chartData[i - 1].proyCompras = projPurchase;
        if (hasSales) chartData[i - 1].proyVentas = projSales;
      }
    }

    return {
      currentPurchaseSpend,
      projectedPurchaseSpend,
      currentSalesRevenue,
      projectedSalesRevenue,
      daysElapsed: today,
      daysInMonth,
      chartData,
      lastMonthPurchases,
      lastMonthSales,
      hasSales,
    };
  }, [invoices]);

  const handleNarrative = async () => {
    if (narrativeState === 'loading') return;
    setNarrativeState('loading');
    setNarrativeError('');
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'narrative' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error desconocido');
      setNarrative(data.result);
      setNarrativeState('done');
    } catch (e: any) {
      setNarrativeError(e.message);
      setNarrativeState('error');
    }
  };

  if (currentPurchaseSpend === 0 && currentSalesRevenue === 0) return null;

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: 'hsl(var(--foreground))',
  };

  const isOverspending = lastMonthPurchases > 0 && projectedPurchaseSpend > lastMonthPurchases;
  const isGrowingSales = hasSales && lastMonthSales > 0 && projectedSalesRevenue > lastMonthSales;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-6">
      <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Predicción de Gasto Mensual
          <span className="text-xs font-normal text-muted-foreground">— Proyección al fin de mes</span>
          {hasSales && (
            <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
              + Ventas
            </span>
          )}
        </h3>

        {/* AI Narrative button */}
        {narrativeState === 'idle' && (
          <button
            onClick={handleNarrative}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            ✦ Explicar con IA
          </button>
        )}
        {narrativeState === 'loading' && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Analizando...
          </span>
        )}
        {(narrativeState === 'done' || narrativeState === 'error') && (
          <button
            onClick={() => { setNarrativeState('idle'); setNarrative(''); setNarrativeError(''); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar análisis
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Column */}
        <div className="flex flex-col justify-center space-y-5">
          {/* Purchases */}
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Compras Actuales (Día {daysElapsed})
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              ${currentPurchaseSpend.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Proyección Compras (Cierre)</p>
            <p className={`text-3xl font-bold mt-1 ${isOverspending ? 'text-amber-500' : 'text-primary'}`}>
              ${projectedPurchaseSpend.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            {lastMonthPurchases > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Mes anterior: ${lastMonthPurchases.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                {isOverspending ? ' ↑ Aumento' : ' ↓ Baja'}
              </p>
            )}
          </div>

          {/* Sales (if any) */}
          {hasSales && (
            <div className="pt-3 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Ingresos (Ventas)
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ${currentSalesRevenue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Proyección: ${projectedSalesRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                {isGrowingSales ? ' ↑' : ' →'}
              </p>
              {/* Balance */}
              <div className="mt-2 p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Balance estimado del mes</p>
                <p className={`text-sm font-bold mt-0.5 ${projectedSalesRevenue - projectedPurchaseSpend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {projectedSalesRevenue - projectedPurchaseSpend >= 0 ? '+' : ''}
                  ${(projectedSalesRevenue - projectedPurchaseSpend).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Velocidad diaria compras: <strong>${(currentPurchaseSpend / daysElapsed).toLocaleString('es-ES', { maximumFractionDigits: 0 })}/día</strong>
              {hasSales && currentSalesRevenue > 0 && (
                <> · Ventas: <strong>${(currentSalesRevenue / daysElapsed).toLocaleString('es-ES', { maximumFractionDigits: 0 })}/día</strong></>
              )}
            </p>
          </div>
        </div>

        {/* Chart Column */}
        <div className="lg:col-span-2 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
                  name === 'compras' ? 'Compras' : name === 'ventas' ? 'Ventas' : name === 'proyCompras' ? 'Proyección Compras' : 'Proyección Ventas'
                ]}
                labelFormatter={(label) => `Día ${label}`}
              />
              {hasSales && <Legend formatter={(v) => v === 'compras' ? 'Compras' : v === 'ventas' ? 'Ventas' : v === 'proyCompras' ? 'Proy. Compras' : 'Proy. Ventas'} />}
              <ReferenceArea x1={daysElapsed} x2={daysInMonth} fill="hsl(var(--muted))" fillOpacity={0.5} />

              <Line type="monotone" dataKey="compras" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              {hasSales && <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />}
              <Line type="monotone" dataKey="proyCompras" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              {hasSales && <Line type="monotone" dataKey="proyVentas" stroke="#6ee7b7" strokeDasharray="5 5" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Narrative Panel */}
      {narrativeState === 'loading' && (
        <div className="mx-6 mb-6 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm text-muted-foreground">La IA está analizando tus tendencias financieras...</p>
        </div>
      )}

      {narrativeState === 'done' && narrative && (
        <div className="mx-6 mb-6 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 bg-violet-500/10 border border-violet-500/20 text-violet-500 rounded-full flex items-center justify-center text-[10px]">✦</span>
            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Análisis de Tendencias — IA</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{narrative}</p>
        </div>
      )}

      {narrativeState === 'error' && (
        <div className="mx-6 mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-600 dark:text-red-400">❌ {narrativeError}</p>
        </div>
      )}
    </div>
  );
}
