'use client';

import { useState } from 'react';
import { upsertBudget } from '@/app/actions';

const CATEGORIES = [
  'Alimentación',
  'Hogar',
  'Tecnología',
  'Transporte',
  'Salud',
  'Servicios',
  'Otros'
];

export default function BudgetSettings({ initialBudgets }: { initialBudgets: any[] }) {
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialBudgets.forEach(b => map[b.category] = Number(b.amount));
    return map;
  });
  
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  const handleSave = async (category: string, amount: number) => {
    setSavingCategory(category);
    try {
      await upsertBudget(category, amount);
      setBudgets(prev => ({ ...prev, [category]: amount }));
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Error al guardar presupuesto.');
    } finally {
      setSavingCategory(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm mt-8">
      <h2 className="text-xl font-semibold mb-4 text-card-foreground">Presupuestos por Categoría</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Establece límites de gasto mensual para cada categoría. Recibirás alertas cuando te acerques a estos límites.
      </p>

      <div className="space-y-4">
        {CATEGORIES.map(cat => {
          const amount = budgets[cat] || 0;
          return (
            <div key={cat} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
              <span className="text-sm font-medium">{cat}</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    defaultValue={amount || ''}
                    placeholder="0.00"
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0 && val !== amount) {
                        handleSave(cat, val);
                      }
                    }}
                    className="w-32 bg-background border border-input rounded-md pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {savingCategory === cat && (
                  <svg className="animate-spin w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
