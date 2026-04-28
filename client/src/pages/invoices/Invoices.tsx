import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useInvoices, Invoice } from '@/contexts/InvoiceContext';
import { CreateInvoiceModal } from '@/components/CreateInvoiceModal';
import { InvoiceDetailModal } from '@/components/InvoiceDetailModal';

export default function Invoices() {
  const { invoices, loading } = useInvoices();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-[#dcfaf8] text-[#16dbcc]';
      case 'sent':
        return 'bg-[#fff5d9] text-[#ffbb38]';
      case 'draft':
        return 'bg-[#f3f3f5] text-[#718ebf]';
      default:
        return 'bg-[#f3f3f5] text-[#718ebf]';
    }
  };

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <AppLayout title="Invoices">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Total Invoices</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Paid</p>
            <p className="font-semibold text-[24px] text-[#16dbaa]">
              {invoices.filter(inv => inv.status === 'paid').length}
            </p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Sent</p>
            <p className="font-semibold text-[24px] text-[#ffbb38]">
              {invoices.filter(inv => inv.status === 'sent').length}
            </p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Total Revenue</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-[22px] text-[#343c6a]">Invoice List</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors"
            >
              Create Invoice
            </button>
          </div>

          {loading && invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[60px] h-[60px] rounded-full border-4 border-[#e6eff5] border-t-[#2d60ff] animate-spin mb-4" />
              <p className="text-[#718ebf] text-[15px]">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[80px] h-[80px] rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="8" width="24" height="24" rx="3" stroke="#718EBF" strokeWidth="2" />
                  <path d="M14 16H26M14 22H20" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-semibold text-[18px] text-[#343c6a] mb-2">No invoices yet</h3>
              <p className="text-[#718ebf] text-[14px] mb-6">
                Get started by creating your first invoice
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors"
              >
                Create Your First Invoice
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => handleViewInvoice(invoice)}
                  className="w-full flex items-center justify-between p-4 border border-[#dfeaf2] rounded-[15px] hover:border-[#2d60ff] hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-[50px] h-[50px] rounded-full bg-[#f5f7fa] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="4" width="16" height="16" rx="2" stroke="#2D60FF" strokeWidth="2" />
                        <path d="M8 10H16M8 14H12" stroke="#2D60FF" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[16px] text-[#343c6a] mb-1">
                        Invoice #{invoice.id}
                      </p>
                      <p className="text-[14px] text-[#718ebf]">{invoice.customerName}</p>
                      <p className="text-[12px] text-[#8ba3cb]">{formatDate(invoice.date)}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-medium text-[16px] text-[#343c6a]">
                      ${invoice.total.toLocaleString()}
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-medium ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </AppLayout>
  );
}
