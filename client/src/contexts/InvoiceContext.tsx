import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface InvoiceLineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
}

interface InvoiceContextType {
  invoices: Invoice[];
  loading: boolean;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  refreshInvoices: () => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | null>(null);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const API_BASE = '/api/invoices';

  const fetchInvoices = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid response'); }
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInvoices();
  }, [token]);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid response'); }
      if (!res.ok) throw new Error(data.message || 'Failed to create invoice');
      setInvoices(prev => [data, ...prev]);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid response'); }
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv));
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid response'); }
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid response'); }
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInvoice = (id: string) => invoices.find(inv => inv.id === id);
  const refreshInvoices = () => fetchInvoices();

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        loading,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoice,
        updateInvoiceStatus,
        refreshInvoices,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider');
  return ctx;
}