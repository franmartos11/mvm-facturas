'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  ComposedChart, Area,
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' };

type Tab = 'overview' | 'suppliers' | 'income' | 'inflation' | 'alerts';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => {
        if (res.status === 401) { router.push('/'); return null; }
        return res.json();
      })
      .then(json => { if (json) setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const selectedInflation = useMemo(() => {
    if (!data?.productInflation || !selectedProduct) return null;
    return data.productInflation.find((p: any) => p.description === selectedProduct) || null;
  }, [data, selectedProduct]);

  useEffect(() => {
    if (data?.productInflation?.length > 0 && !selectedProduct) {
      setSelectedProduct(data.productInflation[0].description);
    }
  }, [data]);

  if (loading) return (
    <div className="min-h-screen p-8 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Calculando análisis…</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { totals, monthly, categories, suppliers, taxPressure, heatmap,
          result, duplicates, paymentMethods, paymentTerms, customers, productInflation } = data;

  const diff = totals.currentMonth - totals.prevMonth;
  const diffPct = totals.prevMonth > 0 ? (diff / totals.prevMonth) * 100 : 0;

  const hasSales = result.some((r: any) => r.ingresos > 0);

  // Build heatmap grid (last 90 days)
  const heatmapMap: Record<string, { total: number; count: number }> = {};
  heatmap.forEach((h: any) => { heatmapMap[h.date.slice(0, 10)] = h; });
  const heatmapDays: { date: string; total: number; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    heatmapDays.push({ date: key, total: heatmapMap[key]?.total || 0, count: heatmapMap[key]?.count || 0 });
  }
  const maxHeat = Math.max(...heatmapDays.map(d => d.total), 1);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'suppliers', label: 'Proveedores', icon: '🏪' },
    { id: 'income', label: 'Ingresos vs Egresos', icon: '⚖️' },
    { id: 'inflation', label: 'Inflación de Insumos', icon: '📈' },
    { id: 'alerts', label: `Alertas${duplicates.length > 0 ? ` (${duplicates.length})` : ''}`, icon: '🚨' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análisis Financiero</h1>
            <p className="text-muted-foreground mt-1">Todos los análisis sobre tus facturas</p>
          </div>
          <button onClick={() => router.push('/')}
            className="px-4 py-2 bg-muted hover:bg-accent border border-border rounded-full text-sm font-medium transition-colors">
            ← Volver
          </button>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Gasto este mes',
              value: `$${fmt(totals.currentMonth)}`,
              sub: `${diffPct >= 0 ? '↑' : '↓'} ${Math.abs(diffPct).toFixed(1)}% vs mes anterior`,
              color: diffPct > 0 ? 'text-red-500' : 'text-emerald-500',
            },
            {
              label: 'Mes anterior',
              value: `$${fmt(totals.prevMonth)}`,
              sub: 'Total facturado',
              color: 'text-muted-foreground',
            },
            {
              label: 'Categorías activas',
              value: categories.length,
              sub: 'Detectadas por IA',
              color: 'text-violet-500',
            },
            {
              label: 'Proveedores',
              value: suppliers.length,
              sub: 'Con mayor volumen',
              color: 'text-blue-500',
            },
          ].map((kpi, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 hover:border-violet-500/40 transition-all">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{kpi.value}</p>
              <p className={`text-xs mt-1 font-medium ${kpi.color}`}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap border-b border-border pb-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Monthly + Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Gasto mensual (12 meses)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly}>
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${fmt(v)}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${fmtDec(Number(v))}`, 'Total']} />
                      <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Distribución por categoría</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                        {categories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${fmtDec(Number(v))}`, 'Monto']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {categories.slice(0, 5).map((cat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground truncate max-w-[120px]">{cat.category}</span>
                      </div>
                      <span className="font-medium text-foreground">${fmt(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-1">Actividad de facturación (últimos 90 días)</h3>
              <p className="text-xs text-muted-foreground mb-4">Cada celda = un día. Más oscuro = más gasto.</p>
              <div className="flex flex-wrap gap-1">
                {heatmapDays.map((day, i) => {
                  const intensity = day.total / maxHeat;
                  const opacity = day.total === 0 ? 0.08 : 0.15 + intensity * 0.85;
                  return (
                    <div key={i} title={`${day.date}: $${fmtDec(day.total)} (${day.count} facturas)`}
                      className="w-4 h-4 rounded-sm cursor-default transition-all hover:scale-125"
                      style={{ backgroundColor: day.total === 0 ? 'hsl(var(--muted))' : `rgba(139,92,246,${opacity})` }} />
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Menos</span>
                {[0.1, 0.3, 0.55, 0.75, 1].map((op, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(139,92,246,${op})` }} />
                ))}
                <span className="text-xs text-muted-foreground">Más</span>
              </div>
            </div>

            {/* Tax pressure + Payment methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Presión fiscal por categoría</h3>
                <p className="text-xs text-muted-foreground mb-4">% de IVA promedio sobre subtotal</p>
                {taxPressure.length === 0
                  ? <p className="text-sm text-muted-foreground py-8 text-center">Sin datos suficientes</p>
                  : <div className="space-y-3">
                    {taxPressure.map((t: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{t.category}</span>
                          <span className="font-semibold text-foreground">{t.avg_tax_rate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(t.avg_tax_rate / 30 * 100, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Métodos de pago</h3>
                <p className="text-xs text-muted-foreground mb-4">Distribución por monto total</p>
                {paymentMethods.length === 0
                  ? <p className="text-sm text-muted-foreground py-8 text-center">Sin datos suficientes</p>
                  : <>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={paymentMethods} dataKey="total" nameKey="payment_method" cx="50%" cy="50%" outerRadius={60} paddingAngle={4}>
                            {paymentMethods.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${fmtDec(Number(v))}`, 'Monto']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-2">
                      {paymentMethods.map((pm: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-muted-foreground">{pm.payment_method}</span>
                          </div>
                          <span className="font-medium">{pm.count} fact. · ${fmt(pm.total)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                }
              </div>
            </div>
          </div>
        )}

        {/* ─── SUPPLIERS TAB ─── */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold">Ranking de proveedores</h3>
                <p className="text-xs text-muted-foreground mt-1">Por monto total facturado</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">#</th>
                      <th className="px-6 py-3 text-left font-medium">Proveedor</th>
                      <th className="px-6 py-3 text-right font-medium">Facturas</th>
                      <th className="px-6 py-3 text-right font-medium">Ticket Prom.</th>
                      <th className="px-6 py-3 text-right font-medium">Total</th>
                      <th className="px-6 py-3 text-right font-medium">Participación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(() => {
                      const totalAll = suppliers.reduce((s: number, r: any) => s + r.total, 0);
                      return suppliers.map((sup: any, i: number) => {
                        const pct = totalAll > 0 ? (sup.total / totalAll) * 100 : 0;
                        return (
                          <tr key={i} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-muted-foreground font-mono">{i + 1}</td>
                            <td className="px-6 py-4 font-medium text-foreground">{sup.supplier}</td>
                            <td className="px-6 py-4 text-right text-muted-foreground">{sup.count}</td>
                            <td className="px-6 py-4 text-right text-muted-foreground">${fmtDec(sup.avg_ticket)}</td>
                            <td className="px-6 py-4 text-right font-semibold text-violet-600">${fmtDec(sup.total)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Terms */}
            {paymentTerms.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Plazos de pago por proveedor</h3>
                <p className="text-xs text-muted-foreground mb-4">Días promedio entre fecha de factura y vencimiento</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentTerms} layout="vertical">
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} tickFormatter={v => `${v}d`} />
                      <YAxis type="category" dataKey="supplier" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} width={120} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} días`, 'Plazo promedio']} />
                      <Bar dataKey="avg_days_to_pay" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Customers if any sales */}
            {customers.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="font-semibold">Top Clientes (facturas de venta)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium">Cliente</th>
                        <th className="px-6 py-3 text-left font-medium">CUIT</th>
                        <th className="px-6 py-3 text-right font-medium">Facturas</th>
                        <th className="px-6 py-3 text-right font-medium">Ticket Prom.</th>
                        <th className="px-6 py-3 text-right font-medium">Total facturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {customers.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="px-6 py-4 font-medium text-foreground">{c.customer_name}</td>
                          <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{c.customer_cuit || '—'}</td>
                          <td className="px-6 py-4 text-right text-muted-foreground">{c.count}</td>
                          <td className="px-6 py-4 text-right text-muted-foreground">${fmtDec(c.avg_ticket)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-emerald-600">${fmtDec(c.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── INCOME vs EXPENSES TAB ─── */}
        {activeTab === 'income' && (
          <div className="space-y-6">
            {!hasSales ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚖️</span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Sin facturas de venta cargadas</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Este análisis compara tus ingresos (facturas de venta) contra tus egresos (facturas de compra).<br />
                  La IA detecta automáticamente el tipo de factura al analizarla.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-semibold mb-1">Ingresos vs Egresos por mes</h3>
                  <p className="text-xs text-muted-foreground mb-4">Últimos 12 meses</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={result}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${fmt(v)}`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${fmtDec(Number(v))}`, '']} />
                        <Legend />
                        <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Line dataKey="resultado" name="Resultado" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h3 className="font-semibold">Detalle mensual</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-6 py-3 text-left">Mes</th>
                          <th className="px-6 py-3 text-right">Ingresos</th>
                          <th className="px-6 py-3 text-right">Egresos</th>
                          <th className="px-6 py-3 text-right">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {result.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-6 py-4 font-medium text-foreground">{r.month}</td>
                            <td className="px-6 py-4 text-right text-emerald-600 font-medium">${fmtDec(r.ingresos)}</td>
                            <td className="px-6 py-4 text-right text-red-500 font-medium">${fmtDec(r.egresos)}</td>
                            <td className={`px-6 py-4 text-right font-bold ${r.resultado >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {r.resultado >= 0 ? '+' : ''}${fmtDec(r.resultado)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── INFLATION TAB ─── */}
        {activeTab === 'inflation' && (
          <div className="space-y-6">
            {productInflation.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📈</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Aún no hay datos suficientes</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Para ver la evolución de precios de un producto necesitás que aparezca en facturas de al menos 2 meses distintos.
                </p>
              </div>
            ) : (
              <>
                {/* Ranking of price change */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="font-semibold mb-1">Productos con mayor variación de precio</h3>
                  <p className="text-xs text-muted-foreground mb-4">Comparando primer vs último registro</p>
                  <div className="space-y-3">
                    {productInflation.map((p: any, i: number) => (
                      <button key={i} onClick={() => setSelectedProduct(p.description)}
                        className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedProduct === p.description
                            ? 'border-violet-500 bg-violet-500/5'
                            : 'border-border hover:border-violet-500/40 hover:bg-muted/30'
                        }`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{p.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.points.length} meses de datos</p>
                        </div>
                        <span className={`text-sm font-bold ml-4 shrink-0 ${p.change > 0 ? 'text-red-500' : p.change < 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          {p.change > 0 ? '↑' : p.change < 0 ? '↓' : '='} {Math.abs(p.change)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price evolution chart */}
                {selectedInflation && (
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold truncate">{selectedInflation.description}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Precio unitario promedio por mes</p>
                      </div>
                      <span className={`text-lg font-bold ${selectedInflation.change > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {selectedInflation.change > 0 ? '↑' : '↓'} {Math.abs(selectedInflation.change)}%
                      </span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedInflation.points}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${fmt(v)}`} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${fmtDec(Number(v))}`, 'Precio promedio']} />
                          <Line dataKey="avg_price" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="bg-muted/40 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Precio inicial</p>
                        <p className="font-bold text-foreground mt-1">${fmtDec(selectedInflation.points[0].avg_price)}</p>
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Precio actual</p>
                        <p className="font-bold text-foreground mt-1">${fmtDec(selectedInflation.points[selectedInflation.points.length - 1].avg_price)}</p>
                      </div>
                      <div className={`rounded-xl p-3 text-center ${selectedInflation.change > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                        <p className="text-xs text-muted-foreground">Variación total</p>
                        <p className={`font-bold mt-1 ${selectedInflation.change > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {selectedInflation.change > 0 ? '+' : ''}{selectedInflation.change}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── ALERTS TAB ─── */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {duplicates.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Sin duplicados detectados</h3>
                <p className="text-muted-foreground text-sm">No se encontraron facturas con el mismo número y CUIT de proveedor.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border bg-red-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-600 dark:text-red-400">Posibles facturas duplicadas</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Se encontraron {duplicates.length} factura(s) con el mismo número y CUIT de proveedor
                      </p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {duplicates.map((dup: any, i: number) => (
                    <div key={i} className="p-6">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {dup.occurrences}x
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{dup.supplier}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            CUIT: <span className="font-mono">{dup.supplier_cuit}</span> · Nº: <span className="font-mono">{dup.invoice_number}</span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {dup.invoice_ids.map((id: number, j: number) => (
                              <button key={j} onClick={() => router.push(`/invoices/${id}`)}
                                className="text-xs px-3 py-1.5 bg-muted hover:bg-accent border border-border rounded-lg transition-colors font-medium">
                                Factura #{id} — ${fmtDec(Number(dup.totals[j]))} · {dup.dates[j] || 'sin fecha'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
