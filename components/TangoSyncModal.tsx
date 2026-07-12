'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TangoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceIds: number[];
  onSuccess: () => void;
}

type MissingMapping = { type: string, name: string, invoiceId: number };
type MappingInput = { mapping_type: string, source_name: string, tango_code: string };

export default function TangoSyncModal({ isOpen, onClose, invoiceIds, onSuccess }: TangoSyncModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [missingMappings, setMissingMappings] = useState<MissingMapping[]>([]);
  const [mappingInputs, setMappingInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && invoiceIds.length > 0) {
      // Reiniciar estado
      setMissingMappings([]);
      setMappingInputs({});
      setError('');
      setSuccess('');
      attemptSync();
    }
  }, [isOpen, invoiceIds]);

  const attemptSync = async (newMappings?: MappingInput[]) => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/integration/tango', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds, newMappings })
      });

      const data = await res.json();

      if (res.status === 428) {
        // Faltan mapeos
        setMissingMappings(data.missingMappings);
      } else if (res.ok) {
        // Éxito
        setSuccess('¡Sincronización completada con éxito!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Ocurrió un error desconocido');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingChange = (name: string, value: string) => {
    setMappingInputs(prev => ({ ...prev, [name]: value }));
  };

  const submitMappings = () => {
    // Validar que todos tengan valor
    for (const m of missingMappings) {
      if (!mappingInputs[m.name]?.trim()) {
        setError('Por favor completa todos los campos requeridos.');
        return;
      }
    }

    const mappingsToSave: MappingInput[] = missingMappings.map(m => ({
      mapping_type: m.type,
      source_name: m.name,
      tango_code: mappingInputs[m.name].trim()
    }));

    setMissingMappings([]);
    attemptSync(mappingsToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Sincronización con Tango</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enviando {invoiceIds.length} factura(s) a Axoft.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
          {isProcessing && missingMappings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-muted-foreground">Procesando información con Tango...</p>
            </div>
          )}

          {error && (
            <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 mb-4 text-sm text-green-800 bg-green-100 rounded-lg dark:bg-green-900/30 dark:text-green-400">
              {success}
            </div>
          )}

          {!isProcessing && missingMappings.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-1">
                  Mapeo Requerido
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  Hemos encontrado clientes o artículos que no están vinculados a códigos de Tango. Por favor, ingresa los códigos correspondientes (solo se pedirá una vez).
                </p>
              </div>

              <div className="space-y-4 mt-4">
                {missingMappings.map((m, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">
                      {m.type === 'customer' ? 'Cliente / Proveedor: ' : 'Artículo: '}
                      <span className="font-bold text-primary">{m.name}</span>
                    </label>
                    <input
                      type="text"
                      className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder={m.type === 'customer' ? 'CUIT o DNI en Tango' : 'SKU / Código en Tango'}
                      value={mappingInputs[m.name] || ''}
                      onChange={(e) => handleMappingChange(m.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/20">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-accent disabled:opacity-50"
          >
            Cancelar
          </button>
          
          {missingMappings.length > 0 && !isProcessing && (
            <button
              onClick={submitMappings}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 shadow-sm"
            >
              Guardar y Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
