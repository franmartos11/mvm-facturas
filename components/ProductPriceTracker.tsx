'use client';

import { useState } from 'react';
import { trackProductPrice } from '@/app/actions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProductPriceTracker() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const data = await trackProductPrice(query);
      setResults(data);
      setHasSearched(true);
    } catch (error) {
      console.error('Error tracking product:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = results.map(r => ({
    date: new Date(r.invoice_date || r.created_at).toLocaleDateString('es-ES'),
    timestamp: new Date(r.invoice_date || r.created_at).getTime(),
    price: Number(r.unit_price),
    supplier: r.supplier,
    description: r.description
  })).sort((a, b) => a.timestamp - b.timestamp);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Rastreador de Precios
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Buscá un producto para ver la evolución de su precio.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Resma A4, Leche..."
            className="bg-background border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block w-full md:w-64 p-2.5"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {hasSearched && results.length === 0 && (
        <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
          No se encontraron productos que coincidan con "{query}".
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={val => `$${val}`} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string, props: any) => [
                    `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                    props.payload.supplier
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.description || label}
                />
                <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/30 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Producto exacto</th>
                  <th className="px-4 py-2 font-medium">Proveedor</th>
                  <th className="px-4 py-2 font-medium text-right">Precio Unitario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartData.reverse().map((row, i) => (
                  <tr key={i} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-2 text-foreground font-medium truncate max-w-[200px]" title={row.description}>{row.description}</td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[150px]">{row.supplier}</td>
                    <td className="px-4 py-2 text-right font-semibold text-emerald-500">${row.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
