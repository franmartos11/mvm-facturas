'use client';

import { useState } from 'react';
import { updateInvoiceItem } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TagEditor from './TagEditor';

interface InvoiceDetailViewProps {
  invoice: any;
  items: any[];
}

export default function InvoiceDetailView({ invoice, items: initialItems }: InvoiceDetailViewProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const startEdit = (item: any) => {
    setEditingItem(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      await updateInvoiceItem(editingItem!, {
        description: editForm.description,
        quantity: editForm.quantity,
        unit_price: editForm.unit_price,
        total_price: editForm.total_price,
      });
      setItems(items.map(i => (i.id === editingItem ? editForm : i)));
      setEditingItem(null);
      router.refresh();
    } catch (error) {
      alert('Error al guardar el ítem');
    }
  };

  const isPDF = invoice.filename.toLowerCase().endsWith('.pdf');
  const fileUrl = `/api/uploads/${invoice.file_path}`;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Expediente: {invoice.filename}
              {invoice.status === 'analyzed' && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Analizado</span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Subido el {new Date(invoice.created_at).toLocaleDateString('es-ES')} a las {new Date(invoice.created_at).toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <a 
             href={fileUrl} 
             download={invoice.filename}
             className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar Original
           </a>
        </div>
      </header>

      {/* Split Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: PDF Viewer */}
        <div className="w-1/2 border-r border-border bg-muted/20 flex flex-col relative">
          {isPDF ? (
            <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
              <img src={fileUrl} alt={invoice.filename} className="max-w-full max-h-full object-contain rounded-md shadow-sm border border-border" />
            </div>
          )}
        </div>

        {/* Right Panel: Data */}
        <div className="w-1/2 flex flex-col bg-background overflow-y-auto">
          <div className="p-8 space-y-8 max-w-3xl mx-auto w-full">
            {/* Meta Info Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Datos Principales</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Proveedor</p>
                  <p className="font-semibold text-foreground text-lg">{invoice.supplier || 'Desconocido'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fecha de Factura</p>
                  <p className="font-semibold text-foreground text-lg">
                    {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('es-ES') : 'No detectada'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Categoría General</p>
                  <p className="font-semibold text-foreground text-lg flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                     {invoice.category || 'Sin clasificar'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Etiquetas</p>
                  <TagEditor invoiceId={invoice.id} initialTags={invoice.tags} />
                </div>
              </div>
              <hr className="my-6 border-border" />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                  <p className="font-medium">${Number(invoice.subtotal || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Impuestos (IVA)</p>
                  <p className="font-medium">${Number(invoice.tax || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Final</p>
                  <p className="font-bold text-primary text-xl">${Number(invoice.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Desglose de Ítems ({items.length})</h2>
              </div>
              
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Descripción</th>
                      <th className="px-4 py-3 font-medium text-center">Cant.</th>
                      <th className="px-4 py-3 font-medium text-right">P. Unit</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                      <th className="px-4 py-3 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                        {editingItem === item.id ? (
                          <>
                            <td className="px-4 py-2">
                              <input 
                                className="w-full bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                                value={editForm.description}
                                onChange={e => setEditForm({...editForm, description: e.target.value})}
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input 
                                type="number"
                                className="w-16 bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none text-center"
                                value={editForm.quantity}
                                onChange={e => setEditForm({...editForm, quantity: Number(e.target.value)})}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <input 
                                type="number"
                                step="0.01"
                                className="w-20 bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none text-right"
                                value={editForm.unit_price}
                                onChange={e => setEditForm({...editForm, unit_price: Number(e.target.value)})}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <input 
                                type="number"
                                step="0.01"
                                className="w-24 bg-background border border-input rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none text-right"
                                value={editForm.total_price}
                                onChange={e => setEditForm({...editForm, total_price: Number(e.target.value)})}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-foreground">{item.description}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">${Number(item.unit_price).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right font-medium text-foreground">${Number(item.total_price).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => startEdit(item)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No se extrajeron ítems para esta factura.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
