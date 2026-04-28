import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type TransactionType = 'income' | 'expense';
export type TransactionCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Shopping'
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Bills'
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: string;
  createdAt: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransaction: (id: string) => Transaction | undefined;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 5000,
    type: 'income',
    category: 'Salary',
    description: 'Monthly salary payment',
    date: '2024-01-28',
    createdAt: '2024-01-28',
  },
  {
    id: '2',
    amount: 750,
    type: 'income',
    category: 'Freelance',
    description: 'Client project payment',
    date: '2024-01-25',
    createdAt: '2024-01-25',
  },
  {
    id: '3',
    amount: 25,
    type: 'expense',
    category: 'Entertainment',
    description: 'Spotify subscription',
    date: '2024-01-28',
    createdAt: '2024-01-28',
  },
  {
    id: '4',
    amount: 150,
    type: 'expense',
    category: 'Bills',
    description: 'Mobile service',
    date: '2024-01-20',
    createdAt: '2024-01-20',
  },
  {
    id: '5',
    amount: 85,
    type: 'expense',
    category: 'Food',
    description: 'Grocery shopping',
    date: '2024-01-18',
    createdAt: '2024-01-18',
  },
  {
    id: '6',
    amount: 340,
    type: 'expense',
    category: 'Shopping',
    description: 'Amazon purchase',
    date: '2024-01-14',
    createdAt: '2024-01-14',
  },
];

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem('transactions');
    return stored ? JSON.parse(stored) : MOCK_TRANSACTIONS;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setLoading(false);
  };

  const updateTransaction = async (id: string, transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setTransactions(prev =>
      prev.map(transaction =>
        transaction.id === id
          ? { ...transaction, ...transactionData }
          : transaction
      )
    );
    setLoading(false);
  };

  const deleteTransaction = async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    setLoading(false);
  };

  const getTransaction = (id: string) => {
    return transactions.find(transaction => transaction.id === id);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}
