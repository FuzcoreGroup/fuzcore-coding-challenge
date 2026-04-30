import { useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useInvoices, Invoice, InvoiceStatus, InvoiceLineItem } from '../../contexts/InvoiceContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { CreateInvoiceModal } from '../../components/CreateInvoiceModal';
import { InvoiceDetailModal } from '../../components/InvoiceDetailModal';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';

// Edit Invoice Modal Component
interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

function EditInvoiceModal({ isOpen, onClose, invoice }: EditInvoiceModalProps) {
  const { updateInvoice, loading } = useInvoices();
  const { customers } = useCustomers();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  // Populate form when invoice changes
  useState(() => {
    if (invoice) {
      setCustomerId(invoice.customerId);
      setStatus(invoice.status);
      setDate(invoice.date);
      setDueDate(invoice.dueDate);
      setLineItems(invoice.lineItems.map(item => ({ ...item, id: item.id || crypto.randomUUID() })));
    } else {
      setCustomerId('');
      setStatus('draft');
      setDate(new Date().toISOString().split('T')[0]);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth.toISOString().split('T')[0]);
      setLineItems([{ id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }]);
    }
  }, [invoice, isOpen]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateSubtotal = () => lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const calculateTax = (subtotal: number) => subtotal * 0.1;
  const calculateTotal = () => { const s = calculateSubtotal(); return s + calculateTax(s); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !date || !dueDate || lineItems.some(i => !i.name || i.quantity <= 0 || i.price <= 0)) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) return;

    try {
      await updateInvoice(invoice!.id, {
        customerId,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        status,
        lineItems,
        subtotal,
        tax,
        total,
        date,
        dueDate,
      });
      showToast('Invoice updated successfully', 'success');
      addNotification({ type: 'invoice', title: 'Invoice Updated', message: `Invoice #${invoice!.id} has been updated.` });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update invoice', 'error');
    }
  };

  if (!isOpen || !invoice) return null;
  if (invoice.status !== 'draft') return null; // safety

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[25px] w-full max-w-[700px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">Edit Invoice</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-[#f5f7fa] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5L15 15" stroke="#718EBF" strokeWidth="2"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa]">
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value as InvoiceStatus)} className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa]">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa]" />
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa]" />
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <span className="font-medium text-[14px] text-[#343c6a]">Line Items</span>
              <button type="button" onClick={addLineItem} className="text-[14px] text-[#2d60ff]">+ Add Item</button>
            </div>
            <div className="space-y-3">
              {lineItems.map(item => (
                <div key={item.id} className="flex gap-2 items-start">
                  <input type="text" value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} placeholder="Item name" className="flex-1 h-[45px] px-3 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa]" />
                  <input type="number" value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)} placeholder="Qty" className="w-[80px] h-[45px] px-3 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa]" min="1" />
                  <input type="number" step="0.01" value={item.price} onChange={e => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)} placeholder="Price" className="w-[100px] h-[45px] px-3 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa]" />
                  <button type="button" onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1} className="w-[45px] h-[45px] rounded-[10px] bg-[#ffe0eb] text-[#fe5c73] hover:bg-[#fe5c73] hover:text-white disabled:opacity-50">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between"><span>Subtotal:</span><span>${calculateSubtotal().toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax (10%):</span><span>${calculateTax(calculateSubtotal()).toFixed(2)}</span></div>
            <div className="flex justify-between text-[18px] font-semibold"><span>Total:</span><span>${calculateTotal().toFixed(2)}</span></div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-[50px] border rounded-[15px]">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-[50px] bg-[#1814f3] text-white rounded-[15px] disabled:opacity-50">{loading ? 'Updating...' : 'Update Invoice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Invoices Page
export default function Invoices() {
  const { invoices, loading, deleteInvoice } = useInvoices();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (invoice.status !== 'draft') {
      alert('Only draft invoices can be deleted');
      return;
    }
    if (confirm(`Delete invoice #${invoice.id}?`)) {
      try {
        await deleteInvoice(invoice.id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[#dcfaf8] text-[#16dbcc]';
      case 'sent': return 'bg-[#fff5d9] text-[#ffbb38]';
      default: return 'bg-[#f3f3f5] text-[#718ebf]';
    }
  };

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);

  return (
    <AppLayout title="Invoices">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-[25px] p-6"><p className="text-[14px] text-[#718ebf]">Total Invoices</p><p className="font-semibold text-[24px] text-[#343c6a]">{invoices.length}</p></div>
          <div className="bg-white rounded-[25px] p-6"><p className="text-[14px] text-[#718ebf]">Paid</p><p className="font-semibold text-[24px] text-[#16dbaa]">{invoices.filter(i => i.status === 'paid').length}</p></div>
          <div className="bg-white rounded-[25px] p-6"><p className="text-[14px] text-[#718ebf]">Sent</p><p className="font-semibold text-[24px] text-[#ffbb38]">{invoices.filter(i => i.status === 'sent').length}</p></div>
          <div className="bg-white rounded-[25px] p-6"><p className="text-[14px] text-[#718ebf]">Total Revenue</p><p className="font-semibold text-[24px] text-[#343c6a]">${totalRevenue.toLocaleString()}</p></div>
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-[22px] text-[#343c6a]">Invoice List</h2>
            <button onClick={() => setIsCreateModalOpen(true)} className="px-6 h-[40px] bg-[#1814f3] text-white rounded-[10px] hover:bg-[#2d60ff]">Create Invoice</button>
          </div>

          {loading && !invoices.length ? (
            <div className="text-center py-16">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#718ebf] mb-4">No invoices yet</p>
              <button onClick={() => setIsCreateModalOpen(true)} className="px-6 h-[40px] bg-[#1814f3] text-white rounded-[10px]">Create your first invoice</button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
              <div key={invoice.id} className="border border-[#dfeaf2] rounded-[15px] p-4 hover:border-[#2d60ff] transition-all">
                <div className="flex items-center justify-between">
                  {/* Left side – clickable area to view details */}
                  <button onClick={() => handleViewInvoice(invoice)} className="flex-1 text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-[50px] h-[50px] rounded-full bg-[#f5f7fa] flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="4" y="4" width="16" height="16" rx="2" stroke="#2D60FF" strokeWidth="2" />
                          <path d="M8 10H16M8 14H12" stroke="#2D60FF" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-[16px] text-[#343c6a]">Invoice #{invoice.id}</p>
                        <p className="text-[14px] text-[#718ebf]">{invoice.customerName}</p>
                        <p className="text-[12px] text-[#8ba3cb]">{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                  </button>

                  {/* Right side – amount, status, and action icons */}
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-medium text-[16px] text-[#343c6a]">${invoice.total.toLocaleString()}</p>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <div className="flex gap-2 mt-1">
                      {/* View icon (always visible) */}
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="w-8 h-8 rounded-lg bg-[#e7edff] text-[#2d60ff] hover:bg-[#2d60ff] hover:text-white flex items-center justify-center transition-colors"
                        title="View Invoice"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Edit icon – only for draft */}
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="w-8 h-8 rounded-lg bg-[#e7edff] text-[#2d60ff] hover:bg-[#2d60ff] hover:text-white flex items-center justify-center transition-colors"
                          title="Edit Invoice"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4088 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.5809 14.5035 3.82611 14.4088 4.05493C14.314 4.28374 14.1751 4.49161 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}

                      {/* Delete icon – only for draft */}
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleDeleteInvoice(invoice)}
                          className="w-8 h-8 rounded-lg bg-[#ffe0eb] text-[#fe5c73] hover:bg-[#fe5c73] hover:text-white flex items-center justify-center transition-colors"
                          title="Delete Invoice"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M2 4H3.33333H14M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

      <CreateInvoiceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        onEdit={handleEditInvoice}
      />
      <EditInvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
      />
    </AppLayout>
  );
}