'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PdfUpload } from "@/components/PdfUpload";
import { PdfProcessing } from "@/components/PdfProcessing";

export default function DashboardClient() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'processing'>('upload');
  const [filesToProcess, setFilesToProcess] = useState<File[]>([]);

  const handleStartProcessing = (files: File[]) => {
    setFilesToProcess(files);
    setStep('processing');
  };

  const handleProcessingComplete = () => {
    setFilesToProcess([]);
    setStep('upload');
    router.refresh();
  };

  return (
    <div className="w-full bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 hover:shadow-md transition-shadow duration-300">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {step === 'upload' ? 'Subir Facturas' : 'Procesando Archivos'}
        </h1>
        <p className="text-muted-foreground">
          {step === 'upload' 
            ? 'Sube tus facturas en formato PDF o imagen para analizarlas automáticamente.'
            : 'Extrayendo datos de las facturas usando IA local.'
          }
        </p>
      </div>
      
      {step === 'upload' ? (
        <div className="w-full">
          <PdfUpload onProcess={handleStartProcessing} />
        </div>
      ) : (
        <PdfProcessing files={filesToProcess} onComplete={handleProcessingComplete} />
      )}
    </div>
  );
}
