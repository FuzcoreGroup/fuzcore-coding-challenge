import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  FileEdit,
  Send,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { apiRequest } from "../lib/queryClient";

type DashboardSummary = {
  totalRevenue: string;
  totalExpenses: string;
  netProfit: string;
  outstandingInvoices: string;
  recentTransactions: Array<{
    id: string;
    amount: string;
    type: "income" | "expense";
    date: string;
    description: string | null;
    categoryName: string;
  }>;
  invoiceStatusCounts: {
    draft: number;
    sent: number;
    paid: number;
  };
};

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      const res = await apiRequest("/api/dashboard/summary");
      return res.json();
    },
    refetchInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-destructive">
        Failed to load dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{Number(summary.totalRevenue).toLocaleString("en-NG")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{Number(summary.totalExpenses).toLocaleString("en-NG")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{Number(summary.netProfit).toLocaleString("en-NG")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Invoices
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{Number(summary.outstandingInvoices).toLocaleString("en-NG")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent transactions.
              </p>
            ) : (
              <div className="space-y-4">
                {summary.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {tx.description || tx.categoryName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()} •{" "}
                        {tx.categoryName}
                      </p>
                    </div>
                    <div
                      className={`font-medium ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}₦
                      {Number(tx.amount).toLocaleString("en-NG")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Invoices Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <FileEdit className="h-5 w-5 text-gray-500 mr-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Draft Invoices
                  </p>
                </div>
                <div className="font-medium">
                  {summary.invoiceStatusCounts.draft}
                </div>
              </div>
              <div className="flex items-center">
                <Send className="h-5 w-5 text-blue-500 mr-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Sent Invoices
                  </p>
                </div>
                <div className="font-medium">
                  {summary.invoiceStatusCounts.sent}
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Paid Invoices
                  </p>
                </div>
                <div className="font-medium">
                  {summary.invoiceStatusCounts.paid}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
