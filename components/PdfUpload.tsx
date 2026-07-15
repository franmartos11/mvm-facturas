'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface PdfUploadProps {
  onProcess: (files: File[]) => void;
}

interface FileWithPreview {
  file: File;
  previewUrl: string | null;
}

interface BannerMessage {
  type: 'error' | 'warning' | 'success';
  text: string;
}

export function PdfUpload({ onProcess }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [banners, setBanners] = useState<BannerMessage[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addBanner = (type: 'error' | 'warning' | 'success', text: string) => {
    setBanners(prev => {
      // Avoid duplicate exact messages
      if (prev.some(b => b.text === text)) return prev;
      return [...prev, { type, text }];
    });
    // Auto remove success banners after 3s
    if (type === 'success') {
      setTimeout(() => {
        setBanners(prev => prev.filter(b => b.text !== text));
      }, 3000);
    }
  };

  const removeBanner = (index: number) => {
    setBanners(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const createPreview = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      selectedFiles.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [selectedFiles]);

  const validateAndAddFiles = (files: FileList | File[]) => {
    const validFiles: FileWithPreview[] = [];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    let addedCount = 0;

    Array.from(files).forEach(file => {
      const isPdfOrImage = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isWithinSizeLimit = file.size <= MAX_SIZE;
      
      // Check if file is already in list (by name and size to be safe)
      const isDuplicate = selectedFiles.some(f => f.file.name === file.name && f.file.size === file.size);

      if (isDuplicate) {
        addBanner('warning', `El archivo ${file.name} ya está en la lista.`);
      } else if (!isPdfOrImage) {
        addBanner('error', `El archivo ${file.name} no es un PDF ni una imagen.`);
      } else if (!isWithinSizeLimit) {
        addBanner('error', `El archivo ${file.name} supera el límite de 10 MB.`);
      } else {
        validFiles.push({ file, previewUrl: createPreview(file) });
        addedCount++;
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      if (addedCount === 1) {
        addBanner('success', `Archivo agregado correctamente.`);
      } else if (addedCount > 1) {
        addBanner('success', `${addedCount} archivos agregados correctamente.`);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndAddFiles(files);
    }
  }, [selectedFiles]); // dependency needed for duplicate check

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndAddFiles(files);
    }
    // Reset input
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const fileToRemove = selectedFiles[indexToRemove];
    if (fileToRemove.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
    
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectedFiles.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setSelectedFiles([]);
    setBanners([]);
  };

  const handleProcessClick = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsPinging(true);
    setBanners([]); // Clear previous errors
    
    try {
      const res = await fetch('/api/ai-ping');
      const data = await res.json();
      
      if (!res.ok || data.status !== 'ok') {
        addBanner('error', data.error || 'No se pudo conectar con la IA local.');
        
        // Add a warning that they can still proceed but it will fail analysis
        addBanner('warning', 'Asegurate de que LM Studio o el modelo configurado esté en ejecución. Podés procesar igual, pero las facturas quedarán en estado Pendiente.');
        setIsPinging(false);
        return;
      }
      
      // All good, pass raw files to parent
      const rawFiles = selectedFiles.map(f => f.file);
      onProcess(rawFiles);
      
    } catch (error) {
      addBanner('error', 'Error de red al intentar verificar el estado de la IA.');
      setIsPinging(false);
    }
  };

  const handleForceProcess = () => {
    const rawFiles = selectedFiles.map(f => f.file);
    onProcess(rawFiles);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Banners Area */}
      {banners.length > 0 && (
        <div className="mb-4 space-y-2">
          {banners.map((banner, idx) => (
            <div 
              key={idx} 
              className={`flex items-start justify-between p-3 rounded-lg border animate-in slide-in-from-top-2 text-sm ${
                banner.type === 'error' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400' :
                banner.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400' :
                'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400'
              }`}
            >
              <div className="flex gap-2">
                <span className="mt-0.5 shrink-0">
                  {banner.type === 'error' && '❌'}
                  {banner.type === 'warning' && '⚠️'}
                  {banner.type === 'success' && '✅'}
                </span>
                <span>{banner.text}</span>
              </div>
              <button onClick={() => removeBanner(idx)} className="opacity-50 hover:opacity-100 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-300 ease-in-out min-h-[200px] flex flex-col justify-center
          ${isDragging 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.02] shadow-lg' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${selectedFiles.length > 0 ? 'bg-muted/10' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          multiple
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all duration-300
            ${isDragging ? 'bg-blue-100 dark:bg-blue-900/30 scale-110' : 'bg-muted'}
          `}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 transition-colors ${isDragging ? 'text-blue-500' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-medium text-foreground">
              {isDragging ? '¡Suelta los archivos aquí!' : 'Sube tus facturas (PDF o Imágenes)'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Arrastra y suelta aquí, o <span className="text-primary font-medium">explora tus archivos</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
            Max 10MB por archivo · PDF, PNG, JPG, WebP
          </p>
        </div>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-muted-foreground pb-2 border-b border-border">
            <span className="font-medium text-foreground">{selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}</span>
            <button 
              onClick={removeAll}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-xs uppercase tracking-wider transition-colors"
            >
              Borrar todo
            </button>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {selectedFiles.map((fileObj, index) => (
              <div 
                key={`${fileObj.file.name}-${index}`}
                className="flex items-center gap-4 p-3 bg-background border border-border rounded-xl group hover:border-primary/40 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
                  {fileObj.previewUrl ? (
                    <img src={fileObj.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-red-500 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[9px] font-bold mt-0.5">PDF</span>
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm" title={fileObj.file.name}>
                    {fileObj.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                <button
                  onClick={(e) => removeFile(e, index)}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Eliminar archivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 mt-2 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
            {banners.some(b => b.type === 'warning' && b.text.includes('LM Studio')) && (
              <button
                onClick={handleForceProcess}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium text-sm text-foreground bg-muted hover:bg-muted/80 transition-all"
              >
                Procesar sin IA
              </button>
            )}
            
            <button
              onClick={handleProcessClick}
              disabled={isPinging || selectedFiles.length === 0}
              className={`
                w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2
                ${isPinging ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}
              `}
            >
              {isPinging ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando IA...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Procesar {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
