'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface PdfUploadProps {
  onFilesSelect?: (files: File[]) => void;
}

export function PdfUpload({ onFilesSelect }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Sync parent state when local files change
  useEffect(() => {
    if (onFilesSelect) {
      onFilesSelect(selectedFiles);
    }
  }, [selectedFiles, onFilesSelect]);

  const validateAndAddFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf') {
        validFiles.push(file);
      } else {
        alert(`El archivo ${file.name} no es un PDF y fue ignorado.`);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndAddFiles(files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndAddFiles(files);
    }
    // Reset input so same files can be selected again if needed
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFiles([]);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ease-in-out
          ${isDragging 
            ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
          ${selectedFiles.length > 0 ? 'bg-slate-50/50' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".pdf"
          multiple
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-slate-600">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors
            ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}
          `}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900">
              {isDragging ? '¡Suelta los PDFs aquí!' : 'Sube tus facturas PDF'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Arrastra y suelta o haz clic para seleccionar múltiples archivos
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Solo archivos PDF
          </p>
        </div>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between text-sm text-slate-500 px-1">
            <span>{selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}</span>
            <button 
              onClick={removeAll}
              className="text-red-500 hover:text-red-600 font-medium text-xs uppercase tracking-wider"
            >
              Borrar todo
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-slate-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => removeFile(e, index)}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar archivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
