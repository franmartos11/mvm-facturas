'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PaymentMethodsPieProps {
  invoices: any[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function PaymentMethodsPie({ invoices }: PaymentMethodsPieProps) {
  const data = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed' && inv.total);
    const methodMap: Record<string, number> = {};

    analyzed.forEach(inv => {
      let method = inv.payment_method || 'Desconocido';
      // Normalize common names
      if (method.toLowerCase().includes('tarjeta')) method = 'Tarjeta';
      else if (method.toLowerCase().includes('efectivo')) method = 'Efectivo';
      else if (method.toLowerCase().includes('transferencia')) method = 'Transferencia';
      else if (method.toLowerCase().includes('cuenta corriente')) method = 'Cuenta Corriente';
      else method = 'Otro/Desconocido';

      methodMap[method] = (methodMap[method] || 0) + Number(inv.total);
    });

    return Object.entries(methodMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [invoices]);

  if (data.length === 0) return null;

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Flujo de Caja por Método de Pago</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [`$${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`, 'Gasto']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: '11px', color: 'hsl(var(--foreground))' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
