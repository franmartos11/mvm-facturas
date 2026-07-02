'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

interface ExportPDFButtonProps {
  invoices: any[];
}

export default function ExportPDFButton({ invoices }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Filter analyzed invoices
      const analyzed = invoices.filter(inv => inv.status === 'analyzed' && inv.total);
      
      // Calculate totals
      const totalAmount = analyzed.reduce((sum, inv) => sum + Number(inv.total), 0);
      const totalInvoices = analyzed.length;
      const avgInvoice = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      // Group by supplier
      const suppliersMap: Record<string, number> = {};
      analyzed.forEach(inv => {
        if (inv.supplier) {
          suppliersMap[inv.supplier] = (suppliersMap[inv.supplier] || 0) + Number(inv.total);
        }
      });
      const topSuppliers = Object.entries(suppliersMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Header
      pdf.setFillColor(139, 92, 246); // violet-500
      pdf.rect(0, 0, 210, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reporte Financiero', 20, 25);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 150, 25);

      // Executive Summary
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen Ejecutivo', 20, 55);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gasto Total: $${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 20, 65);
      pdf.text(`Cantidad de Facturas: ${totalInvoices}`, 20, 72);
      pdf.text(`Promedio por Factura: $${avgInvoice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 20, 79);

      // Top Suppliers
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 5 Proveedores', 20, 95);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 105;
      topSuppliers.forEach(([name, amount], index) => {
        pdf.text(`${index + 1}. ${name}`, 20, y);
        pdf.text(`$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 150, y);
        y += 7;
      });

      // Invoice Table Header
      y += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detalle de Facturas', 20, y);
      y += 10;

      // Table Headers
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, y - 5, 170, 8, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fecha', 22, y);
      pdf.text('Proveedor', 60, y);
      pdf.text('Categoría', 120, y);
      pdf.text('Total', 170, y);
      
      pdf.setFont('helvetica', 'normal');
      y += 8;

      // Table Rows
      const sortedInvoices = [...analyzed].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      sortedInvoices.forEach(inv => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
          // Redraw headers on new page
          pdf.setFillColor(240, 240, 240);
          pdf.rect(20, y - 5, 170, 8, 'F');
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Fecha', 22, y);
          pdf.text('Proveedor', 60, y);
          pdf.text('Categoría', 120, y);
          pdf.text('Total', 170, y);
          pdf.setFont('helvetica', 'normal');
          y += 8;
        }

        const date = new Date(inv.invoice_date || inv.created_at).toLocaleDateString('es-ES');
        const supplier = (inv.supplier || 'Desconocido').substring(0, 25);
        const category = (inv.category || '-').substring(0, 20);
        const total = `$${Number(inv.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

        pdf.text(date, 22, y);
        pdf.text(supplier, 60, y);
        pdf.text(category, 120, y);
        pdf.text(total, 170, y);
        
        pdf.setDrawColor(220, 220, 220);
        pdf.line(20, y + 2, 190, y + 2);
        
        y += 7;
      });

      pdf.save(`Reporte_Financiero_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`
        inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border shadow-sm
        ${isExporting 
          ? 'bg-muted text-muted-foreground border-transparent cursor-wait' 
          : 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent'
        }
      `}
    >
      {isExporting ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {isExporting ? 'Generando PDF...' : 'Generar Reporte PDF'}
    </button>
  );
}
