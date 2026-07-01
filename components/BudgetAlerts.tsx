'use client';

import { useMemo } from 'react';

interface BudgetAlertsProps {
  budgets: any[];
  items: any[];
}

export default function BudgetAlerts({ budgets, items }: BudgetAlertsProps) {
  const currentMonthData = useMemo(() => {
    if (!budgets || budgets.length === 0) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Sum expenses by category for current month
    const categorySpending: Record<string, number> = {};

    items.forEach(item => {
      const dateStr = item.invoice_date || item.invoice_created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const cat = item.category || 'Otros';
        categorySpending[cat] = (categorySpending[cat] || 0) + Number(item.total_price);
      }
    });

    // Map to budgets
    return budgets.map(budget => {
      const limit = Number(budget.amount);
      const spent = categorySpending[budget.category] || 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      if (percentage >= 100) status = 'danger';
      else if (percentage >= 80) status = 'warning';

      return {
        category: budget.category,
        limit,
        spent,
        percentage: Math.min(percentage, 100), // Cap visual at 100%
        isOverLimit: percentage > 100,
        status
      };
    }).sort((a, b) => b.percentage - a.percentage); // Show most critical first
  }, [budgets, items]);

  if (currentMonthData.length === 0) return null;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm mb-8 overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Presupuesto del Mes
        </h3>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentMonthData.map(data => (
          <div key={data.category} className="bg-background border border-border p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm">{data.category}</span>
              <span className="text-xs font-mono">
                ${data.spent.toFixed(2)} / ${data.limit.toFixed(2)}
              </span>
            </div>
            
            <div className="w-full bg-secondary rounded-full h-2 mb-1 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${
                  data.status === 'danger' ? 'bg-red-500' :
                  data.status === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${data.percentage}%` }}
              />
            </div>
            {data.isOverLimit && (
              <p className="text-[10px] text-red-500 mt-1 font-medium">¡Límite excedido!</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
