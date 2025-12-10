import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { updateInvoiceItem } from '@/app/actions';

export default function InvoiceItemsViewer({ invoiceId }: { invoiceId: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('id', { ascending: true });
      
      if (data) setItems(data);
      setLoading(false);
    };

    fetchItems();
  }, [invoiceId]);

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditValues({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    });
  };

  const handleSave = async (id: number) => {
    try {
      await updateInvoiceItem(id, {
        description: editValues.description,
        quantity: Number(editValues.quantity),
        unit_price: Number(editValues.unit_price),
        total_price: Number(editValues.quantity) * Number(editValues.unit_price) // Auto-calc total
      });
      
      // Update local state optimistic
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...editValues, total_price: Number(editValues.quantity) * Number(editValues.unit_price) } : item
      ));
      
      setEditingId(null);
      router.refresh();
    } catch (error) {
      alert('Error al guardar cambios');
    }
  };

  if (loading) return <div className="p-4 text-center text-sm text-zinc-500">Cargando detalles...</div>;
  if (items.length === 0) return <div className="p-4 text-center text-sm text-zinc-500">No se encontraron productos.</div>;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 p-4 animate-in slide-in-from-top-2">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-800">
          <tr>
            <th className="px-4 py-2 rounded-l-md">Descripción</th>
            <th className="px-4 py-2 text-right">Cant.</th>
            <th className="px-4 py-2 text-right">Precio Ud.</th>
            <th className="px-4 py-2 text-right">Total</th>
            <th className="px-4 py-2 rounded-r-md"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {items.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/80 group">
                <td className="px-4 py-2 font-medium text-slate-900 dark:text-zinc-100">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs"
                      value={editValues.description}
                      onChange={e => setEditValues({...editValues, description: e.target.value})}
                    />
                  ) : item.description}
                </td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-zinc-300">
                   {isEditing ? (
                    <input 
                      type="number"
                      className="w-16 text-right bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs"
                      value={editValues.quantity}
                      onChange={e => setEditValues({...editValues, quantity: e.target.value})}
                    />
                  ) : item.quantity}
                </td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-zinc-300">
                   {isEditing ? (
                    <input 
                      type="number"
                      step="0.01"
                      className="w-20 text-right bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs"
                      value={editValues.unit_price}
                      onChange={e => setEditValues({...editValues, unit_price: e.target.value})}
                    />
                  ) : `$${Number(item.unit_price).toFixed(2)}`}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-zinc-100">
                  {isEditing 
                    ? `$${(Number(editValues.quantity) * Number(editValues.unit_price)).toFixed(2)}`
                    : `$${Number(item.total_price).toFixed(2)}`
                  }
                </td>
                <td className="px-2 py-2 text-right w-10">
                   {isEditing ? (
                     <div className="flex items-center justify-end gap-1">
                       <button onClick={() => handleSave(item.id)} className="text-green-600 hover:text-green-700 p-1">
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       </button>
                       <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600 p-1">
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                     </div>
                   ) : (
                     <button 
                       onClick={() => handleEdit(item)}
                       className="text-zinc-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                       title="Editar"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                       </svg>
                     </button>
                   )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
