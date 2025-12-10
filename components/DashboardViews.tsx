'use client';

import { useState, ReactNode } from 'react';

interface DashboardViewsProps {
  invoicesView: ReactNode;
  productsView: ReactNode;
}

export default function DashboardViews({ invoicesView, productsView }: DashboardViewsProps) {
  const [view, setView] = useState<'invoices' | 'products'>('invoices');

  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* Tabs */}
      <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg flex items-center gap-1">
        <button
          onClick={() => setView('invoices')}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all
            ${view === 'invoices' 
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm' 
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }
          `}
        >
          Facturas
        </button>
        <button
          onClick={() => setView('products')}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all
            ${view === 'products' 
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm' 
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }
          `}
        >
          Productos
        </button>
      </div>

      {/* Content */}
      <div className="w-full">
        <div className={view === 'invoices' ? 'block' : 'hidden'}>
          {invoicesView}
        </div>
        <div className={view === 'products' ? 'block' : 'hidden'}>
          {productsView}
        </div>
      </div>

    </div>
  );
}
