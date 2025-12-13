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
      <div className="bg-muted p-1 rounded-lg flex items-center gap-1">
        <button
          onClick={() => setView('invoices')}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all
            ${view === 'invoices' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
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
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
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
