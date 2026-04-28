import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import Transactions from './pages/transactions/Transactions';
import Invoices from './pages/invoices/Invoices';
import Categories from './pages/categories/Categories';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <Signup />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <ProtectedRoute>
        <Customers />
      </ProtectedRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <Transactions />
      </ProtectedRoute>
    ),
  },
  {
    path: '/invoices',
    element: (
      <ProtectedRoute>
        <Invoices />
      </ProtectedRoute>
    ),
  },
  {
    path: '/categories',
    element: (
      <ProtectedRoute>
        <Categories />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-6">
        <div className="bg-white rounded-[25px] p-12 text-center shadow-sm">
          <h1 className="font-bold text-[48px] text-[#2d60ff] mb-4">404</h1>
          <p className="text-[#718ebf] text-[18px] mb-6">Page not found</p>
          <a
            href="/dashboard"
            className="inline-block px-6 h-[40px] leading-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    ),
  },
]);
