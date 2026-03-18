import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/services/api";
import reportsImg from "@/assets/images/reports.jpg";

export default function ReportsPage() {
  const auth = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;

  const { fromStr, toStr } = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const to = new Date();
    return { fromStr: from.toISOString().slice(0, 10), toStr: to.toISOString().slice(0, 10) };
  }, []);

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
          <img src={reportsImg} alt="Reports" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-6 bottom-3 text-white">
            <h1 className="text-2xl font-bold">Reports</h1>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mt-4">Income and expenses for the last 90 days.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Income</div>
          <div className="text-3xl font-mono mt-2">
            {summaryQuery.data ? summaryQuery.data.income.toFixed(2) : "—"}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Expenses</div>
          <div className="text-3xl font-mono mt-2">
            {summaryQuery.data ? summaryQuery.data.expense.toFixed(2) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

