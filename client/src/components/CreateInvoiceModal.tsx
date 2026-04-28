import { useState, useEffect, FormEvent } from 'react';
import { useInvoices, InvoiceLineItem, InvoiceStatus } from '../contexts/InvoiceContext';
import { useCustomers } from '../contexts/CustomerContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInvoiceModal({ isOpen, onClose }: CreateInvoiceModalProps) {
  const { addInvoice, loading } = useInvoices();
  const { customers } = useCustomers();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: '1', name: '', quantity: 1, price: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setCustomerId('');
      setStatus('draft');
      setDate(new Date().toISOString().split('T')[0]);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth.toISOString().split('T')[0]);
      setLineItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
      setErrors({});
    }
  }, [isOpen]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), name: '', quantity: 1, price: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.1;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!customerId) {
      newErrors.customer = 'Customer is required';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    const hasInvalidLineItem = lineItems.some(item => !item.name || item.quantity <= 0 || item.price <= 0);
    if (hasInvalidLineItem) {
      newErrors.lineItems = 'All line items must have name, quantity > 0, and price > 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) return;

    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    try {
      const newInvoice = await addInvoice({
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

      showToast('Invoice created successfully', 'success');
      addNotification({
        type: 'invoice',
        title: 'Invoice Created',
        message: `New invoice for ${selectedCustomer.name} ($${total.toFixed(2)}) has been created.`,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      showToast('Failed to create invoice', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-[25px] w-full max-w-[700px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">Create Invoice</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#f5f7fa] flex items-center justify-center transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer" className="block font-medium text-[14px] text-[#343c6a] mb-2">
                Customer *
              </label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={`w-full h-[50px] px-4 rounded-[15px] border ${
                  errors.customer ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
                } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
                disabled={loading}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customer && (
                <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.customer}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block font-medium text-[14px] text-[#343c6a] mb-2">
                Status *
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors"
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block font-medium text-[14px] text-[#343c6a] mb-2">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full h-[50px] px-4 rounded-[15px] border ${
                  errors.date ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
                } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block font-medium text-[14px] text-[#343c6a] mb-2">
                Due Date *
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full h-[50px] px-4 rounded-[15px] border ${
                  errors.dueDate ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
                } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block font-medium text-[14px] text-[#343c6a]">
                Line Items *
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-[14px] text-[#2d60ff] hover:underline font-medium"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                    placeholder="Item name"
                    className="flex-1 h-[45px] px-3 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[14px] outline-none focus:border-[#2d60ff] transition-colors"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                    className="w-[80px] h-[45px] px-3 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[14px] outline-none focus:border-[#2d60ff] transition-colors"
                    min="1"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    className="w-[100px] h-[45px] px-3 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[14px] outline-none focus:border-[#2d60ff] transition-colors"
                    step="0.01"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1 || loading}
                    className="w-[45px] h-[45px] rounded-[10px] bg-[#ffe0eb] hover:bg-[#fe5c73] text-[#fe5c73] hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {errors.lineItems && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.lineItems}</p>
            )}
          </div>

          <div className="border-t border-[#e6eff5] pt-4 space-y-2">
            <div className="flex justify-between text-[14px]">
              <span className="text-[#718ebf]">Subtotal:</span>
              <span className="font-medium text-[#343c6a]">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[#718ebf]">Tax (10%):</span>
              <span className="font-medium text-[#343c6a]">${calculateTax(calculateSubtotal()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[18px] font-semibold pt-2 border-t border-[#e6eff5]">
              <span className="text-[#343c6a]">Total:</span>
              <span className="text-[#2d60ff]">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[50px] border border-[#dfeaf2] text-[#718ebf] font-medium text-[16px] rounded-[15px] hover:bg-[#f5f7fa] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-[50px] bg-[#1814f3] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#2d60ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
