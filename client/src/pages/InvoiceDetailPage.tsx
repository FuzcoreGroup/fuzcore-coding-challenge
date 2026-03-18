import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

type InvoiceDetail = {
  invoice: {
    id: string;
    userId: string;
    customerId: string;
    invoiceNumber: number;
    status: "draft" | "sent" | "paid";
    issueDate: string; // YYYY-MM-DD
    dueDate: string | null;
    subtotal: number;
    tax: number;
    total: number;
    notes: string | null;
  };
  items: Array<{
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
};

function parseInvoiceId(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  // expected: ["invoices", "<id>"]
  if (parts.length !== 2) return null;
  if (parts[0] !== "invoices") return null;
  return parts[1] || null;
}

export default function InvoiceDetailPage() {
  const auth = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const qc = useQueryClient();
  const [location, setLocation] = useLocation();

  const invoiceId = useMemo(() => parseInvoiceId(location), [location]);

  const detailQuery = useQuery<InvoiceDetail>({
    queryKey: ["invoice", invoiceId],
    enabled: !!token && !!invoiceId,
    queryFn: async () => apiFetch<InvoiceDetail>(`/api/invoices/${invoiceId}`, token),
  });

  const updateStatus = useMutation({
    mutationFn: async (nextStatus: "draft" | "sent" | "paid") => {
      if (!token || !invoiceId) throw new Error("Not authenticated");
      return apiFetch<unknown>(`/api/invoices/${invoiceId}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async () => {
      if (!token || !invoiceId) throw new Error("Not authenticated");
      return apiFetch<unknown>(`/api/invoices/${invoiceId}`, token, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      // navigation is intentionally not handled here; the parent/list route can be clicked.
    },
  });

  const inv = detailQuery.data?.invoice;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Invoice #{inv?.invoiceNumber ?? "—"}</h1>
          <p className="text-muted-foreground">
            Status: <span className="capitalize">{inv?.status ?? "—"}</span>
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setLocation("/invoices");
            }}
          >
            Back to invoices
          </Button>
        </div>
      </div>

      {detailQuery.isLoading ? <div className="mt-6">Loading...</div> : null}
      {detailQuery.error ? <div className="mt-6 text-sm text-destructive">Failed to load invoice.</div> : null}

      {!detailQuery.isLoading && inv ? (
        <>
          <div className="mt-6 rounded-lg border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Issue date</div>
                <div className="font-medium">{inv.issueDate}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Due date</div>
                <div className="font-medium">{inv.dueDate ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Customer ID</div>
                <div className="font-mono text-sm">{inv.customerId}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="font-medium">{inv.notes ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 p-3">Description</th>
                  <th className="pb-2 p-3">Qty</th>
                  <th className="pb-2 p-3">Unit price</th>
                  <th className="pb-2 p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {detailQuery.data?.items?.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-3">{it.description}</td>
                    <td className="p-3">{it.quantity}</td>
                    <td className="p-3 font-mono">{it.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">{it.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {detailQuery.data?.items?.length ? null : (
                  <tr>
                    <td colSpan={4} className="py-6 px-3 text-muted-foreground">
                      No line items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Subtotal</div>
              <div className="text-2xl font-mono mt-2">{inv.subtotal.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Tax</div>
              <div className="text-2xl font-mono mt-2">{inv.tax.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-mono mt-2">{inv.total.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {inv.status === "draft" ? (
              <>
                <Button
                  onClick={() => updateStatus.mutate("sent")}
                  disabled={updateStatus.isPending}
                >
                  Send (draft to sent)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Delete this draft invoice?")) deleteInvoice.mutate();
                  }}
                  disabled={deleteInvoice.isPending}
                >
                  Delete draft
                </Button>
              </>
            ) : null}

            {inv.status === "sent" ? (
              <Button
                onClick={() => updateStatus.mutate("paid")}
                disabled={updateStatus.isPending}
              >
                Mark paid (sent to paid)
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

