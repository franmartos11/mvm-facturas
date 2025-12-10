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
      <div className="relative">
        <input 
          type="text" 
          placeholder="Buscar facturas..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Bulk Actions Header */}
      {filteredInvoices.length > 0 && (
        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              checked={selectedIds.length > 0 && selectedIds.length === filteredInvoices.length}
              onChange={toggleSelectAll}
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
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
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-500'
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
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-500'
                }
              `}
            >
              {isProcessing ? 'Procesando...' : `Analizar (${analyzableCount})`}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-zinc-400">
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
                    ? 'bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50' 
                    : 'bg-white dark:bg-black'
                  }
                `}
              >
                 {/* Selection Checkbox Wrapper - ALWAYS VISIBLE NOW */}
                 <div className="flex items-center pl-4 py-4 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                   <input 
                     type="checkbox"
                     className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     checked={isSelected}
                     onChange={() => toggleSelection(invoice.id)}
                   />
                 </div>
                 
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
