import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { router } from './routes';

const queryClient = new QueryClient();

function CounterPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ count: number }>({
    queryKey: ["/api/counter"],
    queryFn: () => fetch("/api/counter").then((r) => r.json()),
  });

  const increment = useMutation({
    mutationFn: () =>
      fetch("/api/counter/increment", { method: "POST" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/counter"] }),
  });

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CounterPage />
    </QueryClientProvider>
  );
}
