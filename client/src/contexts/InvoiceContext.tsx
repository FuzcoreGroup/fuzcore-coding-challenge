import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
}

interface InvoiceContextType {
  invoices: Invoice[];
  loading: boolean;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | null>(null);

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'Acme Corp',
    customerEmail: 'contact@acme.com',
    status: 'paid',
    lineItems: [
      { id: '1', name: 'Web Design', quantity: 1, price: 2000 },
      { id: '2', name: 'Logo Design', quantity: 1, price: 500 },
    ],
    subtotal: 2500,
    tax: 250,
    total: 2750,
    date: '2024-01-28',
    dueDate: '2024-02-28',
    createdAt: '2024-01-28',
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Tech Solutions',
    customerEmail: 'info@techsolutions.com',
    status: 'sent',
    lineItems: [
      { id: '1', name: 'Development', quantity: 40, price: 50 },
    ],
    subtotal: 2000,
    tax: 200,
    total: 2200,
    date: '2024-01-25',
    dueDate: '2024-02-25',
    createdAt: '2024-01-25',
  },
  {
    id: '3',
    customerId: '3',
    customerName: 'Design Studio',
    customerEmail: 'hello@designstudio.com',
    status: 'paid',
    lineItems: [
      { id: '1', name: 'Consulting', quantity: 10, price: 150 },
      { id: '2', name: 'Strategy Session', quantity: 2, price: 500 },
    ],
    subtotal: 2500,
    tax: 250,
    total: 2750,
    date: '2024-01-20',
    dueDate: '2024-02-20',
    createdAt: '2024-01-20',
  },
  {
    id: '4',
    customerId: '4',
    customerName: 'Marketing Inc',
    customerEmail: 'contact@marketing.com',
    status: 'draft',
    lineItems: [
      { id: '1', name: 'Marketing Campaign', quantity: 1, price: 3000 },
    ],
    subtotal: 3000,
    tax: 300,
    total: 3300,
    date: '2024-01-15',
    dueDate: '2024-02-15',
    createdAt: '2024-01-15',
  },
];

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const stored = localStorage.getItem('invoices');
    return stored ? JSON.parse(stored) : MOCK_INVOICES;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setLoading(false);
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setInvoices(prev =>
      prev.map(invoice =>
        invoice.id === id
          ? { ...invoice, ...invoiceData }
          : invoice
      )
    );
    setLoading(false);
  };

  const deleteInvoice = async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setInvoices(prev => prev.filter(invoice => invoice.id !== id));
    setLoading(false);
  };

  const getInvoice = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setInvoices(prev =>
      prev.map(invoice =>
        invoice.id === id ? { ...invoice, status } : invoice
      )
    );
    setLoading(false);
  };

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
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used within InvoiceProvider');
  }
  return context;
}
