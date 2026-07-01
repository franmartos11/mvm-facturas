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

interface SupplierAnalysisProps {
  invoices: any[];
}

const COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7'
];

export default function SupplierAnalysis({ invoices }: SupplierAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { rankingData, concentrationData, frequencyData, totalSpend } = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed' && inv.supplier);

    if (analyzed.length === 0) {
      return { rankingData: [], concentrationData: [], frequencyData: [], totalSpend: 0 };
    }

    const supplierMap: Record<string, { total: number; count: number; lastDate: string }> = {};

    analyzed.forEach(inv => {
      const s = inv.supplier;
      if (!supplierMap[s]) {
        supplierMap[s] = { total: 0, count: 0, lastDate: '' };
      }
      supplierMap[s].total += Number(inv.total) || 0;
      supplierMap[s].count += 1;
      const d = inv.invoice_date || inv.created_at;
      if (!supplierMap[s].lastDate || d > supplierMap[s].lastDate) {
        supplierMap[s].lastDate = d;
      }
    });

    const total = Object.values(supplierMap).reduce((sum, s) => sum + s.total, 0);

    const sorted = Object.entries(supplierMap)
      .map(([name, data]) => ({ name, ...data, pct: total > 0 ? (data.total / total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    const top10 = sorted.slice(0, 10);
    const others = sorted.slice(10).reduce((sum, s) => sum + s.total, 0);

    // Pie: top 5 + Otros
    const top5 = sorted.slice(0, 5);
    const othersTotal = total - top5.reduce((s, x) => s + x.total, 0);
    const pieData = [
      ...top5.map(s => ({ name: s.name, value: s.total })),
      ...(othersTotal > 0 ? [{ name: 'Otros', value: othersTotal }] : [])
    ];

    // Frequency: avg days between purchases (approx)
    const freqData = top10.map(s => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
      fullName: s.name,
      facturas: s.count,
      total: s.total,
    })).slice(0, 8);

    return {
      rankingData: top10,
      concentrationData: pieData,
      frequencyData: freqData,
      totalSpend: total,
    };
  }, [invoices]);

  if (rankingData.length === 0) return null;

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
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Análisis de Proveedores
          <span className="text-xs font-normal text-muted-foreground">— Vendor Intelligence</span>
        </h3>
        <button className="text-sm font-medium text-primary hover:underline">
          {isOpen ? 'Ocultar' : 'Ver análisis'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 pt-0 animate-in slide-in-from-top-4 fade-in space-y-8">
          {/* TOP ROW: Ranking table + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ranking Table */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Ranking por Gasto Total</p>
              <div className="space-y-2">
                {rankingData.map((supplier, idx) => (
                  <div key={supplier.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate" title={supplier.name}>
                          {supplier.name}
                        </span>
                        <span className="text-xs font-semibold text-foreground ml-2 shrink-0">
                          ${supplier.total.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${supplier.pct}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                      {supplier.pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Concentration Pie */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Concentración de Gasto (Top 5)</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={concentrationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {concentrationData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`$${value.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`, 'Gasto']}
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
          </div>

          {/* BOTTOM: Frequency Bar Chart */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">
              Frecuencia de Compra (Número de Facturas por Proveedor)
            </p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'transparent' }}
                    formatter={(value: number, name: string) => [value, name === 'facturas' ? 'Nº Facturas' : name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="facturas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
