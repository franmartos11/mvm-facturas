'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeInvoice, deleteInvoice } from '@/app/actions';
import InvoiceRow from './InvoiceRow';
import InvoiceFilters, { FilterState } from './InvoiceFilters';

import ConfirmationModal from './ConfirmationModal';

interface InvoiceSelectionListProps {
  invoices: any[];
}

export default function InvoiceSelectionList({ invoices }: InvoiceSelectionListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{current: number, total: number} | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    supplier: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  });

  // Filter invoices based on all criteria
  const filteredInvoices = invoices.filter(inv => {
    // 1. Search
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = !filters.search || 
      inv.filename.toLowerCase().includes(searchLower) ||
      (inv.supplier && inv.supplier.toLowerCase().includes(searchLower)) ||
      (inv.tags && inv.tags.some((t: string) => t.toLowerCase().includes(searchLower)));

    if (!matchesSearch) return false;

    // 2. Status
    if (filters.status && inv.status !== filters.status) return false;

    // 3. Supplier
    if (filters.supplier && inv.supplier !== filters.supplier) return false;

    // 4. Dates
    const invDateStr = inv.invoice_date || inv.created_at;
    const invDate = new Date(invDateStr).getTime();
    if (filters.dateFrom && invDate < new Date(filters.dateFrom).getTime()) return false;
    // Set to end of day for dateTo
    if (filters.dateTo) {
      const endTo = new Date(filters.dateTo);
      endTo.setHours(23, 59, 59, 999);
      if (invDate > endTo.getTime()) return false;
    }

    // 5. Amounts
    if (filters.minAmount && Number(inv.total) < Number(filters.minAmount)) return false;
    if (filters.maxAmount && Number(inv.total) > Number(filters.maxAmount)) return false;

    return true;
  });

  // Detect duplicates
  const duplicateIds = useMemo(() => {
    const analyzed = invoices.filter(inv => inv.status === 'analyzed' && inv.supplier && inv.total);
    const groups: Record<string, number[]> = {};
    
    analyzed.forEach(inv => {
      const dateStr = inv.invoice_date ? new Date(inv.invoice_date).toISOString().split('T')[0] : '';
      const key = `${inv.supplier.toLowerCase()}|${dateStr}|${Number(inv.total).toFixed(2)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(inv.id);
    });

    const duplicates = new Set<number>();
    Object.values(groups).forEach(ids => {
      if (ids.length > 1) {
        ids.forEach(id => duplicates.add(id));
      }
    });
    return duplicates;
  }, [invoices]);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(inv => inv.id));
    }
  };

  const handleBulkAnalyze = async () => {
    const idsToAnalyze = selectedIds.filter(id => {
      const inv = invoices.find(i => i.id === id);
      return inv && inv.status !== 'analyzed';
    });
    if (idsToAnalyze.length === 0) return;

    // Optional AI Ping before starting
    try {
      const pingRes = await fetch('/api/ai-ping');
      const data = await pingRes.json();
      if (!pingRes.ok || data.status !== 'ok') {
        setBulkMessage({ type: 'error', text: 'Error conectando con la IA local. Verifica que LM Studio esté corriendo.' });
        return;
      }
    } catch {
      setBulkMessage({ type: 'error', text: 'Error de red verificando la IA local.' });
      return;
    }

    setIsProcessing(true);
    setBulkMessage(null);
    setBulkProgress({ current: 0, total: idsToAnalyze.length });
    
    let errorCount = 0;
    let completedCount = 0;
    
    // Concurrency limit helper
    const limit = 3;
    let i = 0;
    
    const executeNext = async (): Promise<void> => {
      if (i >= idsToAnalyze.length) return;
      const id = idsToAnalyze[i++];
      const invoice = invoices.find(inv => inv.id === id);
      
      if (invoice) {
        try {
          await analyzeInvoice(id, invoice.file_path);
        } catch (error) {
          console.error(`Error analyzing invoice ${id}:`, error);
          errorCount++;
        }
      }
      
      completedCount++;
      setBulkProgress({ current: completedCount, total: idsToAnalyze.length });
      return executeNext();
    };

    const workers = Array.from({ length: Math.min(limit, idsToAnalyze.length) }, () => executeNext());
    await Promise.all(workers);

    setIsProcessing(false);
    setBulkProgress(null);
    setSelectedIds([]); 
    router.refresh();

    if (errorCount > 0) {
      setBulkMessage({ type: 'error', text: `Análisis completado con ${errorCount} errores.` });
    } else {
      setBulkMessage({ type: 'success', text: `Se analizaron ${idsToAnalyze.length} facturas correctamente.` });
    }
    
    setTimeout(() => setBulkMessage(null), 5000);
  };

  const handleBulkDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setShowDeleteModal(false);
    setIsProcessing(true);
    let errorCount = 0;

    for (const id of selectedIds) {
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) continue;

      try {
        await deleteInvoice(id, invoice.file_path);
      } catch (error) {
        console.error(`Error deleting invoice ${id}:`, error);
        errorCount++;
      }
    }

    setIsProcessing(false);
    setSelectedIds([]);
    router.refresh();

    if (errorCount > 0) {
      alert(`Borrado completado con ${errorCount} errores.`);
    }
  };

  const analyzableCount = selectedIds.filter(id => {
    const inv = invoices.find(i => i.id === id);
    return inv && inv.status !== 'analyzed';
  }).length;

  return (
    <>
      <ConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="¿Borrar facturas seleccionadas?"
        message={`¿Estás seguro de que quieres borrar ${selectedIds.length} facturas? Esta acción no se puede deshacer.`}
        isDestructive={true}
      />
      <div className="space-y-4">
      {/* Duplicate Warning Banner */}
      {duplicateIds.size > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full text-orange-600 dark:text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Posibles facturas duplicadas
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                Hemos detectado {duplicateIds.size} facturas con el mismo proveedor, fecha y monto.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Selection Toggle */}
      <div className="flex flex-col gap-4">
        <InvoiceFilters invoices={invoices} onFilterChange={setFilters} />
        
        <div className="flex justify-end gap-2">
          <a
            href={`/api/export?search=${encodeURIComponent(filters.search)}&status=${encodeURIComponent(filters.status)}&supplier=${encodeURIComponent(filters.supplier)}&dateFrom=${encodeURIComponent(filters.dateFrom)}&dateTo=${encodeURIComponent(filters.dateTo)}&minAmount=${encodeURIComponent(filters.minAmount)}&maxAmount=${encodeURIComponent(filters.maxAmount)}`}
            download="exportacion_facturas.xlsx"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar a Excel
          </a>

          <button
            onClick={() => {
              if (isSelectionMode) setSelectedIds([]);
              setIsSelectionMode(!isSelectionMode);
            }}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors border
              ${isSelectionMode 
                ? 'bg-muted text-foreground border-border hover:bg-muted/80' 
                : 'bg-background text-primary border-transparent hover:bg-muted/50 hover:border-border'
              }
            `}
          >
            {isSelectionMode ? 'Cancelar Selección' : 'Seleccionar Varios'}
          </button>
        </div>
      </div>

      {/* Bulk Actions Header */}
      {isSelectionMode && filteredInvoices.length > 0 && (
        <div className="flex flex-col gap-3 bg-muted/50 p-3 rounded-lg border border-border animate-in slide-in-from-top-2">
          
          {bulkMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
              bulkMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }`}>
              {bulkMessage.type === 'success' ? '✅' : '❌'} {bulkMessage.text}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox"
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                checked={selectedIds.length > 0 && selectedIds.length === filteredInvoices.length}
                onChange={toggleSelectAll}
                disabled={isProcessing}
              />
              <span className="text-sm text-foreground font-medium flex items-center gap-2">
                {selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''}
                {isProcessing && bulkProgress && (
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">
                    Procesando {bulkProgress.current} de {bulkProgress.total}...
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDeleteClick}
                disabled={selectedIds.length === 0 || isProcessing}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all
                  ${selectedIds.length > 0 && !isProcessing
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                Borrar
              </button>
              
              <button
                onClick={handleBulkAnalyze}
                disabled={analyzableCount === 0 || isProcessing}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2
                  ${analyzableCount > 0 && !isProcessing
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  `Analizar (${analyzableCount})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-border overflow-hidden divide-y divide-border">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {invoices.length === 0 
              ? 'No hay facturas subidas todavía.' 
              : 'No se encontraron facturas con los filtros actuales.'}
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const isAnalyzed = invoice.status === 'analyzed';
            const isSelected = selectedIds.includes(invoice.id);

            return (
              <div 
                key={invoice.id} 
                className={`
                  flex group transition-colors duration-200
                  ${isAnalyzed 
                    ? 'bg-muted/30 hover:bg-muted/50' 
                    : 'bg-card'
                  }
                `}
              >
                 {/* Selection Checkbox Wrapper - ALWAYS VISIBLE NOW */}
                 {/* Selection Checkbox Wrapper */}
                 {isSelectionMode && (
                   <div className="flex items-center pl-4 py-4 transition-colors border-b border-border last:border-0 animate-in fade-in zoom-in duration-200">
                     <input 
                       type="checkbox"
                       className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                       checked={isSelected}
                       onChange={() => toggleSelection(invoice.id)}
                     />
                   </div>
                 )}
                 
                 {/* InvoiceRow Content */}
                 <div className={`flex-1 min-w-0 ${isAnalyzed ? 'opacity-75 grayscale-[0.3] hover:grayscale-0 transition-all' : ''}`}>
                    <InvoiceRow invoice={invoice} isDuplicate={duplicateIds.has(invoice.id)} />
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}
