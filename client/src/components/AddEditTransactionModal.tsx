import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useTransactions, TransactionType } from '../contexts/TransactionContext';
import { useCategories, Category } from '../contexts/CategoryContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
}

export function AddEditTransactionModal({ isOpen, onClose, transaction }: AddEditTransactionModalProps) {
  const { addTransaction, updateTransaction, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoize filtered categories to avoid unnecessary recalculations
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === type);
  }, [categories, type]);

  // Only reset the form when the modal opens or the transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setAmount(transaction.amount.toString());
        setType(transaction.type);
        setCategoryId(transaction.categoryId);
        setDescription(transaction.description);
        setDate(transaction.date);
      } else {
        setAmount('');
        setType('expense');
        // Set category to the first available of the selected type, or empty
        const firstCat = filteredCategories[0]?.id || '';
        setCategoryId(firstCat);
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, transaction]); // IMPORTANT: Do NOT include filteredCategories here

  // When the user changes the type, adjust the selected category to the first available of that type
  useEffect(() => {
    if (isOpen && !transaction) {
      const firstCat = filteredCategories[0]?.id || '';
      setCategoryId(firstCat);
    }
  }, [type, filteredCategories, isOpen, transaction]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!date) newErrors.date = 'Date is required';
    if (!categoryId) newErrors.category = 'Please select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      amount: parseFloat(amount),
      type,
      categoryId,
      description: description.trim(),
      date,
    };

    try {
      if (transaction) {
        await updateTransaction(transaction.id, payload);
        showToast('Transaction updated', 'success');
        addNotification({
          type: 'transaction',
          title: 'Transaction Updated',
          message: `${payload.description} updated.`,
        });
      } else {
        await addTransaction(payload as any);
        showToast('Transaction added', 'success');
        addNotification({
          type: 'transaction',
          title: 'New Transaction',
          message: `${payload.description} - ${payload.type === 'income' ? '+' : '-'}$${payload.amount}`,
        });
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save transaction', 'error');
    }
  };

  if (!isOpen) return null;

  const loading = txLoading || catLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[25px] w-full max-w-[500px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#f5f7fa] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type buttons */}
          <div>
            <label className="block font-medium text-[14px] text-[#343c6a] mb-2">Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`h-[50px] rounded-[15px] border-2 font-medium transition-all ${
                  type === 'income'
                    ? 'border-[#16dbcc] bg-[#dcfaf8] text-[#16dbcc]'
                    : 'border-[#dfeaf2] bg-[#f5f7fa] text-[#718ebf]'
                }`}
                disabled={loading}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`h-[50px] rounded-[15px] border-2 font-medium transition-all ${
                  type === 'expense'
                    ? 'border-[#fe5c73] bg-[#ffe0eb] text-[#fe5c73]'
                    : 'border-[#dfeaf2] bg-[#f5f7fa] text-[#718ebf]'
                }`}
                disabled={loading}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-medium text-[14px] text-[#343c6a] mb-2">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.amount ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] outline-none focus:border-[#2d60ff]`}
              disabled={loading}
            />
            {errors.amount && <p className="text-[12px] text-[#fe5c73] mt-1">{errors.amount}</p>}
          </div>

          {/* Category select */}
          <div>
            <label className="block font-medium text-[14px] text-[#343c6a] mb-2">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa] outline-none focus:border-[#2d60ff]"
              disabled={loading || filteredCategories.length === 0}
            >
              {filteredCategories.length === 0 ? (
                <option value="">No categories – create one first</option>
              ) : (
                filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            {errors.category && <p className="text-[12px] text-[#fe5c73] mt-1">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-[14px] text-[#343c6a] mb-2">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.description ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] outline-none focus:border-[#2d60ff]`}
              disabled={loading}
            />
            {errors.description && <p className="text-[12px] text-[#fe5c73] mt-1">{errors.description}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block font-medium text-[14px] text-[#343c6a] mb-2">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.date ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] outline-none focus:border-[#2d60ff]`}
              disabled={loading}
            />
            {errors.date && <p className="text-[12px] text-[#fe5c73] mt-1">{errors.date}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[50px] border border-[#dfeaf2] text-[#718ebf] rounded-[15px] hover:bg-[#f5f7fa]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-[50px] bg-[#1814f3] text-white rounded-[15px] hover:bg-[#2d60ff] disabled:opacity-50"
            >
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}