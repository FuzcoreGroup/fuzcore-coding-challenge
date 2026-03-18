import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/services/api";
import invoicingImg from "@/assets/images/invoicing.jpg";
import { useLocation } from "wouter";

type InvoiceListItem = {
  invoiceId: string;
  invoiceNumber: number;
  status: "draft" | "sent" | "paid";
  issueDate: string; // YYYY-MM-DD
  dueDate: string | null;
  subtotal: number;
  tax: number;
  total: number;
  customerId: string;
  customerName: string | null;
};

type InvoicesListResponse = { items: InvoiceListItem[] };

type Customer = { id: string; name: string };

function toISOFromDateInput(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

export default function InvoicesPage() {
  const auth = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const [status, setStatus] = useState<"" | "draft" | "sent" | "paid">("");
  const invoicesQueryKey = useMemo(() => ["invoices", { status }], [status]);

  const invoicesQuery = useQuery<InvoicesListResponse>({
    queryKey: invoicesQueryKey,
    enabled: !!token,
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      const qsStr = qs.toString();
      return apiFetch<InvoicesListResponse>(`/api/invoices${qsStr ? `?${qsStr}` : ""}`, token);
    },
  });

  const customersQuery = useQuery<{ items: Customer[] }>({
    queryKey: ["customers_dropdown_invoices"],
    enabled: !!token,
    queryFn: async () => apiFetch<{ items: Customer[] }>(`/api/customers?pageSize=200`, token),
  });

  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      if (!customerId) throw new Error("Select a customer");

      const payload: any = {
        customerId,
        issueDate: toISOFromDateInput(issueDate),
        tax: tax,
        notes: notes || undefined,
        items: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };

      if (dueDate) payload.dueDate = toISOFromDateInput(dueDate);

      return apiFetch(`/api/invoices`, token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setError(null);
      setCustomerId("");
      setDueDate("");
      setTax(0);
      setNotes("");
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => setError((err as Error).message),
  });

  const updateStatus = useMutation({
    mutationFn: async (args: { invoiceId: string; status: "draft" | "sent" | "paid" }) => {
      if (!token) throw new Error("Not authenticated");
      return apiFetch(`/api/invoices/${args.invoiceId}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: args.status }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="rounded-lg border overflow-hidden">
        <div className="relative">
          <img src={invoicingImg} alt="Invoicing" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-6 bottom-3 text-white">
            <h1 className="text-2xl font-bold">Invoices</h1>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-muted-foreground">Create invoices and update status through draft → sent → paid.</p>
        </div>

        <label className="flex flex-col gap-1 w-56">
          <span className="text-sm text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-10 rounded-md border px-3 bg-background"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">Create invoice</h2>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Customer</span>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="">Select...</option>
                  {customersQuery.data?.items?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Issue date</span>
                <input value={issueDate} onChange={(e) => setIssueDate(e.target.value)} type="date" className="h-10 rounded-md border px-3 bg-background" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Due date (optional)</span>
                <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="h-10 rounded-md border px-3 bg-background" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Tax amount</span>
                <input
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                  type="number"
                  step="0.01"
                  className="h-10 rounded-md border px-3 bg-background"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Notes (optional)</span>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-10 rounded-md border px-3 bg-background" />
              </label>

              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Line items</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
                    }}
                  >
                    + Add
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {items.map((it, idx) => (
                    <div key={idx} className="border rounded-lg p-3 flex flex-col gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Description</span>
                        <input
                          value={it.description}
                          onChange={(e) => {
                            const v = e.target.value;
                            setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, description: v } : p)));
                          }}
                          className="h-10 rounded-md border px-3 bg-background"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">Qty</span>
                          <input
                            type="number"
                            step="1"
                            value={it.quantity}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: v } : p)));
                            }}
                            className="h-10 rounded-md border px-3 bg-background"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">Unit price</span>
                          <input
                            type="number"
                            step="0.01"
                            value={it.unitPrice}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unitPrice: v } : p)));
                            }}
                            className="h-10 rounded-md border px-3 bg-background"
                          />
                        </label>
                      </div>

                      {items.length > 1 ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setItems((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {error ? <div className="text-sm text-destructive">{error}</div> : null}

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  createInvoice.mutate();
                }}
                disabled={createInvoice.isPending}
              >
                {createInvoice.isPending ? "Creating..." : "Create invoice"}
              </Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">Invoices</h2>

            {invoicesQuery.isLoading ? <div>Loading...</div> : null}
            {invoicesQuery.error ? <div className="text-sm text-destructive">Failed to load</div> : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Issue</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesQuery.data?.items?.map((inv) => (
                    <tr key={inv.invoiceId} className="border-t">
                      <td className="py-2 font-mono">#{inv.invoiceNumber}</td>
                      <td className="py-2">{inv.customerName ?? "—"}</td>
                      <td className="py-2">{inv.issueDate}</td>
                      <td className="py-2 capitalize">{inv.status}</td>
                      <td className="py-2 text-right font-mono">{inv.total.toFixed(2)}</td>
                      <td className="py-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/invoices/${inv.invoiceId}`)}
                          >
                            View
                          </Button>

                          {inv.status === "draft" ? (
                            <Button
                              size="sm"
                              onClick={() => updateStatus.mutate({ invoiceId: inv.invoiceId, status: "sent" })}
                              disabled={updateStatus.isPending}
                            >
                              Send
                            </Button>
                          ) : inv.status === "sent" ? (
                            <Button
                              size="sm"
                              onClick={() => updateStatus.mutate({ invoiceId: inv.invoiceId, status: "paid" })}
                              disabled={updateStatus.isPending}
                            >
                              Mark paid
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!invoicesQuery.data?.items?.length && !invoicesQuery.isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-muted-foreground">
                        No invoices found.
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

