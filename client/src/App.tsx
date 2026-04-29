import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <CategoryProvider>
            <CustomerProvider>
              <TransactionProvider>
                <InvoiceProvider>
                  <RouterProvider router={router} />
                </InvoiceProvider>
              </TransactionProvider>
            </CustomerProvider>
          </CategoryProvider>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}