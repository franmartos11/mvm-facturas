'use client';

import { useState, useEffect } from 'react';

export interface FilterState {
  search: string;
  status: string;
  supplier: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

interface InvoiceFiltersProps {
  invoices: any[];
  onFilterChange: (filters: FilterState) => void;
}

export default function InvoiceFilters({ invoices, onFilterChange }: InvoiceFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    supplier: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  // Derive unique suppliers for the select dropdown
  const suppliers = Array.from(
    new Set(invoices.map(inv => inv.supplier).filter(Boolean))
  ).sort() as string[];

  // Update parent whenever filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: filters.search, // keep search
      status: '',
      supplier: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => key !== 'search' && val !== '').length;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm mb-4">
      {/* Top Row: Search and Expand Button */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Buscar facturas o etiquetas..." 
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border flex items-center gap-2 ${
            isExpanded || activeFiltersCount > 0
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-background text-foreground border-border hover:bg-muted/50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="analyzed">Analizados</option>
              <option value="error">Error</option>
              <option value="invalid">No es factura</option>
            </select>
          </div>

          {/* Supplier Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Proveedor</label>
            <select
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos</option>
              {suppliers.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Rango de Fechas (Factura)</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Monto Total ($)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mínimo"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                placeholder="Máximo"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Clear Button */}
          {activeFiltersCount > 0 && (
            <div className="lg:col-span-4 flex justify-end mt-2">
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
