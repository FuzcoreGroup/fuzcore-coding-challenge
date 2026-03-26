import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { Pagination } from "@/components/Pagination";
import { Plus, FileText, Download } from "lucide-react";

interface Customer {
  id: string;
  name: string;
}

interface InvoiceItem {
  id: string;
  name: string;
  amount: number;
}

interface Invoice {
  id: string;
  customerName: string;
  customerId: string;
  status: "draft" | "sent" | "paid";
  createdAt: string;
  items?: InvoiceItem[];
  amount?: number;
  paymentUrl?: string;
}

interface InvoicesResponse {
  data: Invoice[];
  totalData: number;
  totalPages: number;
  page: number;
  pageLength: number;
}

// Mock catalogue — each item has a preset unit amount the user can override
const MOCK_ITEMS: Omit<InvoiceItem, "amount">[] = [
  { id: "item-1", name: "Web Development" },
  { id: "item-2", name: "UI/UX Design" },
  { id: "item-3", name: "Consulting" },
  { id: "item-4", name: "Support & Maintenance" },
  { id: "item-5", name: "SEO Optimization" },
];

function fmt(val: number) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── PDF generation (no external lib, uses browser print) ───────────────────
function generateInvoicePDF(invoice: Invoice) {
  const itemRows = (invoice.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">${item.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">
          ₦${fmt(item.amount ?? 0)}
        </td>
      </tr>`,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${invoice.id.slice(0, 8).toUpperCase()}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', sans-serif; color:#1a1a1a; background:#fff; padding:48px; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
        .logo { font-size:22px; font-weight:700; color:#246052; }
        .logo span { font-weight:300; color:#999; margin-left:4px; }
        .badge { background:#24605215; color:#246052; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
        .meta { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px; }
        .meta-block label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#999; display:block; margin-bottom:4px; }
        .meta-block p { font-size:14px; color:#333; }
        table { width:100%; border-collapse:collapse; margin-bottom:24px; }
        thead tr { background:#24605208; }
        thead th { padding:10px 12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#246052; }
        thead th:last-child { text-align:right; }
        .total-row td { padding:14px 12px; font-weight:700; font-size:15px; border-top:2px solid #246052; }
        .total-row td:last-child { text-align:right; color:#246052; }
        .payment-url { margin-top:24px; padding:14px 16px; background:#24605210; border-radius:10px; }
        .payment-url label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#246052; display:block; margin-bottom:4px; }
        .payment-url a { font-size:13px; color:#246052; word-break:break-all; }
        .footer { margin-top:48px; text-align:center; font-size:11px; color:#bbb; }
        @media print { body { padding:32px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">FuzCore<span>LTD</span></div>
        <span class="badge">${invoice.status}</span>
      </div>
      <div class="meta">
        <div class="meta-block">
          <label>Invoice ID</label>
          <p>${invoice.id}</p>
        </div>
        <div class="meta-block">
          <label>Date</label>
          <p>${formatDate(invoice.createdAt)}</p>
        </div>
        <div class="meta-block">
          <label>Customer</label>
          <p>${invoice.customerName}</p>
        </div>
        <div class="meta-block">
          <label>Total Amount</label>
          <p style="font-size:18px;font-weight:700;color:#246052;">₦${fmt(invoice.amount ?? 0)}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>Total</td>
            <td>₦${fmt(invoice.amount ?? 0)}</td>
          </tr>
        </tfoot>
      </table>
      ${
        invoice.paymentUrl
          ? `
        <div class="payment-url">
          <label>Payment Link</label>
          <a href="${invoice.paymentUrl}">${invoice.paymentUrl}</a>
        </div>`
          : ""
      }
      <div class="footer">Generated by FuzCore LTD · ${new Date().toLocaleDateString()}</div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Invoices() {
  const { authHeaders } = useAuth();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageLength, setPageLength] = useState(10);

  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  // itemAmounts: { [itemId]: amount }
  const [itemAmounts, setItemAmounts] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery<InvoicesResponse>({
    queryKey: ["/api/invoices", page, pageLength],
    queryFn: async () => {
      const res = await fetch(
        `/api/invoices?page=${page}&pageLength=${pageLength}`,
        { headers: authHeaders() },
      );
      const json = await res.json();
      return json;
    },
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers/all"],
    queryFn: async () => {
      const res = await fetch("/api/customers", {
        headers: authHeaders(),
      });
      const json = await res.json();
      return json.data;
    },
    enabled: createOpen,
  });

  const invoices = data?.data ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: (updated: Invoice) => {
      qc.setQueryData<InvoicesResponse>(
        ["/api/invoices", page, pageLength],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((inv) =>
              inv.id === updated.id ? updated : inv,
            ),
          };
        },
      );
      setViewInvoice(updated);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      customerId: string;
      items: InvoiceItem[];
      amount: number;
      status: string;
    }) =>
      fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: (newInvoice: Invoice) => {
      // Push to top of current page cache
      qc.setQueryData<InvoicesResponse>(
        ["/api/invoices", page, pageLength],
        (old) => {
          if (!old)
            return {
              data: [newInvoice],
              totalData: 1,
              totalPages: 1,
              page: 1,
              pageLength,
            };

          const updatedTotalData = old.totalData + 1;
          const updatedTotalPages = Math.max(
            1,
            Math.ceil(updatedTotalData / pageLength),
          );

          return {
            ...old,
            data: [newInvoice, ...old.data],
            totalData: updatedTotalData,
            totalPages: updatedTotalPages,
          };
        },
      );
      closeCreate();
    },
    onError: () => setFormError("Failed to create invoice"),
  });

  const closeCreate = () => {
    setCreateOpen(false);
    setSelectedCustomerId("");
    setSelectedItems([]);
    setItemAmounts({});
    setFormError("");
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const totalAmount = selectedItems.reduce(
    (sum, id) => sum + (itemAmounts[id] ?? 0),
    0,
  );

  const handleCreate = (status: "draft" | "sent") => {
    if (!selectedCustomerId) {
      setFormError("Please select a customer");
      return;
    }
    if (selectedItems.length === 0) {
      setFormError("Please select at least one item");
      return;
    }
    const hasZeroAmount = selectedItems.some(
      (id) => !itemAmounts[id] || itemAmounts[id] <= 0,
    );
    if (hasZeroAmount) {
      setFormError("Please enter an amount for each selected item");
      return;
    }

    const items: InvoiceItem[] = selectedItems.map((id) => {
      const meta = MOCK_ITEMS.find((m) => m.id === id)!;
      return { id, name: meta.name, amount: itemAmounts[id] ?? 0 };
    });

    createMutation.mutate({
      customerId: selectedCustomerId,
      items,
      amount: totalAmount,
      status,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Invoices</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Track and manage invoices
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl gap-2"
        >
          <Plus size={16} /> New Invoice
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#24605208] border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider w-12">
                  S/N
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider hidden sm:table-cell">
                  Created
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(pageLength)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-gray-400">
                    <FileText size={36} className="mx-auto mb-2 opacity-30" />
                    <p>No invoices yet. Create your first one.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-50 hover:bg-[#24605205] transition-colors"
                  >
                    <td className="px-5 py-4 text-gray-400">
                      {(page - 1) * pageLength + idx + 1}
                    </td>
                    <td
                      className="px-5 py-4 font-medium text-gray-800 cursor-pointer hover:text-[#246052]"
                      onClick={() => setViewInvoice(inv)}
                    >
                      {inv.customerName}
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td
                      className="px-5 py-4"
                      onClick={() => setViewInvoice(inv)}
                    >
                      <StatusPill status={inv.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View invoice"
                          onClick={() => setViewInvoice(inv)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#246052] hover:bg-[#24605210] transition-colors"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          title="Export PDF"
                          onClick={() => generateInvoicePDF(inv)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#246052] hover:bg-[#24605210] transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100">
          <Pagination
            page={page}
            pageLength={pageLength}
            totalData={totalData}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageLengthChange={(len) => {
              setPageLength(len);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── View Invoice Modal ── */}
      <Modal
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title="Invoice Details"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <Button
              variant="outline"
              onClick={() => viewInvoice && generateInvoicePDF(viewInvoice)}
              className="rounded-xl gap-2 border-[#246052] text-[#246052] hover:bg-[#24605210]"
            >
              <Download size={14} /> Export PDF
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setViewInvoice(null)}
                className="rounded-xl"
              >
                Close
              </Button>
              {viewInvoice?.status === "draft" && (
                <Button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: viewInvoice.id,
                      status: "sent",
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                  className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl"
                >
                  {updateStatusMutation.isPending
                    ? "Updating…"
                    : "Update to Sent"}
                </Button>
              )}
              {viewInvoice?.status === "sent" && (
                <Button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: viewInvoice.id,
                      status: "paid",
                    })
                  }
                  disabled={updateStatusMutation.isPending}
                  className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl"
                >
                  {updateStatusMutation.isPending
                    ? "Updating…"
                    : "Clear Invoice"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {viewInvoice && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                  Customer
                </p>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {viewInvoice.customerName}
                </p>
              </div>
              <StatusPill status={viewInvoice.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                  Date
                </p>
                <p className="text-gray-800 mt-0.5 text-sm">
                  {formatDate(viewInvoice.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                  Total Amount
                </p>
                <p className="text-[#246052] font-bold text-lg mt-0.5">
                  ₦{fmt(viewInvoice.amount ?? 0)}
                </p>
              </div>
            </div>
            {viewInvoice.items && viewInvoice.items.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">
                  Items
                </p>
                <div className="space-y-1.5">
                  {viewInvoice.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#246052] flex-shrink-0" />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        ₦{fmt(item.amount ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewInvoice.paymentUrl && (
              <div className="bg-[#24605210] rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
                  Payment Link
                </p>
                <a
                  href={viewInvoice.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#246052] text-sm hover:underline break-all font-medium"
                >
                  {viewInvoice.paymentUrl}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Create Invoice Modal ── */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="New Invoice"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <Button
              variant="outline"
              onClick={() => handleCreate("draft")}
              disabled={createMutation.isPending}
              className="rounded-xl"
            >
              Save as Draft
            </Button>
            <div className="flex items-center gap-3">
              {selectedItems.length > 0 && (
                <span className="text-sm font-semibold text-[#246052]">
                  Total: ₦{fmt(totalAmount)}
                </span>
              )}
              <Button
                onClick={() => handleCreate("sent")}
                disabled={createMutation.isPending}
                className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl"
              >
                {createMutation.isPending ? "Saving…" : "Save Invoice"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setFormError("");
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Items & Amounts
            </label>
            <div className="space-y-2">
              {MOCK_ITEMS.map((item) => {
                const checked = selectedItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border transition-all ${
                      checked
                        ? "border-[#246052] bg-[#24605208]"
                        : "border-gray-200"
                    }`}
                  >
                    <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          toggleItem(item.id);
                          setFormError("");
                        }}
                        className="accent-[#246052] mt-0.5 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {item.name}
                      </span>
                    </label>
                    {checked && (
                      <div className="px-4 pb-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                            ₦
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={itemAmounts[item.id] || ""}
                            onChange={(e) => {
                              setItemAmounts((prev) => ({
                                ...prev,
                                [item.id]: parseFloat(e.target.value) || 0,
                              }));
                              setFormError("");
                            }}
                            placeholder="0.00"
                            className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {formError && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
              {formError}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
