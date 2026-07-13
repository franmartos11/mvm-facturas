'use client';

import { useState } from 'react';
import { analyzeInvoice, deleteInvoice, reanalyzeInvoice } from '@/app/actions'; // Need to fetch items too, but for MVP maybe just expand?
// To keep it simple, let's just create a small component to fetch items client side or pass them if we had them.
// Since getInvoices only gets the invoice table, we need to fetch items separately.
// Let's create a Client Component "InvoiceItemsViewer" that fetches items.


import { useRouter } from 'next/navigation';
import InvoiceItemsViewer from './InvoiceItemsViewer';
import ConfirmationModal from './ConfirmationModal';
import PdfPreviewModal from './PdfPreviewModal';
import TagEditor from './TagEditor';

interface InvoiceRowProps {
  invoice: any;
  isDuplicate?: boolean;
}

const getCategoryColor = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'alimentación': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'hogar': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'tecnología': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'transporte': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'salud': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'servicios': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export default function InvoiceRow({ invoice, isDuplicate = false }: InvoiceRowProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeInvoice(invoice.id, invoice.file_path);
      if (res && !res.success) {
        alert('Error al analizar la factura: ' + res.error);
      } else {
        router.push(`/invoices/${invoice.id}`);
      }
    } catch (error) {
      alert('Error inesperado al intentar comunicarse con el servidor.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres volver a analizar esta factura? Se borrarán los ítems actuales.')) return;
    
    setIsAnalyzing(true);
    try {
      const res = await reanalyzeInvoice(invoice.id, invoice.file_path);
      if (res && !res.success) {
        alert('Error al re-analizar la factura: ' + res.error);
      } else {
        router.push(`/invoices/${invoice.id}`);
      }
    } catch (error) {
      alert('Error inesperado al intentar comunicarse con el servidor.');
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
      await deleteInvoice(invoice.id, invoice.file_path);
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
        onClick={() => invoice.status === 'analyzed' && router.push(`/invoices/${invoice.id}`)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate flex items-center gap-2">
              {invoice.filename}
              {isDuplicate && (
                <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Posible duplicado
                </span>
              )}
            </p>
            <TagEditor invoiceId={invoice.id} initialTags={invoice.tags} />
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {invoice.invoice_date 
                  ? new Date(invoice.invoice_date).toLocaleDateString('es-ES')
                  : new Date(invoice.created_at).toLocaleDateString('es-ES')}
                {invoice.supplier && (
                  <span className="ml-2 font-medium text-foreground">
                    • {invoice.supplier}
                  </span>
                )}
                {invoice.total !== null && invoice.total !== undefined && (
                  <span className="ml-2 font-semibold text-primary">
                    • ${Number(invoice.total).toFixed(2)}
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
              {invoice.status === 'invalid' && (
                <span className="text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded-full font-medium border border-zinc-200">
                  No es factura
                </span>
              )}
              {invoice.invoice_type && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                  invoice.invoice_type === 'venta'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                }`}>
                  {invoice.invoice_type === 'venta' ? '↑ Venta' : '↓ Compra'}
                </span>
              )}
              {invoice.anomaly_score !== null && invoice.anomaly_score !== undefined && Number(invoice.anomaly_score) >= 2 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border flex items-center gap-0.5 ${
                  Number(invoice.anomaly_score) >= 4
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    : Number(invoice.anomaly_score) >= 3
                    ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                }`}>
                  ⚠ Anomalía ({Number(invoice.anomaly_score).toFixed(1)}σ)
                </span>
              )}
              {invoice.category && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getCategoryColor(invoice.category)}`}>
                  {invoice.category}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {invoice.status === 'pending' && (
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
             <div className="flex items-center gap-2">
               <button
                 onClick={handleReanalyze}
                 disabled={isAnalyzing}
                 className="p-1.5 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 rounded-md"
                 title="Re-analizar con IA"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               </button>
               <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/invoices/${invoice.id}`);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
               >
                Abrir Expediente
               </button>
             </div>
          )}

          {(invoice.status === 'error' || invoice.status === 'invalid') && (
             <button
               onClick={handleReanalyze}
               disabled={isAnalyzing}
               className="px-3 py-1.5 text-xs font-medium rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
             >
               {isAnalyzing ? '...' : 'Reintentar'}
             </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPreviewModal(true);
            }}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
            title="Abrir Archivo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

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
      
      
      {showPreviewModal && (
        <PdfPreviewModal
          url={`/api/uploads/${invoice.file_path}`}
          filename={invoice.filename}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
    </>
  );
}
