
'use client';

import { useState, useMemo } from 'react';
import ProductHistoryModal from './ProductHistoryModal';

interface ProductsListClientProps {
  initialItems: any[];
}

export default function ProductsListClient({ initialItems }: ProductsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Calculate trends for each item
  const itemsWithTrends = useMemo(() => {
    if (!initialItems) return [];
    
    // 1. Group by product name
    const groups: Record<string, any[]> = {};
    const normalize = (s: string) => s.toLowerCase().trim();
    
    initialItems.forEach(item => {
      const key = normalize(item.description);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // 2. Sort groups by date and calculate trends
    const trendMap = new Map<number, { change: number, type: 'up' | 'down' | 'same' | 'new' }>();

    Object.values(groups).forEach(group => {
       // Sort ascending by date
       group.sort((a, b) => {
         const d1 = new Date(a.invoices?.created_at || 0).getTime();
         const d2 = new Date(b.invoices?.created_at || 0).getTime();
         return d1 - d2;
       });

       group.forEach((item, index) => {
         if (index === 0) {
           trendMap.set(item.id, { change: 0, type: 'new' });
         } else {
           const prev = group[index - 1];
           const currentPrice = Number(item.unit_price);
           const prevPrice = Number(prev.unit_price);
           
           if (prevPrice === 0) {
              trendMap.set(item.id, { change: 0, type: 'new' });
              return;
           }

           const change = ((currentPrice - prevPrice) / prevPrice) * 100;
           
           let type: 'up' | 'down' | 'same' = 'same';
           if (change > 0.5) type = 'up'; // Threshold to avoid floating point noise
           if (change < -0.5) type = 'down';

           trendMap.set(item.id, { change: Math.abs(change), type });
         }
       });
    });

    // Return items enriched (or just map inputs to outputs in render, but lets attach map)
    return initialItems.map(item => ({
      ...item,
      trend: trendMap.get(item.id) || { change: 0, type: 'new' }
    }));
  }, [initialItems]);

  const filteredItems = itemsWithTrends.filter(item => 
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.invoices?.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-50">
            Productos Extraídos
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Lista completa de ítems detectados en las facturas. Haz click para ver el historial.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg className="w-4 h-4 absolute left-3 top-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3">Factura</th>
                <th className="px-6 py-3 text-right">Cantidad</th>
                <th className="px-6 py-3 text-right">Precio Unitario</th>
                <th className="px-6 py-3 text-right">Total Linea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedProduct(item.description)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 text-xs">
                      {item.invoices?.filename}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-zinc-300">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                       <span className="text-slate-600 dark:text-zinc-300">
                         ${Number(item.unit_price).toFixed(2)}
                       </span>
                       
                       {/* Trend Indicator */}
                       {item.trend.type === 'up' && (
                         <div className="flex items-center text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded text-[10px] font-medium" title={`Subió un ${item.trend.change.toFixed(1)}% respecto a la compra anterior`}>
                           <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                           </svg>
                           {item.trend.change.toFixed(0)}%
                         </div>
                       )}
                       {item.trend.type === 'down' && (
                         <div className="flex items-center text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded text-[10px] font-medium" title={`Bajó un ${item.trend.change.toFixed(1)}% respecto a la compra anterior`}>
                            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                           </svg>
                           {item.trend.change.toFixed(0)}%
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-zinc-100">
                      ${Number(item.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-zinc-400">
                    No se encontraron productos que coincidan con tu búsqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <ProductHistoryModal 
          productName={selectedProduct} 
          allItems={initialItems} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
}
