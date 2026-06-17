import { useState, useEffect, FormEvent } from 'react';
import { Customer, useCustomers } from '../contexts/CustomerContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';

interface AddEditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function AddEditCustomerModal({ isOpen, onClose, customer }: AddEditCustomerModalProps) {
  const { addCustomer, updateCustomer, loading } = useCustomers();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [balance, setBalance] = useState('0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setStatus(customer.status);
      setBalance(customer.balance.toString());
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStatus('Active');
      setBalance('0');
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(phone)) {
      newErrors.phone = 'Phone is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const customerData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status,
        balance: parseFloat(balance) || 0,
      };

      if (customer) {
        await updateCustomer(customer.id, customerData);
        showToast('Customer updated successfully', 'success');
        addNotification({
          type: 'customer',
          title: 'Customer Updated',
          message: `${customerData.name} has been updated successfully.`,
        });
      } else {
        await addCustomer(customerData);
        showToast('Customer added successfully', 'success');
        addNotification({
          type: 'customer',
          title: 'New Customer Added',
          message: `${customerData.name} has been added to your customer list.`,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save customer:', error);
      showToast('Failed to save customer', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[25px] w-full max-w-[500px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#f5f7fa] flex items-center justify-center transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="#718EBF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.name ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Enter customer name"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.email ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="customer@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.phone ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
            {errors.phone && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors"
              disabled={loading}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="balance" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Balance ($)
            </label>
            <input
              id="balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors"
              placeholder="0.00"
              step="0.01"
              disabled={loading}
            />
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
              {loading ? 'Saving...' : customer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
