import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Trash2, FileText, PlusCircle, Eye, Pencil } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { apiRequest } from "../lib/queryClient";

type InvoiceItemForm = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceForm = {
  customerId: string;
  issuedDate: string;
  dueDate: string;
  notes: string;
  items: InvoiceItemForm[];
};

const getTodayStr = () => new Date().toISOString().split("T")[0];

const EMPTY_ITEM: InvoiceItemForm = {
  description: "",
  quantity: "1",
  unitPrice: "",
};

const EMPTY_FORM: InvoiceForm = {
  customerId: "",
  issuedDate: getTodayStr(),
  dueDate: "",
  notes: "",
  items: [{ ...EMPTY_ITEM }],
};

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────
  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("/api/invoices");
      return res.json();
    },
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await apiRequest("/api/customers");
      return res.json();
    },
  });

  // ── Mutations ────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      const res = await apiRequest("/api/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (newInvoice) => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setOpen(false);
      setLocation(`/invoices/${newInvoice.id}`);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InvoiceForm }) => {
      const res = await apiRequest(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setOpen(false);
      setEditingId(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  // ── Helpers ──────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, items: [{ ...EMPTY_ITEM }] });
    setFormError("");
    setOpen(true);
  }

  async function openEdit(id: string) {
    setFormError("");
    setIsLoadingDetails(true);
    try {
      const res = await apiRequest(`/api/invoices/${id}`);
      const data = await res.json();
      
      setForm({
        customerId: data.customerId || "",
        issuedDate: data.issuedDate,
        dueDate: data.dueDate || "",
        notes: data.notes || "",
        items: data.items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      });
      setEditingId(id);
      setOpen(true);
    } catch (err) {
      setFormError("Failed to load invoice details");
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    // Validation
    if (!form.customerId) {
      setFormError("Please select a customer");
      return;
    }

    const validItems = form.items.filter((i) => i.description.trim() !== "");
    if (validItems.length === 0) {
      setFormError("Please add at least one item with a description");
      return;
    }

    for (const item of validItems) {
      if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        setFormError("All items must have a valid quantity");
        return;
      }
      if (isNaN(Number(item.unitPrice)) || Number(item.unitPrice) < 0) {
        setFormError("All items must have a valid unit price");
        return;
      }
    }
    
    if (editingId) {
      editMutation.mutate({ id: editingId, data: { ...form, items: validItems } });
    } else {
      createMutation.mutate({ ...form, items: validItems });
    }
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItemForm,
    value: string,
  ) {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  }

  function removeItem(index: number) {
    if (form.items.length <= 1) return;
    const newItems = [...form.items];
    newItems.splice(index, 1);
    setForm({ ...form, items: newItems });
  }

  const grandTotal = form.items.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.unitPrice) || 0;
    return sum + q * p;
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Invoices</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Create Invoice
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : invoices.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No invoices yet.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Create your first invoice
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Invoice #
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Issued Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    {inv.customerName || "Unknown Customer"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(inv.issuedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₦{Number(inv.total).toLocaleString('en-NG')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer hover:text-primary hover:bg-transparent"
                        onClick={() => setLocation(`/invoices/${inv.id}`)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer hover:text-primary hover:bg-transparent"
                        onClick={() => openEdit(inv.id)}
                        disabled={isLoadingDetails}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-customer">Customer *</Label>
                <select
                  id="inv-customer"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.customerId}
                  onChange={(e) =>
                    setForm({ ...form, customerId: e.target.value })
                  }
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-due-date">Due Date</Label>
                <Input
                  id="inv-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2 border rounded-lg p-4 bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Row
                </Button>
              </div>

              {/* Items Table Header */}
              <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground px-2">
                <div className="col-span-6">Description *</div>
                <div className="col-span-2 text-right">Qty *</div>
                <div className="col-span-3 text-right">Price *</div>
                <div className="col-span-1"></div>
              </div>

              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 mb-2 items-start"
                >
                  <div className="col-span-6">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", e.target.value)
                      }
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="col-span-3 relative">
                    <span className="absolute left-3 top-2 text-muted-foreground text-sm">
                      ₦
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(idx, "unitPrice", e.target.value)
                      }
                      required
                      className="pl-7 text-right"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      disabled={form.items.length <= 1}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t flex justify-between items-center px-2">
                <span className="font-semibold text-muted-foreground">
                  Grand Total:
                </span>
                <span className="font-bold text-xl">
                  ₦{grandTotal.toLocaleString('en-NG')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes / Terms</Label>
              <Input
                id="inv-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Thank you for your business."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || editMutation.isPending}>
                {editingId 
                  ? (editMutation.isPending ? "Updating…" : "Update Invoice")
                  : (createMutation.isPending ? "Creating…" : "Save Invoice")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
