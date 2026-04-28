import { useState, useEffect, FormEvent } from 'react';
import { Transaction, TransactionType, TransactionCategory, useTransactions } from '../contexts/TransactionContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';

interface AddEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

const CATEGORIES: TransactionCategory[] = [
  'Salary',
  'Freelance',
  'Investment',
  'Shopping',
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Other',
];

export function AddEditTransactionModal({ isOpen, onClose, transaction }: AddEditTransactionModalProps) {
  const { addTransaction, updateTransaction, loading } = useTransactions();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Other');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategory(transaction.category);
      setDescription(transaction.description);
      setDate(transaction.date);
    } else {
      setAmount('');
      setType('expense');
      setCategory('Other');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setErrors({});
  }, [transaction, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!date) {
      newErrors.date = 'Date is required';
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
      const transactionData = {
        amount: parseFloat(amount),
        type,
        category,
        description: description.trim(),
        date,
      };

      if (transaction) {
        await updateTransaction(transaction.id, transactionData);
        showToast('Transaction updated successfully', 'success');
        addNotification({
          type: 'transaction',
          title: 'Transaction Updated',
          message: `${transactionData.description} ($${transactionData.amount}) has been updated.`,
        });
      } else {
        await addTransaction(transactionData);
        showToast('Transaction added successfully', 'success');
        addNotification({
          type: 'transaction',
          title: 'New Transaction Added',
          message: `${transactionData.description} - ${transactionData.type === 'income' ? '+' : '-'}$${transactionData.amount}`,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      showToast('Failed to save transaction', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-[25px] w-full max-w-[500px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
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
          <div>
            <label htmlFor="type" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`h-[50px] rounded-[15px] border-2 font-medium text-[15px] transition-all ${
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
                className={`h-[50px] rounded-[15px] border-2 font-medium text-[15px] transition-all ${
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

          <div>
            <label htmlFor="amount" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Amount ($) *
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.amount ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="0.00"
              step="0.01"
              disabled={loading}
            />
            {errors.amount && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full h-[50px] px-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors"
              disabled={loading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Description *
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.description ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Enter description"
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.description}</p>
            )}
          </div>

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
            {errors.date && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.date}</p>
            )}
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
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
