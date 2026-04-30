import { useState } from 'react';
import { Invoice, InvoiceStatus, useInvoices } from '../contexts/InvoiceContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onEdit?: (invoice: Invoice) => void;
}

export function InvoiceDetailModal({ isOpen, onClose, invoice, onEdit }: InvoiceDetailModalProps) {
  const { updateInvoiceStatus, refreshInvoices, loading } = useInvoices();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  if (!isOpen || !invoice) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'bg-[#dcfaf8] text-[#16dbcc]';
      case 'sent': return 'bg-[#fff5d9] text-[#ffbb38]';
      default: return 'bg-[#f3f3f5] text-[#718ebf]';
    }
  };

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      showToast(`Invoice marked as ${statusLabel}`, 'success');
      addNotification({
        type: 'invoice',
        title: 'Status Updated',
        message: `Invoice #${invoice.id} is now ${statusLabel}.`,
      });
      refreshInvoices();
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(24);
      doc.setTextColor(52, 60, 106);
      doc.text('INVOICE', 20, 25);

      doc.setFontSize(10);
      doc.setTextColor(113, 142, 191);
      doc.text('BankDash Financial Services', 20, 32);
      doc.text('123 Business Street, Suite 100', 20, 37);
      doc.text('New York, NY 10001', 20, 42);

      // Invoice info
      doc.setFontSize(12);
      doc.setTextColor(52, 60, 106);
      doc.text(`Invoice #${invoice.id}`, 150, 25);
      doc.setFontSize(10);
      doc.setTextColor(113, 142, 191);
      doc.text(`Date: ${formatDate(invoice.date)}`, 150, 32);
      doc.text(`Due: ${formatDate(invoice.dueDate)}`, 150, 37);

      // Status line
      const statusColor = invoice.status === 'paid' ? [22, 219, 204] : invoice.status === 'sent' ? [255, 187, 56] : [113, 142, 191];
      doc.setTextColor(...statusColor);
      doc.text(`Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`, 150, 42);

      doc.line(20, 50, 190, 50);

      // Bill To
      doc.setFontSize(11);
      doc.setTextColor(52, 60, 106);
      doc.text('Bill To:', 20, 60);
      doc.setFontSize(10);
      doc.setTextColor(113, 142, 191);
      doc.text(invoice.customerName, 20, 67);
      doc.text(invoice.customerEmail, 20, 72);

      // Line items table - ensure we use the correct property name
      const tableBody = invoice.lineItems.map(item => [
        item.name || item.description || 'Unnamed Item',  // Fallback for different property names
        item.quantity.toString(),
        `$${item.price.toFixed(2)}`,
        `$${(item.quantity * item.price).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 85,
        head: [['Item', 'Quantity', 'Price', 'Total']],
        body: tableBody,
        theme: 'plain',
        headStyles: { fillColor: [245, 247, 250], textColor: [113, 142, 191], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { textColor: [52, 60, 106], fontSize: 10 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 120;
      doc.line(120, finalY + 10, 190, finalY + 10);

      doc.setFontSize(10);
      doc.setTextColor(113, 142, 191);
      doc.text('Subtotal:', 120, finalY + 20);
      doc.text('Tax (10%):', 120, finalY + 27);

      doc.setFontSize(12);
      doc.setTextColor(52, 60, 106);
      doc.text('Total:', 120, finalY + 37);

      doc.setTextColor(45, 96, 255);
      doc.text(`$${invoice.subtotal.toFixed(2)}`, 190, finalY + 20, { align: 'right' });
      doc.text(`$${invoice.tax.toFixed(2)}`, 190, finalY + 27, { align: 'right' });
      doc.setFontSize(12);
      doc.text(`$${invoice.total.toFixed(2)}`, 190, finalY + 37, { align: 'right' });

      doc.setFontSize(8);
      doc.setTextColor(139, 163, 203);
      doc.text('Thank you for your business!', 105, finalY + 55, { align: 'center' });

      doc.save(`invoice-${invoice.id}.pdf`);
      showToast('PDF exported successfully', 'success');
      addNotification({
        type: 'invoice',
        title: 'PDF Exported',
        message: `Invoice #${invoice.id} has been downloaded.`,
      });
    } catch (error) {
      console.error(error);
      showToast('Failed to export PDF', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-[25px] w-full max-w-[700px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">Invoice Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#f5f7fa] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[14px] text-[#718ebf] mb-1">Invoice #{invoice.id}</p>
              <h3 className="font-semibold text-[20px] text-[#343c6a]">{invoice.customerName}</h3>
              <p className="text-[14px] text-[#718ebf]">{invoice.customerEmail}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-[14px] font-medium ${getStatusColor(invoice.status)}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#f5f7fa] rounded-[15px]">
            <div>
              <p className="text-[12px] text-[#718ebf] mb-1">Invoice Date</p>
              <p className="text-[14px] font-medium text-[#343c6a]">{formatDate(invoice.date)}</p>
            </div>
            <div>
              <p className="text-[12px] text-[#718ebf] mb-1">Due Date</p>
              <p className="text-[14px] font-medium text-[#343c6a]">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="font-semibold text-[16px] text-[#343c6a] mb-3">Line Items</h4>
            <div className="border border-[#e6eff5] rounded-[15px] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f5f7fa]">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-[12px] text-[#718ebf]">Item</th>
                    <th className="text-center py-3 px-4 font-medium text-[12px] text-[#718ebf]">Qty</th>
                    <th className="text-right py-3 px-4 font-medium text-[12px] text-[#718ebf]">Price</th>
                    <th className="text-right py-3 px-4 font-medium text-[12px] text-[#718ebf]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, idx) => (
                    <tr key={item.id || idx} className="border-t border-[#e6eff5]">
                      <td className="py-3 px-4 text-[14px] text-[#343c6a]">{item.name || item.description || 'Unnamed Item'}</td>
                      <td className="text-center py-3 px-4 text-[14px] text-[#718ebf]">{item.quantity}</td>
                      <td className="text-right py-3 px-4 text-[14px] text-[#718ebf]">${item.price.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-[14px] font-medium text-[#343c6a]">
                        ${(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-[#e6eff5] pt-4 space-y-2">
            <div className="flex justify-between text-[14px]">
              <span className="text-[#718ebf]">Subtotal:</span>
              <span className="font-medium text-[#343c6a]">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[#718ebf]">Tax (10%):</span>
              <span className="font-medium text-[#343c6a]">${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[20px] font-semibold pt-2 border-t border-[#e6eff5]">
              <span className="text-[#343c6a]">Total:</span>
              <span className="text-[#2d60ff]">${invoice.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {invoice.status !== 'paid' && (
              <div>
                <h4 className="font-semibold text-[16px] text-[#343c6a] mb-3">Update Status</h4>
                <div className="flex gap-3">
                  {invoice.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange('sent')}
                      disabled={loading}
                      className="flex-1 h-[45px] bg-[#ffbb38] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#eda10d] disabled:opacity-50"
                    >
                      Mark as Sent
                    </button>
                  )}
                  {(invoice.status === 'draft' || invoice.status === 'sent') && (
                    <button
                      onClick={() => handleStatusChange('paid')}
                      disabled={loading}
                      className="flex-1 h-[45px] bg-[#16dbcc] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#12b8a3] disabled:opacity-50"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            )}

           

            {/* Export PDF & Close buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleExportPDF}
                className="flex-1 h-[50px] bg-[#2d60ff] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#1814f3] flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M17.5 12.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.83333 8.33333L10 12.5L14.1667 8.33333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 12.5V2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export PDF
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-[50px] border border-[#dfeaf2] text-[#718ebf] font-medium text-[16px] rounded-[15px] hover:bg-[#f5f7fa] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}