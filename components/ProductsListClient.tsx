'use client';

import { useState } from 'react';

interface ProductsListClientProps {
  initialItems: any[];
}

export default function ProductsListClient({ initialItems }: ProductsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = initialItems.filter(item => 
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
          <span className="text-sm text-slate-500 dark:text-zinc-400">
            {filteredItems.length} producto{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>
       
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
           <input 
             type="text" 
             placeholder="Buscar productos..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
           />
           <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-zinc-400">
            {searchQuery ? 'No se encontraron productos con ese nombre.' : 'No hay productos analizados todavía.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Descripción</th>
                  <th className="px-6 py-3 text-right">Cant.</th>
                  <th className="px-6 py-3 text-right">Precio Ud.</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Factura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-zinc-300">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-zinc-300">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-zinc-100">
                      ${Number(item.total_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[150px]">
                      <a 
                        href={item.invoices?.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                      >
                        {item.invoices?.filename}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
