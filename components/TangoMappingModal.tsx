'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';

interface TangoMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappingToEdit?: { mapping_type: string, source_name: string, tango_code: string } | null;
  onSuccess: () => void;
}

export default function TangoMappingModal({ isOpen, onClose, mappingToEdit, onSuccess }: TangoMappingModalProps) {
  const [type, setType] = useState('customer');
  const [sourceName, setSourceName] = useState('');
  const [tangoCode, setTangoCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (mappingToEdit) {
        setType(mappingToEdit.mapping_type);
        setSourceName(mappingToEdit.source_name);
        setTangoCode(mappingToEdit.tango_code);
      } else {
        setType('customer');
        setSourceName('');
        setTangoCode('');
      }
    }
  }, [isOpen, mappingToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim() || !tangoCode.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/integration/tango/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappings: [{ mapping_type: type, source_name: sourceName.trim(), tango_code: tangoCode.trim() }]
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar el mapeo');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border flex flex-col"
        >
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {mappingToEdit ? 'Editar Mapeo' : 'Nuevo Mapeo'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vincula un nombre local con su código en Tango.
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tipo de Entidad</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={!!mappingToEdit}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="customer">Cliente / Proveedor</option>
                <option value="item">Artículo / Producto</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nombre en tu sistema</label>
              <input 
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                disabled={!!mappingToEdit}
                placeholder="Ej: Servicio de Consultoría"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">Debe coincidir exactamente con cómo aparece en tus facturas.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Código en Tango Axoft</label>
              <input 
                type="text"
                value={tangoCode}
                onChange={(e) => setTangoCode(e.target.value)}
                placeholder="Ej: CUIT o SKU"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-sm transition-colors flex items-center"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Guardar Mapeo</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
