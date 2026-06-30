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
}

export function PdfProcessing({ files, onComplete }: PdfProcessingProps) {
  const [statuses, setStatuses] = useState<FileStatus[]>(
    files.map(f => ({ name: f.name, upload: 'pending', analyze: 'pending' }))
  );
  const processingRef = useRef(false);

  const setFileStatus = (idx: number, patch: Partial<FileStatus>) =>
    setStatuses(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const processFiles = async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // ── Paso 1: Subir ──────────────────────────────────────────
        setFileStatus(i, { upload: 'active' });
        let invoiceId: number;
        let filePath: string;

        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await uploadPdf(formData);
          invoiceId = res.invoiceId;
          filePath = res.filePath;
          setFileStatus(i, { upload: 'done', analyze: 'active' });
        } catch (err: any) {
          setFileStatus(i, { upload: 'error', errorMsg: err.message ?? 'Error al subir' });
          continue;
        }

        // ── Paso 2: Analizar con IA ────────────────────────────────
        try {
          const res = await analyzeInvoice(invoiceId, filePath);
          if (res && !res.success) {
            setFileStatus(i, { analyze: 'error', errorMsg: res.error });
          } else {
            setFileStatus(i, { analyze: 'done' });
          }
        } catch (err: any) {
          setFileStatus(i, { analyze: 'error', errorMsg: err.message ?? 'Error al analizar' });
        }
      }

      if (onComplete) onComplete();
    };

    processFiles();
  }, [files, onComplete]);

  const overallDone = statuses.every(
    s => s.upload !== 'pending' && s.upload !== 'active' && s.analyze !== 'active'
  );

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          {overallDone ? '¡Procesamiento completado!' : 'Procesando facturas...'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {overallDone
            ? 'Todas las facturas han sido guardadas y analizadas.'
            : 'Subiendo y analizando con IA automáticamente.'}
        </p>
      </div>

      <div className="space-y-4">
        {statuses.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-sm overflow-hidden"
          >
            {/* Nombre del archivo */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="w-8 h-8 bg-slate-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">{item.name}</p>
            </div>

            {/* Sub-etapas */}
            <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-zinc-700 pt-3">
              <SubStep label="Guardando archivo" status={item.upload} />
              <SubStep
                label="Analizando con IA"
                status={item.analyze}
                errorMsg={item.analyze === 'error' ? item.errorMsg : undefined}
              />
            </div>
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
          <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-zinc-600" />
        )}
        {status === 'active' && (
          <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        )}
        {status === 'done' && (
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <span className={`text-sm ${
          status === 'pending'
            ? 'text-slate-400'
            : status === 'error'
            ? 'text-red-600'
            : status === 'done'
            ? 'text-slate-700 dark:text-slate-300'
            : 'text-blue-600 dark:text-blue-400 font-medium'
        }`}>
          {label}
        </span>
        {status === 'error' && errorMsg && (
          <p className="text-xs text-red-500 mt-0.5 truncate" title={errorMsg}>{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
