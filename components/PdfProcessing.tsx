'use client';

import { useEffect, useState, useRef } from 'react';
import { uploadPdf, analyzeInvoice } from '@/app/actions';

interface PdfProcessingProps {
  files: File[];
  onComplete?: () => void;
}

type SubStatus = 'pending' | 'active' | 'done' | 'error';

interface FileStatus {
  name: string;
  upload: SubStatus;
  analyze: SubStatus;
  errorMsg?: string;
  isImageInvalid?: boolean; // If AI returned is_invoice: false
}

export function PdfProcessing({ files, onComplete }: PdfProcessingProps) {
  const [statuses, setStatuses] = useState<FileStatus[]>(
    files.map(f => ({ name: f.name, upload: 'pending', analyze: 'pending' }))
  );
  const [isFinished, setIsFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const processingRef = useRef(false);

  const CONCURRENCY_LIMIT = 3;

  const setFileStatus = (idx: number, patch: Partial<FileStatus>) =>
    setStatuses(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    let activeCount = 0;
    let completedCount = 0;
    let queueIndex = 0;
    let startTime = Date.now();

    const processNext = async () => {
      // End condition
      if (completedCount === files.length) {
        setIsFinished(true);
        // Show summary for 5 seconds then complete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 5000);
        return;
      }

      // Fill up to concurrency limit
      while (activeCount < CONCURRENCY_LIMIT && queueIndex < files.length) {
        const currentIndex = queueIndex;
        queueIndex++;
        activeCount++;

        processFile(currentIndex).finally(() => {
          activeCount--;
          completedCount++;
          
          // Estimate time remaining
          const elapsed = Date.now() - startTime;
          const avgTimePerFile = elapsed / completedCount;
          const remainingFiles = files.length - completedCount;
          setTimeRemaining(Math.round((avgTimePerFile * remainingFiles) / 1000));

          processNext(); // Trigger next after one completes
        });
      }
    };

    const processFile = async (idx: number) => {
      const file = files[idx];

      // ── Paso 1: Subir ──────────────────────────────────────────
      setFileStatus(idx, { upload: 'active' });
      let invoiceId: number;
      let filePath: string;

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadPdf(formData);
        invoiceId = res.invoiceId;
        filePath = res.filePath;
        setFileStatus(idx, { upload: 'done', analyze: 'active' });
      } catch (err: any) {
        setFileStatus(idx, { upload: 'error', analyze: 'error', errorMsg: err.message ?? 'Error al subir' });
        return;
      }

      // ── Paso 2: Analizar con IA ────────────────────────────────
      try {
        const res = await analyzeInvoice(invoiceId, filePath);
        if (res && !res.success) {
          setFileStatus(idx, { analyze: 'error', errorMsg: res.error });
        } else {
          // Si res no existe o asume éxito
          setFileStatus(idx, { analyze: 'done' });
          // Check for "No es factura" (invalid) usually handled by status update in DB, but we don't have it in the return of analyzeInvoice directly unless we change it. We'll rely on the DB status later.
        }
      } catch (err: any) {
        // Here we can catch the 'is_invoice: false' error if actions.ts throws it.
        const msg = err.message ?? 'Error al analizar';
        if (msg.includes('No parece ser una factura')) {
          setFileStatus(idx, { analyze: 'error', errorMsg: 'El archivo no es una factura válida', isImageInvalid: true });
        } else {
          setFileStatus(idx, { analyze: 'error', errorMsg: msg });
        }
      }
    };

    processNext();
  }, [files, onComplete]);

  const completed = statuses.filter(s => s.analyze === 'done').length;
  const errors = statuses.filter(s => s.analyze === 'error').length;
  const progressPct = Math.round(((completed + errors) / files.length) * 100);

  if (isFinished) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-6 text-center py-8 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50 dark:border-emerald-900/10">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">¡Procesamiento Completado!</h2>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-sm mx-auto text-left space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-muted-foreground font-medium">Total procesadas</span>
            <span className="font-bold text-lg">{files.length}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Exitosas
            </span>
            <span className="font-semibold">{completed}</span>
          </div>
          
          {errors > 0 && (
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Con errores o inválidas
              </span>
              <span className="font-semibold text-red-500">{errors}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-6 animate-pulse">
          Redirigiendo a tus facturas...
        </p>
        
        <button 
          onClick={() => { if (onComplete) onComplete(); }}
          className="mt-4 px-6 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
        >
          Ir ahora
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Global Progress Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold text-foreground">Procesando {files.length} facturas</h2>
            <p className="text-sm text-muted-foreground mt-1">Usando Inteligencia Artificial local</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{progressPct}%</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full relative overflow-hidden"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium pt-1">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              {completed} listas
            </span>
            {errors > 0 && (
              <span className="flex items-center gap-1.5 text-red-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {errors} fallas
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeRemaining !== null && timeRemaining > 0 
              ? `~${timeRemaining} seg. restantes` 
              : 'Calculando...'}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {statuses.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
          >
            {/* Nombre del archivo */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="font-medium text-foreground truncate text-sm" title={item.name}>{item.name}</p>
              </div>
              
              <div className="shrink-0 ml-3">
                {item.analyze === 'done' && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full uppercase tracking-wider">
                    Terminado
                  </span>
                )}
                {item.analyze === 'error' && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full uppercase tracking-wider">
                    Error
                  </span>
                )}
                {item.analyze === 'active' && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full uppercase tracking-wider animate-pulse">
                    Analizando
                  </span>
                )}
                {item.analyze === 'pending' && item.upload === 'active' && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 rounded-full uppercase tracking-wider">
                    Subiendo
                  </span>
                )}
                {item.analyze === 'pending' && item.upload === 'pending' && (
                  <span className="text-[10px] font-bold px-2 py-1 text-muted-foreground uppercase tracking-wider">
                    En cola
                  </span>
                )}
              </div>
            </div>

            {/* Sub-etapas (solo mostrar si hubo error o si no ha terminado) */}
            {item.analyze !== 'done' && (
              <div className="px-4 py-3 space-y-2 border-t border-border bg-background text-sm">
                <SubStep label="Guardar archivo original" status={item.upload} />
                <SubStep
                  label="Extracción de datos con IA"
                  status={item.analyze}
                  errorMsg={item.analyze === 'error' ? item.errorMsg : undefined}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SubStep({ label, status, errorMsg }: { label: string; status: SubStatus; errorMsg?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">
        {status === 'pending' && (
          <div className="w-4 h-4 rounded-full border-2 border-muted" />
        )}
        {status === 'active' && (
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
        {status === 'done' && (
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'error' && (
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className={`text-xs ${
          status === 'pending'
            ? 'text-muted-foreground'
            : status === 'error'
            ? 'text-red-500 font-medium'
            : status === 'done'
            ? 'text-foreground'
            : 'text-primary font-medium'
        }`}>
          {label}
        </span>
        {status === 'error' && errorMsg && (
          <p className="text-[10px] text-red-500/80 mt-0.5 leading-snug break-words">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
