'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, Loader2, Edit, Trash2, Plus } from 'lucide-react';
import TangoSyncModal from './TangoSyncModal';
import TangoMappingModal from './TangoMappingModal';

interface TangoIntegrationManagerProps {
  pendingInvoices: any[];
  initialMappings: any[];
}

export default function TangoIntegrationManager({ pendingInvoices, initialMappings }: TangoIntegrationManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'mappings'>('pending');
  
  // Facturas State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showTangoModal, setShowTangoModal] = useState(false);
  const [syncInvoiceIds, setSyncInvoiceIds] = useState<number[]>([]);

  // Mappings State
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingToEdit, setMappingToEdit] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingInvoices.map(inv => inv.id));
    }
  };

  const openSyncModal = (ids: number[]) => {
    setSyncInvoiceIds(ids);
    setShowTangoModal(true);
  };

  const openNewMapping = () => {
    setMappingToEdit(null);
    setShowMappingModal(true);
  };

  const openEditMapping = (mapping: any) => {
    setMappingToEdit(mapping);
    setShowMappingModal(true);
  };

  const deleteMapping = async (mapping_type: string, source_name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la vinculación de "${source_name}"?`)) return;
    
    setIsDeleting(`${mapping_type}-${source_name}`);
    try {
      const res = await fetch(`/api/integration/tango/mappings?mapping_type=${mapping_type}&source_name=${encodeURIComponent(source_name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting mapping', error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
      
      {/* Tabs Header */}
      <div className="flex border-b border-border bg-muted/10 relative">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'pending' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Send className="w-4 h-4" />
          Pendientes de Sincronización
          <span className="bg-primary/10 text-primary py-0.5 px-2 rounded-full text-xs font-bold">
            {pendingInvoices.length}
          </span>
          {activeTab === 'pending' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('mappings')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all relative ${
            activeTab === 'mappings' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          Gestión de Mapeos
          <span className="bg-primary/10 text-primary py-0.5 px-2 rounded-full text-xs font-bold">
            {initialMappings.length}
          </span>
          {activeTab === 'mappings' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      <div className="p-6 bg-card min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* TAB: PENDIENTES */}
          {activeTab === 'pending' && (
            <motion.div 
              key="pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Facturas listas y analizadas que esperan ser exportadas.
                </p>
                
                <button
                  onClick={() => openSyncModal(selectedIds)}
                  disabled={selectedIds.length === 0}
                  className={`
                    px-4 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm flex items-center gap-2
                    ${selectedIds.length > 0
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md'
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                    }
                  `}
                >
                  <Send className="w-4 h-4" />
                  Sincronizar Seleccionadas ({selectedIds.length})
                </button>
              </div>

              {pendingInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">¡Todo al día!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    No tienes facturas pendientes de enviar a Tango. Sube y analiza nuevas facturas para continuar.
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3.5 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-input text-primary focus:ring-primary transition-colors cursor-pointer"
                            checked={selectedIds.length > 0 && selectedIds.length === pendingInvoices.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3.5 font-medium">Fecha</th>
                        <th className="px-4 py-3.5 font-medium">Proveedor / Cliente</th>
                        <th className="px-4 py-3.5 font-medium text-right">Total</th>
                        <th className="px-4 py-3.5 font-medium text-right w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pendingInvoices.map((inv) => {
                        const isSelected = selectedIds.includes(inv.id);
                        return (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={inv.id} 
                            onClick={() => toggleSelection(inv.id)}
                            className={`transition-colors group cursor-pointer ${isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'}`}
                          >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                              checked={selectedIds.includes(inv.id)}
                              onChange={() => toggleSelection(inv.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('es-ES') : 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">{inv.supplier}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            ${Number(inv.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openSyncModal([inv.id])}
                              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20"
                            >
                              Sincronizar
                            </button>
                          </td>
                        </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: MAPPINGS */}
          {activeTab === 'mappings' && (
            <motion.div 
              key="mappings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  Gestiona las equivalencias contables registradas.
                </p>
                <button
                  onClick={openNewMapping}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl bg-background border border-border shadow-sm hover:bg-muted transition-colors flex items-center gap-2 text-foreground"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Mapeo
                </button>
              </div>

              {initialMappings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-4">
                    <LinkIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Sin mapeos registrados</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    Los mapeos aparecerán aquí a medida que envíes facturas a Tango, o puedes crear uno manualmente.
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3.5 font-medium">Tipo</th>
                        <th className="px-4 py-3.5 font-medium">Nombre Local</th>
                        <th className="px-4 py-3.5 font-medium">Código en Tango</th>
                        <th className="px-4 py-3.5 font-medium text-right w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {initialMappings.map((map, i) => {
                        const rowKey = `${map.mapping_type}-${map.source_name}`;
                        return (
                          <motion.tr 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={i} 
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            <td className="px-4 py-3 w-32">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                map.mapping_type === 'customer' 
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              }`}>
                                {map.mapping_type === 'customer' ? 'Cliente' : 'Artículo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">{map.source_name}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded-md text-sm border border-primary/20">
                                {map.tango_code}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditMapping(map)}
                                  className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteMapping(map.mapping_type, map.source_name)}
                                  disabled={isDeleting === rowKey}
                                  className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                  title="Eliminar"
                                >
                                  {isDeleting === rowKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Modals */}
      <TangoSyncModal 
        isOpen={showTangoModal}
        onClose={() => setShowTangoModal(false)}
        invoiceIds={syncInvoiceIds}
        onSuccess={() => {
          setSelectedIds([]);
          router.refresh();
        }}
      />
      
      <TangoMappingModal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        mappingToEdit={mappingToEdit}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
