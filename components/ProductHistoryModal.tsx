
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ProductHistoryModalProps {
  productName: string;
  allItems: any[];
  onClose: () => void;
}

export default function ProductHistoryModal({ productName, allItems, onClose }: ProductHistoryModalProps) {
  
  const historyData = useMemo(() => {
    if (!productName || !allItems) return [];

    // Filter items matching the name (case insensitive)
    // We match by exact(ish) name to track the "same" product
    const normalize = (s: string) => s.toLowerCase().trim();
    const target = normalize(productName);

    return allItems
      .filter(item => normalize(item.description) === target)
      .map(item => ({
        date: item.invoices?.created_at, // ISO String
        price: item.unit_price,
        quantity: item.quantity,
        invoice: item.invoices?.filename
      }))
      .filter(item => item.date && item.price) // Ensure valid data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending
  }, [productName, allItems]);

  const chartData = historyData.map(item => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    price: Number(item.price)
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
            {productName}
          </h2>
          <p className="text-zinc-500 text-sm">
            Historial de precios
          </p>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full mb-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
           {historyData.length > 1 ? (
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:stroke-zinc-700" />
                 <XAxis 
                   dataKey="date" 
                   stroke="#71717A" 
                   fontSize={12} 
                   tickLine={false} 
                   axisLine={false}
                   dy={10}
                 />
                 <YAxis 
                   stroke="#71717A" 
                   fontSize={12} 
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(value) => `$${value}`} 
                   domain={['auto', 'auto']}
                 />
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: '#fff', 
                     borderRadius: '8px', 
                     border: '1px solid #E4E4E7'
                   }}
                   formatter={(value: number) => [`$${value.toFixed(2)}`, 'Precio Unitario']}
                 />
                 <Line 
                   type="monotone" 
                   dataKey="price" 
                   stroke="#2563EB" 
                   strokeWidth={2}
                   dot={{ r: 4, fill: '#2563EB' }}
                   activeDot={{ r: 6 }}
                 />
               </LineChart>
             </ResponsiveContainer>
           ) : (
             <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
               Necesitas más de una compra para ver la tendencia.
             </div>
           )}
        </div>

        {/* History Table */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-100">
            Compras Recientes
          </h3>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Factura</th>
                  <th className="px-4 py-2 text-right">Cant.</th>
                  <th className="px-4 py-2 text-right">Precio Ud.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {[...historyData].reverse().map((row, i) => ( // Show newest first in table
                  <tr key={i} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300 truncate max-w-[150px]" title={row.invoice}>
                      {row.invoice}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-300">
                      {row.quantity}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900 dark:text-zinc-100">
                      ${Number(row.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
