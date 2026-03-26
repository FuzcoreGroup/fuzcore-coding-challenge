import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardValue } from "@/components/Card";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface DashboardData {
  totalRevenue: number;
  totalExpense: number;
  outstandingInvoice: number;
}

function fmt(val: number) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export default function Dashboard() {
  const { authHeaders } = useAuth();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: () =>
      fetch("/api/dashboard/", { headers: authHeaders() }).then((r) =>
        r.json(),
      ),
  });

  const stats = [
    {
      title: "Total Revenue",
      value: isLoading ? "—" : fmt(data?.totalRevenue ?? 0),
      prefix: "₦",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      title: "Total Expense",
      value: isLoading ? "—" : fmt(data?.totalExpense ?? 0),
      prefix: "₦",
      icon: TrendingDown,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      title: "Outstanding Invoice",
      value: isLoading ? "—" : fmt(data?.outstandingInvoice ?? 0),
      prefix: "₦",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Your financial overview at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ title, value, prefix, icon: Icon, color, bg }) => (
          <Card key={title}>
            <div className="flex items-start justify-between">
              <div>
                <CardHeader title={title} />
                <CardValue value={value} prefix={prefix} />
              </div>
              <div className={`p-2.5 rounded-xl ${bg}`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
