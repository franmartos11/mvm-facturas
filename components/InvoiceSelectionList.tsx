'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeInvoice, deleteInvoice } from '@/app/actions';
import InvoiceRow from './InvoiceRow';

import ConfirmationModal from './ConfirmationModal';

interface InvoiceSelectionListProps {
  invoices: any[];
}

export default function InvoiceSelectionList({ invoices }: InvoiceSelectionListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(inv => 
    inv.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    // ... rest of logic uses selectedIds so it's fine
    if (idsToAnalyze.length === 0) return;

    setIsProcessing(true);
    let errorCount = 0;

    for (const id of idsToAnalyze) {
      const invoice = invoices.find(inv => inv.id === id);
      if (!invoice) continue;

      try {
        await analyzeInvoice(id, invoice.file_url);
      } catch (error) {
        console.error(`Error analyzing invoice ${id}:`, error);
        errorCount++;
      }
    }

    setIsProcessing(false);
    setSelectedIds([]); 
    router.refresh();

    if (errorCount > 0) {
      alert(`Análisis completado con ${errorCount} errores.`);
    }
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
        await deleteInvoice(id, invoice.file_url);
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
      {/* Search Bar */}
      {/* Search Bar & Selection Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Buscar facturas..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
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
          {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
        </button>
      </div>

      {/* Bulk Actions Header */}
      {isSelectionMode && filteredInvoices.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              checked={selectedIds.length > 0 && selectedIds.length === filteredInvoices.length}
              onChange={toggleSelectAll}
            />
            <span className="text-sm text-foreground font-medium">
              {selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''}
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
                px-4 py-2 text-sm font-medium rounded-md transition-all
                ${analyzableCount > 0 && !isProcessing
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? 'Procesando...' : `Analizar (${analyzableCount})`}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-border overflow-hidden divide-y divide-border">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No se encontraron facturas con ese nombre.' : 'No hay facturas subidas todavía.'}
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
                    <InvoiceRow invoice={invoice} />
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
