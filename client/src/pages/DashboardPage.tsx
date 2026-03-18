import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import accountingImg from "@/assets/images/accounting.jpg";
import officeImg from "@/assets/images/office.jpg";
import invoicingImg from "@/assets/images/invoicing.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DashboardPage() {
  const auth = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const to = new Date();
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const summaryQuery = useQuery({
    queryKey: ["/api/transactions/summary", { fromStr, toStr }],
    enabled: !!token,
    queryFn: () =>
      apiFetch<{ income: number; expense: number }>(
        `/api/transactions/summary?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`,
        token,
      ),
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="rounded-lg border overflow-hidden">
        <div className="relative">
          <img src={accountingImg} alt="Accounting overview" className="w-full h-44 object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-6 bottom-4 right-6">
            <h1 className="text-2xl font-bold text-white">Overview</h1>
          </div>
        </div>
      </div>

      {auth.status === "authenticated" ? (
        <p className="text-muted-foreground mt-4">{auth.user.businessName}</p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Income (last 30 days)</div>
          <div className="text-3xl font-mono mt-2">
            {summaryQuery.data ? summaryQuery.data.income.toFixed(2) : "—"}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Expense (last 30 days)</div>
          <div className="text-3xl font-mono mt-2">
            {summaryQuery.data ? summaryQuery.data.expense.toFixed(2) : "—"}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Net</div>
          <div className="text-3xl font-mono mt-2">
            {summaryQuery.data ? (summaryQuery.data.income - summaryQuery.data.expense).toFixed(2) : "—"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="relative">
            <img src={officeImg} alt="Customers" className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute left-4 bottom-3 text-white">
              <div className="text-xl font-bold">Customers</div>
            </div>
          </div>
          <div className="p-4">
            <Link href="/customers">
              <Button size="sm" className="w-full">
                Manage customers
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="relative">
            <img src={invoicingImg} alt="Invoices" className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute left-4 bottom-3 text-white">
              <div className="text-xl font-bold">Invoices</div>
            </div>
          </div>
          <div className="p-4">
            <Link href="/invoices">
              <Button size="sm" className="w-full">
                Create & update invoices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

