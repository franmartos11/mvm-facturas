'use client';

interface PdfPreviewModalProps {
  url: string;
  filename: string;
  onClose: () => void;
}

export default function PdfPreviewModal({ url, filename, onClose }: PdfPreviewModalProps) {
  const isImage = url.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col relative animate-in zoom-in-95 overflow-hidden border border-border">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-foreground truncate pr-4">
            {filename}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4">
          {isImage ? (
             <img src={url} alt={filename} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
          ) : (
            <iframe 
              src={`${url}#toolbar=0`} 
              className="w-full h-full rounded-lg shadow-sm border-0 bg-white"
              title={filename}
            />
          )}
        </div>
      </div>
    </div>
  );
}
