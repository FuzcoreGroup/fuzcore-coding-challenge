import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/services/api";
import expensesImg from "@/assets/images/expenses.jpg";

type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  customerId: string | null;
};

type TransactionsListResponse = {
  items: Transaction[];
};

type Customer = {
  id: string;
  name: string;
};

function toISOFromDateInput(dateStr: string) {
  // Treat date input as UTC midnight to avoid timezone day-shifts.
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

export default function TransactionsPage() {
  const auth = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const qc = useQueryClient();

  const [type, setType] = useState<"" | "income" | "expense">("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const listQueryKey = useMemo(() => ["transactions", { type, category }], [type, category]);

  const listQuery = useQuery<TransactionsListResponse>({
    queryKey: listQueryKey,
    enabled: !!token,
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (type) qs.set("type", type);
      if (category.trim()) qs.set("category", category.trim());
      const qsStr = qs.toString();
      const url = `/api/transactions${qsStr ? `?${qsStr}` : ""}`;
      return apiFetch<TransactionsListResponse>(url, token);
    },
  });

  const customersQuery = useQuery<{ items: Customer[] }>({
    queryKey: ["customers_dropdown"],
    enabled: !!token,
    queryFn: async () =>
      apiFetch<{ items: Customer[] }>(`/api/customers?pageSize=200`, token),
  });

  const [amount, setAmount] = useState<number>(0);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [customerId, setCustomerId] = useState<string>(""); // empty means none

  const [error, setError] = useState<string | null>(null);

  const createTransaction = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      const payload = {
        amount,
        type: txType,
        category: txCategory,
        description: txDescription || "",
        date: toISOFromDateInput(date),
        customerId: customerId ? customerId : null,
      };
      return apiFetch(`/api/transactions`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setError(null);
      setAmount(0);
      setTxCategory("");
      setTxDescription("");
      setCustomerId("");
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err) => setError((err as Error).message),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="rounded-lg border overflow-hidden">
        <div className="relative">
          <img src={expensesImg} alt="Expenses" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-6 bottom-3 text-white">
            <h1 className="text-2xl font-bold">Transactions</h1>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mt-6">
        <div>
          <p className="text-muted-foreground">Record income and expenses, and filter by type/category.</p>
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="h-10 rounded-md border px-3 bg-background"
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Category</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-md border px-3 bg-background"
              placeholder="e.g. rent"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">Add transaction</h2>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Amount</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="h-10 rounded-md border px-3 bg-background"
                  type="number"
                  step="0.01"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Type</span>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Category</span>
                <input
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="h-10 rounded-md border px-3 bg-background"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Description (optional)</span>
                <input
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="h-10 rounded-md border px-3 bg-background"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Date</span>
                <input value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-md border px-3 bg-background" type="date" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Customer (optional)</span>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="">None</option>
                  {customersQuery.data?.items?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              {error ? <div className="text-sm text-destructive">{error}</div> : null}

              <Button onClick={(e) => { e.preventDefault(); createTransaction.mutate(); }} disabled={createTransaction.isPending}>
                {createTransaction.isPending ? "Saving..." : "Add"}
              </Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">Transactions</h2>

            {listQuery.isLoading ? <div>Loading...</div> : null}
            {listQuery.error ? <div className="text-sm text-destructive">Failed to load</div> : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {listQuery.data?.items?.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2">{t.date}</td>
                      <td className="py-2 capitalize">{t.type}</td>
                      <td className="py-2">{t.category}</td>
                      <td className="py-2">{t.description ?? "—"}</td>
                      <td className="py-2 text-right font-mono">{t.type === "income" ? "+" : "-"}{t.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {!listQuery.data?.items?.length && !listQuery.isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-muted-foreground">
                        No transactions found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

