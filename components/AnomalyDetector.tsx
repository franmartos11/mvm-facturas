'use client';

import Link from 'next/link';
import { recalculateAllAnomalies } from '@/app/actions';
import { useState, useTransition } from 'react';

interface Anomaly {
  id: number;
  filename: string;
  supplier: string;
  invoice_date: string | null;
  total: string | number;
  anomaly_score: string | number;
  category: string;
}

interface AnomalyDetectorProps {
  anomalies: Anomaly[];
}

function getSeverityLabel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 4) return { label: 'Crítica', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
  if (score >= 3) return { label: 'Alta', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' };
  return { label: 'Moderada', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' };
}

export default function AnomalyDetector({ anomalies }: AnomalyDetectorProps) {
  const [isPending, startTransition] = useTransition();
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

  const handleRecalculate = () => {
    startTransition(async () => {
      try {
        const res = await recalculateAllAnomalies();
        setRecalcResult(`✓ Se recalcularon ${res.processed} facturas.`);
        setTimeout(() => setRecalcResult(null), 4000);
      } catch (e: any) {
        setRecalcResult('❌ Error: ' + e.message);
      }
    });
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          <div>
            <h3 className="font-semibold text-foreground">Detección de Anomalías</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Facturas de compra con totales inusualmente altos respecto al historial del proveedor (≥2σ)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {recalcResult && (
            <span className="text-xs text-muted-foreground animate-in fade-in duration-300">{recalcResult}</span>
          )}
          <button
            onClick={handleRecalculate}
            disabled={isPending}
            title="Recalcular anomalías en todas las facturas existentes"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isPending ? 'Calculando...' : 'Recalcular'}
          </button>
        </div>
      </div>

      {/* Content */}
      {anomalies.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium text-foreground">Sin anomalías detectadas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Todos los totales de tus facturas de compra están dentro del rango normal.
            Se necesitan al menos 3 facturas del mismo proveedor para activar la detección.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {anomalies.map((anomaly) => {
            const score = Number(anomaly.anomaly_score);
            const severity = getSeverityLabel(score);
            const deviationPct = Math.round((score - 1) * 100);

            return (
              <Link
                key={anomaly.id}
                href={`/invoices/${anomaly.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
              >
                {/* Severity indicator */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${severity.bg} border ${severity.border}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${severity.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                {/* Invoice info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground text-sm truncate">
                      {anomaly.supplier || anomaly.filename}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${severity.bg} ${severity.color} border ${severity.border} whitespace-nowrap`}>
                      ⚠ {severity.label}
                    </span>
                    {anomaly.category && (
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
                        {anomaly.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {anomaly.filename}
                    {anomaly.invoice_date && ` · ${new Date(anomaly.invoice_date).toLocaleDateString('es-ES')}`}
                  </p>
                </div>

                {/* Score + total */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">
                    ${Number(anomaly.total).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className={`text-xs font-medium ${severity.color}`}>
                    +{deviationPct}% sobre media
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {score.toFixed(1)}σ
                  </p>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <p className="text-[11px] text-muted-foreground">
          <strong>Metodología:</strong> Se calcula la media (μ) y desviación estándar (σ) de los totales históricos de cada proveedor en facturas de compra. Si el total supera μ + 2σ, se considera anómalo. Solo aplica a facturas de <strong>compra</strong>.
        </p>
      </div>
    </div>
  );
}
