'use client';

import { useState } from 'react';

type SavingsState = 'idle' | 'loading' | 'done' | 'error';

export default function AISavingsSuggestions() {
  const [state, setState] = useState<SavingsState>('idle');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAnalyze = async () => {
    if (state === 'loading') return;
    setState('loading');
    setError('');

    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'savings' }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error desconocido');
      }

      setResult(data.result);
      setState('done');
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  };

  const handleReset = () => {
    setState('idle');
    setResult('');
    setError('');
  };

  // Parse suggestions as individual blocks (split by numbered lines or double newlines)
  const parseSuggestions = (text: string): string[] => {
    // Try to split by numbered points like "1.", "2.", etc.
    const numbered = text.split(/\n(?=\d+[\.\)])/g).map(s => s.trim()).filter(Boolean);
    if (numbered.length >= 2) return numbered;
    // Fallback: split by double newlines
    return text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Sugerencias de Ahorro con IA
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full border border-violet-500/20">
                  ✦ IA Local
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Análisis personalizado de tus facturas de compra y venta para identificar oportunidades de ahorro
              </p>
            </div>
          </div>

          {state === 'done' && (
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerar
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">Análisis de Optimización de Gastos</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Tu IA local analiza tus facturas de compra y venta para generar sugerencias concretas de ahorro personalizadas.
              </p>
            </div>
            <button
              id="analyze-savings-btn"
              onClick={handleAnalyze}
              className="mt-2 flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analizar mis gastos con IA
            </button>
          </div>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-violet-500/5 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Analizando tus datos financieros...</p>
              <p className="text-sm text-muted-foreground mt-1">
                La IA está revisando tus facturas de compra y venta para generar recomendaciones personalizadas.
              </p>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Error al conectar con la IA</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {state === 'done' && result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {parseSuggestions(result).map((suggestion, i) => (
              <div
                key={i}
                className="flex gap-3 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {suggestion.replace(/^\d+[\.\)]\s*/, '')}
                </p>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground text-center pt-2">
              Sugerencias generadas por tu IA local basadas en datos reales de tus facturas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
