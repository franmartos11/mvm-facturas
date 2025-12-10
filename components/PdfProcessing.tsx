'use client';

import { useEffect, useState, useRef } from 'react';
import { uploadPdf } from '@/app/actions';

interface PdfProcessingProps {
  files: File[];
  onComplete?: () => void;
}

interface FileStatus {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export function PdfProcessing({ files, onComplete }: PdfProcessingProps) {
  const [statuses, setStatuses] = useState<FileStatus[]>(
    files.map(f => ({ name: f.name, status: 'pending' }))
  );
  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const processFiles = async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update status to processing
        setStatuses(prev => prev.map((s, idx) => 
          idx === i ? { ...s, status: 'processing' } : s
        ));

        try {
          const formData = new FormData();
          formData.append('file', file);
          
          await uploadPdf(formData);

          setStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'completed' } : s
          ));
        } catch (error) {
          console.error(error);
          setStatuses(prev => prev.map((s, idx) => 
            idx === i ? { ...s, status: 'error' } : s
          ));
        }
      }
      
      if (onComplete) {
        onComplete();
      }
    };

    processFiles();
  }, [files, onComplete]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-center text-slate-800 dark:text-slate-100">
        Procesando facturas...
      </h2>
      
      <div className="space-y-3">
        {statuses.map((item, index) => (
          <div 
            key={`${item.name}-${index}`}
            className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-sm"
          >
            {/* Status Icon */}
            <div className="shrink-0">
              {item.status === 'pending' && (
                <div className="w-8 h-8 rounded-full border-2 border-slate-200" />
              )}
              {item.status === 'processing' && (
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              )}
              {item.status === 'completed' && (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {item.status === 'error' && (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {item.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.status === 'pending' && 'Esperando...'}
                {item.status === 'processing' && 'Guardando...'}
                {item.status === 'completed' && 'Guardado correctamente'}
                {item.status === 'error' && 'Error al guardar'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
