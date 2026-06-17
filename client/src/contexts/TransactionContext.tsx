import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  description: string;
  date: string;
  createdAt: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const API_BASE = '/api/transactions';

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response: ${text.substring(0, 200)}`);
      }
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      
      // Normalize amounts to numbers
      const normalized = data.map((tx: any) => ({
        ...tx,
        amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
      }));
      const sorted = normalized.sort((a: Transaction, b: Transaction) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTransactions();
  }, [token]);

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(txData),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response: ${text.substring(0, 200)}`);
      }
      if (!res.ok) throw new Error(data.message || 'Failed to add transaction');
      const newTx = { ...data, amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount };
      setTransactions(prev => [newTx, ...prev]);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: string, txData: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(txData),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response: ${text.substring(0, 200)}`);
      }
      if (!res.ok) throw new Error(data.message || 'Failed to update transaction');
      const updated = { ...data, amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount };
      setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updated } : tx));
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response: ${text.substring(0, 200)}`);
      }
      if (!res.ok) throw new Error(data.message || 'Failed to delete transaction');
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = () => fetchTransactions();

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refreshTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
}