'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearch } from '@/app/actions';
import { useDebounce } from 'use-debounce';

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<{ invoices: any[]; items: any[] } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await globalSearch(debouncedQuery);
        setResults(res);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [debouncedQuery]);

  const handleSelect = (invoiceId: number) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/invoices/${invoiceId}`);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar facturas, proveedores..."
          className="w-64 pl-10 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground bg-muted/50 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results) setIsOpen(true) }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && results && (
        <div className="absolute top-full mt-2 w-96 max-w-[calc(100vw-2rem)] right-0 bg-popover text-popover-foreground rounded-xl border border-border shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          {results.invoices.length === 0 && results.items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No se encontraron resultados
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2 space-y-4">
              
              {results.invoices.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Facturas</p>
                  <div className="space-y-1">
                    {results.invoices.map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => handleSelect(inv.id)}
                        className="w-full text-left px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{inv.filename}</p>
                          <p className="text-xs text-muted-foreground truncate">{inv.supplier} • {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : ''}</p>
                        </div>
                        {inv.total && (
                          <span className="text-xs font-medium">${Number(inv.total).toLocaleString()}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.items.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ítems</p>
                  <div className="space-y-1">
                    {results.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.invoice_id)}
                        className="w-full text-left px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground truncate">en {item.filename}</p>
                        </div>
                        {item.total_price && (
                          <span className="text-xs font-medium">${Number(item.total_price).toLocaleString()}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
