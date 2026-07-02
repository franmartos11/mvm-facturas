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
  Legend
} from 'recharts';

interface SupplierComparerProps {
  invoices: any[];
  supplierA: string;
  supplierB: string;
}

export default function SupplierComparer({ invoices, supplierA, supplierB }: SupplierComparerProps) {
  const { chartData, statsA, statsB } = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed' && (inv.supplier === supplierA || inv.supplier === supplierB));

    // Stats
    const calcStats = (supplier: string) => {
      const invs = analyzed.filter(i => i.supplier === supplier);
      const total = invs.reduce((sum, i) => sum + Number(i.total || 0), 0);
      const count = invs.length;
      const lastPurchase = invs.length > 0 
        ? new Date(Math.max(...invs.map(i => new Date(i.invoice_date || i.created_at).getTime())))
        : null;
      
      return { total, count, avg: count > 0 ? total / count : 0, lastPurchase };
    };

    const sA = calcStats(supplierA);
    const sB = calcStats(supplierB);

    // Chart Data (Group by Month)
    const monthMap: Record<string, { month: string; A: number; B: number; timestamp: number }> = {};
    
    analyzed.forEach(inv => {
      const d = new Date(inv.invoice_date || inv.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthLabel, A: 0, B: 0, timestamp: d.getTime() };
      }
      
      if (inv.supplier === supplierA) {
        monthMap[monthKey].A += Number(inv.total || 0);
      } else {
        monthMap[monthKey].B += Number(inv.total || 0);
      }
    });

    const data = Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);

    return { chartData: data, statsA: sA, statsB: sB };
  }, [invoices, supplierA, supplierB]);

  if (!supplierA || !supplierB) return null;

  return (
    <div className="bg-background border border-border rounded-xl p-6 mt-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Comparativa Directa</h3>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
            <h4 className="font-medium text-foreground">{supplierA}</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gasto Total</p>
              <p className="text-lg font-bold">${statsA.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nº Facturas</p>
              <p className="text-lg font-bold">{statsA.count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Promedio</p>
              <p className="text-lg font-bold">${statsA.avg.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Última Compra</p>
              <p className="text-sm font-medium">{statsA.lastPurchase ? statsA.lastPurchase.toLocaleDateString('es-ES') : '-'}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <h4 className="font-medium text-foreground">{supplierB}</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gasto Total</p>
              <p className="text-lg font-bold">${statsB.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nº Facturas</p>
              <p className="text-lg font-bold">{statsB.count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Promedio</p>
              <p className="text-lg font-bold">${statsB.avg.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Última Compra</p>
              <p className="text-sm font-medium">{statsB.lastPurchase ? statsB.lastPurchase.toLocaleDateString('es-ES') : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div>
        <p className="text-sm font-medium text-foreground mb-4">Tendencia de Gasto Mensual</p>
        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={val => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [`$${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`, name === 'A' ? supplierA : supplierB]}
                />
                <Legend formatter={(value) => <span className="text-sm text-foreground">{value === 'A' ? supplierA : supplierB}</span>} />
                <Line type="monotone" dataKey="A" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="B" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              No hay datos suficientes para el gráfico
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
