'use client';

import { useState } from 'react';
import { updateUserSettings } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ initialSettings }: { initialSettings: any }) {
  const router = useRouter();
  
  const [aiUrl, setAiUrl] = useState(initialSettings?.ai_url || 'http://127.0.0.1:1234/v1');
  const [aiModel, setAiModel] = useState(initialSettings?.ai_model || 'google/gemma-4-e4b');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    
    try {
      await updateUserSettings(aiUrl, aiModel);
      setMessage({ type: 'success', text: 'Ajustes guardados correctamente.' });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar los ajustes.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-card-foreground">Inteligencia Artificial</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Configura los parámetros para conectar con tu instancia local de LM Studio u otro proveedor compatible con OpenAI.
      </p>

      {message && (
        <div className={`p-4 rounded-md mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="aiUrl" className="block text-sm font-medium text-foreground mb-1">
            URL Base de la API (Local)
          </label>
          <input
            type="text"
            id="aiUrl"
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="http://127.0.0.1:1234/v1"
            required
          />
        </div>

        <div>
          <label htmlFor="aiModel" className="block text-sm font-medium text-foreground mb-1">
            Nombre del Modelo
          </label>
          <input
            type="text"
            id="aiModel"
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="google/gemma-4-e4b"
            required
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
