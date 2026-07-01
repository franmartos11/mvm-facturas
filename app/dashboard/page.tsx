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
      <div className="min-h-screen p-8 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60">Cargando métricas...</p>
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
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              Métricas Financieras
            </h1>
            <p className="text-white/50 mt-1">Análisis detallado de tus gastos categorizados</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-colors"
          >
            ← Volver al inicio
          </button>
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-white/60 text-sm font-medium mb-2">Gasto Mes Actual</h3>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold">${totals.currentMonth.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              <div className={`flex items-center gap-1 mb-1 text-sm font-medium ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {diff > 0 ? '↑' : '↓'}
                {Math.abs(diffPercent).toFixed(1)}% vs mes pasado
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-white/60 text-sm font-medium mb-2">Total de Categorías</h3>
            <p className="text-4xl font-bold">{categories.length}</p>
            <p className="text-white/40 text-sm mt-1">Detectadas automáticamente</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Monthly Trend */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-6">Tendencia de Gastos (6 meses)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="month" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => \`$\${val}\`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [\`$\${Number(value).toFixed(2)}\`, 'Total']}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Pie */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-6">Distribución por Categoría</h3>
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
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                    formatter={(value: any) => [\`$\${Number(value).toFixed(2)}\`, 'Monto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Suppliers Table */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl overflow-hidden">
          <h3 className="text-lg font-semibold mb-6">Top Proveedores (Mayor gasto)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 border-b border-white/5 text-white/60">
                <tr>
                  <th className="px-6 py-4 font-medium rounded-tl-xl">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Facturas</th>
                  <th className="px-6 py-4 font-medium rounded-tr-xl">Monto Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {suppliers.map((sup: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium">{sup.supplier}</td>
                    <td className="px-6 py-4 text-white/70">{sup.count}</td>
                    <td className="px-6 py-4 text-violet-400 font-semibold">${sup.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-white/40">No hay suficientes datos de proveedores.</td>
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
