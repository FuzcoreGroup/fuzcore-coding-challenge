import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useTransactions, Transaction, TransactionType } from '../../contexts/TransactionContext';
import { useCategories, Category } from '../../contexts/CategoryContext';
import { AddEditTransactionModal } from '../../components/AddEditTransactionModal';
import { ImportTransactionsModal } from '../../components/ImportTransactionsModal';
import { formatAmount } from '../../utils/formatters';

export default function Transactions() {
  const { transactions, loading: txLoading, deleteTransaction } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');

  const categoryMap = new Map<string, Category>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));
  const uniqueCategories = Array.from(categoryMap.values());

  useEffect(() => {
    if (categoryFilter !== 'all' && !categoryMap.has(categoryFilter)) {
      setCategoryFilter('all');
    }
  }, [categories]);

  const handleAdd = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filtered = transactions.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
    return true;
  });

  // Convert amount to number (already numbers in context, but safe)
  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : Number(t.amount)), 0);

  const totalExpense = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : Number(t.amount)), 0);

  const balance = totalIncome - totalExpense;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const loading = txLoading && transactions.length === 0;

  return (
    <AppLayout title="Transactions">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[25px] p-6">
            <p className="text-[14px] text-[#718ebf]">Total Income</p>
            <p className="font-semibold text-[24px] text-[#16dbaa]">${formatAmount(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6">
            <p className="text-[14px] text-[#718ebf]">Total Expenses</p>
            <p className="font-semibold text-[24px] text-[#fe5c73]">${formatAmount(totalExpense)}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6">
            <p className="text-[14px] text-[#718ebf]">Net Balance</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">${formatAmount(balance)}</p>
          </div>
        </div>

        {/* Transactions Table/List */}
        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <h2 className="font-semibold text-[22px] text-[#343c6a]">Transactions</h2>
            <div className="flex gap-3">
              <button onClick={() => setIsImportModalOpen(true)} className="px-6 h-[40px] border border-[#2d60ff] text-[#2d60ff] rounded-[10px] flex items-center gap-2 hover:bg-[#e7edff]">Import CSV</button>
              <button onClick={handleAdd} className="px-6 h-[40px] bg-[#1814f3] text-white rounded-[10px] hover:bg-[#2d60ff]">Add Transaction</button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <label className="text-[12px] text-[#718ebf]">Type</label>
              <div className="flex gap-2 mt-1">
                {(['all', 'income', 'expense'] as const).map(opt => (
                  <button key={opt} onClick={() => setTypeFilter(opt)} className={`px-4 h-[36px] rounded-[8px] text-[13px] font-medium ${typeFilter === opt ? 'bg-[#1814f3] text-white' : 'bg-[#f5f7fa] text-[#718ebf]'}`}>
                    {opt === 'all' ? 'All' : opt === 'income' ? 'Income' : 'Expense'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-[#718ebf]">Category</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full h-[40px] px-3 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa] text-[14px]">
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#718ebf]">No transactions found</p>
              <button onClick={handleAdd} className="mt-4 px-6 h-[40px] bg-[#1814f3] text-white rounded-[10px]">Add your first transaction</button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(tx => {
                const cat = categoryMap.get(tx.categoryId);
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b hover:bg-[#f5f7fa] px-3 rounded-xl group">
                    <div className="flex items-center gap-4">
                      <div className={`w-[45px] h-[45px] rounded-full flex items-center justify-center text-[18px] font-bold ${tx.type === 'income' ? 'bg-[#dcfaf8] text-[#16dbcc]' : 'bg-[#ffe0eb] text-[#fe5c73]'}`}>
                        {tx.type === 'income' ? '↑' : '↓'}
                      </div>
                      <div>
                        <p className="font-medium text-[16px] text-[#343c6a]">{tx.description}</p>
                        <div className="flex gap-2 text-[12px] text-[#718ebf]">
                          <span>{formatDate(tx.date)}</span>
                          <span>•</span>
                          <span>{cat?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${tx.type === 'income' ? 'text-[#16dbaa]' : 'text-[#fe5c73]'}`}>
                        {tx.type === 'income' ? '+' : '-'}${formatAmount(tx.amount)}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(tx)} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-[#e7edff] text-[#2d60ff] hover:bg-[#2d60ff] hover:text-white flex items-center justify-center">✎</button>
                        <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-[#ffe0eb] text-[#fe5c73] hover:bg-[#fe5c73] hover:text-white flex items-center justify-center">🗑</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddEditTransactionModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedTransaction(null); }} transaction={selectedTransaction} />
      <ImportTransactionsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </AppLayout>
  );
}