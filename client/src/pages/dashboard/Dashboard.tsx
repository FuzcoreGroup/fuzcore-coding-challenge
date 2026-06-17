import { useMemo } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useTransactions } from '../../contexts/TransactionContext';
import { useInvoices } from '../../contexts/InvoiceContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useCategories } from '../../contexts/CategoryContext';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// ---------- Helper functions ----------
const formatYMD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getStartOfWeek = (date: Date = new Date(), startDay: number = 1): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day - startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfWeek = (startDate: Date, daysToAdd: number = 6): Date => {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + daysToAdd);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Convert a transaction date (which may be Date object or string) to YYYY-MM-DD
const getTransactionDateStr = (txDate: any): string => {
  if (txDate instanceof Date) return formatYMD(txDate);
  if (typeof txDate === 'string') return txDate.split('T')[0];
  return formatYMD(new Date(txDate));
};

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { invoices } = useInvoices();
  const { customers } = useCustomers();
  const { categories } = useCategories();

  // Category name map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  // ---------- Totals ----------
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const outstandingInvoices = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const netBalance = totalRevenue - totalExpenses;

  // ---------- Expense breakdown ----------
  const expensesByCategory = useMemo(() => {
    const agg: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = categoryMap.get(t.categoryId) || 'Uncategorized';
        agg[catName] = (agg[catName] || 0) + t.amount;
      });
    return agg;
  }, [transactions, categoryMap]);

  const expensePieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    id: name,
    name,
    value,
  }));
  const chartColors = ['#2d60ff', '#16dbcc', '#ffbb38', '#fe5c73', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  // ---------- Weekly Activity (Monday to Friday of current week) ----------
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekStart = getStartOfWeek(today, 1); // Monday
    const days: { name: string; dateStr: string }[] = [];
    const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    for (let i = 0; i < 5; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      days.push({ name: weekdayNames[i], dateStr: formatYMD(currentDate) });
    }

    return days.map(day => {
      const dayIncome = transactions
        .filter(t => t.type === 'income' && getTransactionDateStr(t.date) === day.dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && getTransactionDateStr(t.date) === day.dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        id: day.dateStr,
        name: day.name,
        Income: dayIncome,
        Expense: dayExpense,
      };
    });
  }, [transactions]);

  // ---------- Balance History (Monday to Sunday of current week, cumulative) ----------
  const weeklyBalanceHistory = useMemo(() => {
    const today = new Date();
    const weekStart = getStartOfWeek(today, 1); // Monday
    const days: { name: string; dateStr: string }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i <= 6; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      days.push({ name: dayNames[i], dateStr: formatYMD(currentDate) });
    }

    let runningBalance = 0;
    return days.map(day => {
      const income = transactions
        .filter(t => t.type === 'income' && getTransactionDateStr(t.date) === day.dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions
        .filter(t => t.type === 'expense' && getTransactionDateStr(t.date) === day.dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      runningBalance += income - expense;
      return {
        id: day.dateStr,
        name: day.name,
        Balance: runningBalance,
      };
    });
  }, [transactions]);

  // ---------- Recent transactions ----------
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const formatShortDate = (date: any) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AppLayout title="Overview">
      <div className="space-y-6">
        {/* Statistics Cards – unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#dcfaf8] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#16dbcc" strokeWidth="2" />
                  <path d="M2 17L12 22L22 17" stroke="#16dbcc" strokeWidth="2" />
                  <path d="M2 12L12 17L22 12" stroke="#16dbcc" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] text-[#718ebf] mb-1">Total Revenue</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">${totalRevenue.toLocaleString()}</p>
            <span className="text-[#16dbaa] text-[12px] font-medium">From income</span>
          </div>

          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#ffe0eb] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#fe5c73" strokeWidth="2" />
                  <path d="M12 8V16M8 12H16" stroke="#fe5c73" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] text-[#718ebf] mb-1">Total Expenses</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">${totalExpenses.toLocaleString()}</p>
            <span className="text-[#fe5c73] text-[12px] font-medium">From expenses</span>
          </div>

          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#fff5d9] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="#ffbb38" strokeWidth="2" />
                  <path d="M8 10H16M8 14H12" stroke="#ffbb38" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] text-[#718ebf] mb-1">Outstanding Invoices</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">${outstandingInvoices.toLocaleString()}</p>
            <span className="text-[#ffbb38] text-[12px] font-medium">{invoices.filter(inv => inv.status !== 'paid').length} pending</span>
          </div>

          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[50px] h-[50px] rounded-full bg-[#e7edff] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21M21 12C21 7.02944 16.9706 3 12 3M21 12H3M12 21C7.02944 21 3 16.9706 3 12M12 21C13.6569 21 15 16.9706 15 12C15 7.02944 13.6569 3 12 3M12 21C10.3431 21 9 16.9706 9 12C9 7.02944 10.3431 3 12 3M3 12C3 7.02944 7.02944 3 12 3" stroke="#2d60ff" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] text-[#718ebf] mb-1">Net Balance</p>
            <p className={`font-semibold text-[24px] ${netBalance >= 0 ? 'text-[#16dbaa]' : 'text-[#fe5c73]'}`}>
              ${netBalance.toLocaleString()}
            </p>
            <span className={`text-[12px] font-medium ${netBalance >= 0 ? 'text-[#16dbaa]' : 'text-[#fe5c73]'}`}>
              {netBalance >= 0 ? 'Positive' : 'Negative'}
            </span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity (Mon‑Fri) */}
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <h3 className="font-semibold text-[18px] text-[#343c6a] mb-4">Weekly Activity (Mon – Fri)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f5" />
                <XAxis dataKey="name" stroke="#718ebf" fontSize={12} />
                <YAxis stroke="#718ebf" fontSize={12} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Income" fill="#16dbcc" radius={[10, 10, 0, 0]} />
                <Bar dataKey="Expense" fill="#fe5c73" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {weeklyData.every(d => d.Income === 0 && d.Expense === 0) && (
              <p className="text-center text-[#8ba3cb] text-[12px] mt-2">
                No transactions this week. Add income/expense with dates between {weeklyData[0]?.id} and {weeklyData[4]?.id}
              </p>
            )}
          </div>

          {/* Expense Pie Chart */}
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <h3 className="font-semibold text-[18px] text-[#343c6a] mb-4">Expense Breakdown</h3>
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {expensePieData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-[#718ebf]">No expense data</p>
              </div>
            )}
          </div>
        </div>

        {/* Balance History (Mon‑Sun cumulative) */}
        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <h3 className="font-semibold text-[18px] text-[#343c6a] mb-4">Balance History (Mon – Sun, cumulative)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyBalanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f5" />
              <XAxis dataKey="name" stroke="#718ebf" fontSize={12} />
              <YAxis stroke="#718ebf" fontSize={12} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="Balance" stroke="#2d60ff" strokeWidth={2} dot={{ fill: '#2d60ff', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <h3 className="font-semibold text-[18px] text-[#343c6a] mb-4">Recent Transactions</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[#f3f3f5] last:border-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-[45px] h-[45px] rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-[#dcfaf8]' : 'bg-[#ffe0eb]'
                    }`}>
                      {tx.type === 'income' ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 15V5M10 5L5 10M10 5L15 10" stroke="#16dbcc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 5V15M10 15L15 10M10 15L5 10" stroke="#fe5c73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[14px] text-[#343c6a]">{tx.description}</p>
                      <p className="text-[12px] text-[#718ebf]">
                        {categoryMap.get(tx.categoryId) || 'Uncategorized'} • {formatShortDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium text-[16px] ${tx.type === 'income' ? 'text-[#16dbaa]' : 'text-[#fe5c73]'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-[60px] h-[60px] rounded-full bg-[#f5f7fa] flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 26C20.6274 26 26 20.6274 26 14C26 7.37258 20.6274 2 14 2C7.37258 2 2 7.37258 2 14C2 20.6274 7.37258 26 14 26Z" stroke="#718EBF" strokeWidth="2" />
                  <path d="M14 10V18M10 14H18" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[#718ebf] text-[14px]">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}