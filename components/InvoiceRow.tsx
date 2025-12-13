'use client';

import { useState } from 'react';
import { analyzeInvoice, deleteInvoice } from '@/app/actions'; // Need to fetch items too, but for MVP maybe just expand?
// To keep it simple, let's just create a small component to fetch items client side or pass them if we had them.
// Since getInvoices only gets the invoice table, we need to fetch items separately.
// Let's create a Client Component "InvoiceItemsViewer" that fetches items.


import { useRouter } from 'next/navigation';
import InvoiceItemsViewer from './InvoiceItemsViewer';

import ConfirmationModal from './ConfirmationModal';

interface InvoiceRowProps {
  invoice: any;
}

export default function InvoiceRow({ invoice }: InvoiceRowProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeInvoice(invoice.id, invoice.file_url);
      router.refresh();
      setIsExpanded(true); // Auto expand on success
    } catch (error) {
      alert('Error al analizar la factura');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    // Replaced standard confirm with Modal state
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsAnalyzing(true); // Reuse loading state
    try {
      await deleteInvoice(invoice.id, invoice.file_url);
      router.refresh();
    } catch (error) {
      alert('Error al borrar la factura');
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <ConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="¿Borrar factura?"
        message={`Esta acción no se puede deshacer. Se eliminará la factura "${invoice.filename}" y todos sus datos.`}
        isDestructive={true}
      />
      <div className="flex flex-col border-b border-border last:border-0">
      <div 
        className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => invoice.status === 'analyzed' && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {invoice.filename}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {new Date(invoice.created_at).toLocaleDateString('es-ES')}
                {invoice.supplier && (
                  <span className="ml-2 font-medium text-foreground">
                    • {invoice.supplier}
                  </span>
                )}
              </p>
              {invoice.status === 'analyzed' && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  Analizado
                </span>
              )}
              {invoice.status === 'error' && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                  Error
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {invoice.status !== 'analyzed' && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                ${isAnalyzing 
                  ? 'bg-muted text-muted-foreground cursor-wait' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                }
              `}
            >
              {isAnalyzing ? '...' : 'Analizar'}
            </button>
          )}
          
          {invoice.status === 'analyzed' && (
             <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {isExpanded ? 'Ocultar' : 'Ver Detalles'}
            </button>
          )}

          <a 
            href={invoice.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
            title="Abrir PDF"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <button
            onClick={handleDelete}
            disabled={isAnalyzing}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            title="Borrar Factura"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {isExpanded && invoice.status === 'analyzed' && (
        <InvoiceItemsViewer invoiceId={invoice.id} />
      )}
    </div>
    </>
  );
}
