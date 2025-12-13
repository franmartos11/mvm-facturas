'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PdfUpload } from "@/components/PdfUpload";
import { PdfProcessing } from "@/components/PdfProcessing";

export default function DashboardClient() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'processing'>('upload');
  const [files, setFiles] = useState<File[]>([]);

  const handleNext = () => {
    if (files.length > 0) {
      setStep('processing');
    }
  };

  const handleProcessingComplete = () => {
    setFiles([]);
    setStep('upload');
    router.refresh(); // Refresh server components (InvoiceList)
  };

  return (
    <div className="w-full bg-card rounded-2xl shadow-sm border border-border p-8 hover:shadow-md transition-shadow duration-300">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {step === 'upload' ? 'Subir Facturas' : 'Procesando Archivos'}
        </h1>
        <p className="text-muted-foreground">
          {step === 'upload' 
            ? 'Sube tus facturas en formato PDF para procesarlas automáticamente.'
            : 'Estamos guardando tus facturas en la base de datos.'
          }
        </p>
      </div>
      
      {step === 'upload' ? (
        <div className="w-full space-y-8">
          <PdfUpload onFilesSelect={setFiles} />
          
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={files.length === 0}
              className={`
                px-8 py-3 rounded-lg font-medium text-white transition-all
                ${files.length > 0 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                  : 'bg-muted cursor-not-allowed'
                }
              `}
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : (
        <PdfProcessing files={files} onComplete={handleProcessingComplete} />
      )}
    </div>
  );
}
