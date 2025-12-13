'use client';

import { useState, useMemo } from 'react';
import ProductHistoryModal from './ProductHistoryModal';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProductsListClientProps {
  initialItems: any[];
}

// Pastel color palette for products
const PRODUCT_COLORS = [
  { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
];

function getProductColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRODUCT_COLORS.length;
  return PRODUCT_COLORS[index];
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

    // Return items enriched 
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
           <h2 className="text-xl font-bold text-foreground">
            Productos Extraídos
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitoriza los precios y cantidades de tus compras.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            className="w-full sm:w-72 pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-semibold text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Factura</th>
                <th className="px-6 py-4 text-right">Cant.</th>
                <th className="px-6 py-4 text-right">Unitario</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const color = getProductColor(item.description);
                  
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-accent/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedProduct(item.description)}
                    >
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${color.bg} ${color.text} ${color.border}`}>
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        <span className="line-clamp-1 max-w-[150px]" title={item.invoices?.filename}>
                          {item.invoices?.filename}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground font-mono">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex flex-col items-end gap-1">
                           <span className="font-mono text-foreground">
                             ${Number(item.unit_price).toFixed(2)}
                           </span>
                           
                           {/* Trend Indicator */}
                           {item.trend.type === 'up' && (
                             <div className="flex items-center text-red-600 dark:text-red-400 text-[10px] font-medium bg-red-50 dark:bg-red-900/20 px-1.5 rounded-full">
                               <TrendingUp className="w-3 h-3 mr-1" />
                               +{item.trend.change.toFixed(0)}%
                             </div>
                           )}
                           {item.trend.type === 'down' && (
                             <div className="flex items-center text-green-600 dark:text-green-400 text-[10px] font-medium bg-green-50 dark:bg-green-900/20 px-1.5 rounded-full">
                                <TrendingDown className="w-3 h-3 mr-1" />
                               -{item.trend.change.toFixed(0)}%
                             </div>
                           )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground font-mono">
                        ${Number(item.total_price).toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-muted-foreground/50" />
                      <p>No se encontraron productos</p>
                    </div>
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
