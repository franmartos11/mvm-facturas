'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => {
        if (res.status === 401) {
          router.push('/');
          return null;
        }
        return res.json();
      })
      .then(json => {
        if (json) {
          setData(json);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totals, monthly, categories, suppliers } = data;
  const diff = totals.currentMonth - totals.prevMonth;
  const diffPercent = totals.prevMonth === 0 ? 100 : (diff / totals.prevMonth) * 100;

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Métricas Financieras
            </h1>
            <p className="text-muted-foreground mt-1">Análisis detallado de tus gastos categorizados</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-muted hover:bg-accent border border-border rounded-full text-sm font-medium transition-colors text-foreground"
          >
            ← Volver al inicio
          </button>
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Gasto Mes Actual</h3>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold text-foreground">${totals.currentMonth.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              <div className={`flex items-center gap-1 mb-1 text-sm font-medium ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {diff > 0 ? '↑' : '↓'}
                {Math.abs(diffPercent).toFixed(1)}% vs mes pasado
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Total de Categorías</h3>
            <p className="text-4xl font-bold text-foreground">{categories.length}</p>
            <p className="text-muted-foreground text-sm mt-1">Detectadas automáticamente</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Monthly Trend */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-foreground">Tendencia de Gastos (6 meses)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Total']}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Pie */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6 text-foreground">Distribución por Categoría</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                  >
                    {categories.map((_: any, index: number) => (
                      <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => [\`$\${Number(value).toFixed(2)}\`, 'Monto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Suppliers Table */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
          <h3 className="text-lg font-semibold mb-6 text-foreground">Top Proveedores (Mayor gasto)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium rounded-tl-xl">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Facturas</th>
                  <th className="px-6 py-4 font-medium rounded-tr-xl">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.map((sup: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{sup.supplier}</td>
                    <td className="px-6 py-4 text-muted-foreground">{sup.count}</td>
                    <td className="px-6 py-4 text-violet-600 font-semibold">${sup.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No hay suficientes datos de proveedores.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
