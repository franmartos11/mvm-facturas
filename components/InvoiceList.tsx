import { getInvoices } from '@/app/actions';
import InvoiceSelectionList from './InvoiceSelectionList';

interface InvoiceListProps {
  invoices: any[];
}

export default function InvoiceList({ invoices }: InvoiceListProps) {

  return (
    <div className="w-full mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Facturas Subidas
        </h2>
        <span className="text-sm text-muted-foreground">
          {invoices.length} archivo{invoices.length !== 1 ? 's' : ''}
        </span>
      </div>

      <InvoiceSelectionList invoices={invoices} />
    </div>
  );
}
