import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useTransactions, Transaction, TransactionType, TransactionCategory } from '@/contexts/TransactionContext';
import { AddEditTransactionModal } from '@/components/AddEditTransactionModal';
import { ImportTransactionsModal } from '@/components/ImportTransactionsModal';

export default function Transactions() {
  const { transactions, loading } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TransactionCategory>('all');

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const categories: Array<'all' | TransactionCategory> = [
    'all',
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

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    return matchesType && matchesCategory;
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AppLayout title="Transactions">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Total Income</p>
            <p className="font-semibold text-[24px] text-[#16dbaa]">${totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Total Expenses</p>
            <p className="font-semibold text-[24px] text-[#fe5c73]">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Net Balance</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">
              ${(totalIncome - totalExpenses).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-semibold text-[22px] text-[#343c6a]">All Transactions</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-6 h-[40px] border border-[#2d60ff] text-[#2d60ff] font-medium text-[14px] rounded-[10px] hover:bg-[#e7edff] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.66667 6.66667L8 10L11.3333 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Import CSV
              </button>
              <button
                onClick={handleAddTransaction}
                className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors"
              >
                Add Transaction
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <label className="block text-[12px] text-[#718ebf] mb-2">Filter by Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`flex-1 h-[40px] rounded-[10px] font-medium text-[14px] transition-all ${
                    typeFilter === 'all'
                      ? 'bg-[#1814f3] text-white'
                      : 'bg-[#f5f7fa] text-[#718ebf] hover:bg-[#e6eff5]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`flex-1 h-[40px] rounded-[10px] font-medium text-[14px] transition-all ${
                    typeFilter === 'income'
                      ? 'bg-[#16dbcc] text-white'
                      : 'bg-[#f5f7fa] text-[#718ebf] hover:bg-[#e6eff5]'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`flex-1 h-[40px] rounded-[10px] font-medium text-[14px] transition-all ${
                    typeFilter === 'expense'
                      ? 'bg-[#fe5c73] text-white'
                      : 'bg-[#f5f7fa] text-[#718ebf] hover:bg-[#e6eff5]'
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="categoryFilter" className="block text-[12px] text-[#718ebf] mb-2">
                Filter by Category
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as 'all' | TransactionCategory)}
                className="w-full h-[40px] px-4 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa] text-[#343c6a] text-[14px] outline-none focus:border-[#2d60ff] transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[60px] h-[60px] rounded-full border-4 border-[#e6eff5] border-t-[#2d60ff] animate-spin mb-4" />
              <p className="text-[#718ebf] text-[15px]">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[80px] h-[80px] rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M20 36.6667C29.2047 36.6667 36.6667 29.2047 36.6667 20C36.6667 10.7953 29.2047 3.33333 20 3.33333C10.7953 3.33333 3.33333 10.7953 3.33333 20C3.33333 29.2047 10.7953 36.6667 20 36.6667Z"
                    stroke="#718EBF"
                    strokeWidth="2"
                  />
                  <path d="M20 11.6667V20M20 28.3333H20.0167" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-semibold text-[18px] text-[#343c6a] mb-2">No transactions found</h3>
              <p className="text-[#718ebf] text-[14px] mb-6">
                {typeFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first transaction'}
              </p>
              {typeFilter === 'all' && categoryFilter === 'all' && (
                <button
                  onClick={handleAddTransaction}
                  className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors"
                >
                  Add Your First Transaction
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-4 border-b border-[#f3f3f5] last:border-0 hover:bg-[#f5f7fa] px-4 -mx-4 rounded-[10px] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-[50px] h-[50px] rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-[#dcfaf8]' : 'bg-[#ffe0eb]'
                      }`}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={transaction.type === 'income' ? 'rotate-180' : ''}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke={transaction.type === 'income' ? '#16DBCC' : '#FE5C73'}
                          strokeWidth="2"
                        />
                        <path
                          d="M12 8V16M12 16L15 13M12 16L9 13"
                          stroke={transaction.type === 'income' ? '#16DBCC' : '#FE5C73'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[16px] text-[#343c6a]">{transaction.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[#718ebf]">{formatDate(transaction.date)}</span>
                        <span className="text-[#e6eff5]">•</span>
                        <span className="text-[13px] text-[#718ebf]">{transaction.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-medium text-[16px] ${
                        transaction.type === 'income' ? 'text-[#16dbaa]' : 'text-[#fe5c73]'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleEditTransaction(transaction)}
                      className="opacity-0 group-hover:opacity-100 w-[32px] h-[32px] rounded-[8px] bg-[#e7edff] hover:bg-[#2d60ff] text-[#2d60ff] hover:text-white transition-all flex items-center justify-center"
                      title="Edit transaction"
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />

      <ImportTransactionsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </AppLayout>
  );
}
