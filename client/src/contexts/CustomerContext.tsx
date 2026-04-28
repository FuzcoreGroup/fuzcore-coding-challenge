import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  balance: number;
  createdAt: string;
}

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
}

const CustomerContext = createContext<CustomerContextType | null>(null);

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    balance: 5420,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 234-5678',
    status: 'Active',
    balance: 12340,
    createdAt: '2024-01-18',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    phone: '+1 (555) 345-6789',
    status: 'Inactive',
    balance: 850,
    createdAt: '2024-02-02',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    phone: '+1 (555) 456-7890',
    status: 'Active',
    balance: 8920,
    createdAt: '2024-02-10',
  },
];

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const stored = localStorage.getItem('customers');
    return stored ? JSON.parse(stored) : MOCK_CUSTOMERS;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCustomers(prev => [newCustomer, ...prev]);
    setLoading(false);
  };

  const updateCustomer = async (id: string, customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setCustomers(prev =>
      prev.map(customer =>
        customer.id === id
          ? { ...customer, ...customerData }
          : customer
      )
    );
    setLoading(false);
  };

  const deleteCustomer = async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setCustomers(prev => prev.filter(customer => customer.id !== id));
    setLoading(false);
  };

  const getCustomer = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        loading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within CustomerProvider');
  }
  return context;
}
