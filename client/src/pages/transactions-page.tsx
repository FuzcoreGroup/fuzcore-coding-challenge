import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Pencil,
  Upload,
} from "lucide-react";
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

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type Transaction = {
  id: string;
  amount: string;
  type: "income" | "expense";
  categoryId: string | null;
  customerId: string | null;
  invoiceId: string | null;
  description: string | null;
  date: string;
};

type TransactionForm = {
  amount: string;
  type: "income" | "expense";
  categoryId: string;
  customerId: string;
  invoiceId: string;
  description: string;
  date: string;
};

const getTodayStr = () => new Date().toISOString().split("T")[0];

const EMPTY_FORM: TransactionForm = {
  amount: "",
  type: "expense",
  categoryId: "",
  customerId: "",
  invoiceId: "",
  description: "",
  date: getTodayStr(),
};

export default function TransactionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState("");
  const [suggestion, setSuggestion] = useState<{ id: string; name: string } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // ── Queries ──────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("/api/categories");
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

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("/api/invoices");
      return res.json();
    },
  });

  const queryParams = new URLSearchParams();
  if (filterType !== "all") queryParams.set("type", filterType);
  if (filterCategory !== "all") queryParams.set("categoryId", filterCategory);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", queryParams.toString()],
    queryFn: async () => {
      const res = await apiRequest(
        `/api/transactions?${queryParams.toString()}`,
      );
      return res.json();
    },
  });

  // ── Mutations ────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: TransactionForm) => {
      const res = await apiRequest("/api/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      closeDialog();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TransactionForm }) => {
      const res = await apiRequest(`/api/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      closeDialog();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/transactions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setDeleteConfirm(null);
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/transactions", { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to import CSV");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setImportResult(data);
    },
    onError: (err: Error) => alert(err.message),
  });

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    importMutation.mutate(importFile);
  };

  // ── Helpers ──────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSuggestion(null);
    setIsSuggesting(false);
    setOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id);
    setForm({
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId || "",
      customerId: tx.customerId || "",
      invoiceId: tx.invoiceId || "",
      description: tx.description || "",
      date: tx.date,
    });
    setFormError("");
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSuggestion(null);
    setIsSuggesting(false);
  }

  async function handleDescriptionBlur() {
    if (!form.description || form.categoryId) return; // Don't suggest if category is already selected or description is empty

    setIsSuggesting(true);
    setSuggestion(null);
    try {
      const res = await apiRequest("/api/ai/suggest-category", {
        method: "POST",
        body: JSON.stringify({
          description: form.description,
          type: form.type,
        }),
      });
      const data = await res.json();
      if (data.suggestedCategoryId && data.suggestedCategoryName) {
        setSuggestion({
          id: data.suggestedCategoryId,
          name: data.suggestedCategoryName,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setFormError("Please enter a valid amount");
      return;
    }
    if (!form.date) {
      setFormError("Date is required");
      return;
    }
    if (editingId) {
      editMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const getCategoryName = (id: string | null) => {
    if (!id) return "Uncategorized";
    return categories.find((c) => c.id === id)?.name || "Uncategorized";
  };

  const getCustomerName = (id: string | null) => {
    if (!id) return "—";
    return customers.find((c) => c.id === id)?.name || "Unknown Customer";
  };

  const getInvoiceNumber = (id: string | null) => {
    if (!id) return "—";
    return (
      invoices.find((i) => i.id === id)?.invoiceNumber || "Unknown Invoice"
    );
  };

  const formCategories = categories.filter((c) => c.type === form.type);
  const filterCategories =
    filterType === "all"
      ? categories
      : categories.filter((c) => c.type === filterType);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Transactions</h1>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <Button 
              variant="ghost" 
              className="text-destructive hover:bg-destructive/10"
              onClick={() => {
                if(confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) {
                  clearAllMutation.mutate();
                }
              }}
              disabled={clearAllMutation.isPending}
            >
              {clearAllMutation.isPending ? "Clearing..." : "Clear All"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 bg-card border rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground whitespace-nowrap">
            Type
          </Label>
          <select
            className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setFilterCategory("all"); // reset category filter when type changes
            }}
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground whitespace-nowrap">
            Category
          </Label>
          <select
            className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {filterCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : transactions.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No transactions found.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Add a transaction
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Description
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Invoice
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {tx.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      {getCategoryName(tx.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getCustomerName(tx.customerId)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tx.invoiceId ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 px-2.5 py-0.5 text-xs font-semibold">
                        {getInvoiceNumber(tx.invoiceId)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium flex items-center justify-end gap-1 ${tx.type === "income" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                  >
                    {tx.type === "income" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    ₦{Number(tx.amount).toLocaleString('en-NG')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(tx)}
                        title="Edit transaction"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(tx)}
                        title="Delete transaction"
                        className="h-8 w-8 text-destructive hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
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
      <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex rounded-lg border border-border p-1 bg-muted/30">
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, type: "income", categoryId: "" })
                }
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  form.type === "income"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, type: "expense", categoryId: "" })
                }
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  form.type === "expense"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Expense
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-category">Category</Label>
              <select
                id="tx-category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">Select category...</option>
                {formCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {isSuggesting && (
                <div className="text-xs flex items-center text-muted-foreground mt-1">
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  AI is analyzing...
                </div>
              )}
              {suggestion && !form.categoryId && (
                <div className="text-xs flex items-center text-primary mt-1 bg-primary/10 px-2 py-1.5 rounded-md inline-flex">
                  <span className="mr-2">
                    AI suggests: <strong>{suggestion.name}</strong>
                  </span>
                  <button
                    type="button"
                    className="font-semibold underline hover:text-primary/80"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, categoryId: suggestion.id }));
                      setSuggestion(null);
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-customer">Customer</Label>
              <select
                id="tx-customer"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.customerId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerId: e.target.value,
                    invoiceId: "",
                  })
                }
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
              <Label htmlFor="tx-invoice">Invoice</Label>
              <select
                id="tx-invoice"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.invoiceId}
                onChange={(e) =>
                  setForm({ ...form, invoiceId: e.target.value })
                }
              >
                <option value="">Select invoice...</option>
                {invoices
                  .filter(
                    (inv) =>
                      !form.customerId || inv.customerId === form.customerId,
                  )
                  .map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber}{" "}
                      {inv.customerName && !form.customerId
                        ? `(${inv.customerName})`
                        : ""}{" "}
                      - {inv.status}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-desc">Description</Label>
              <Input
                id="tx-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                onBlur={handleDescriptionBlur}
                placeholder="What was this for?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-date">Date *</Label>
              <Input
                id="tx-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || editMutation.isPending}
              >
                {editingId
                  ? editMutation.isPending
                    ? "Saving…"
                    : "Save Changes"
                  : createMutation.isPending
                    ? "Adding…"
                    : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this transaction for{" "}
            <span className="font-semibold text-foreground">
              ₦
              {deleteConfirm ? Number(deleteConfirm.amount).toLocaleString('en-NG') : "0.00"}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteConfirm && deleteMutation.mutate(deleteConfirm.id)
              }
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importOpen} onOpenChange={(v) => {
        if(!v) {
          setImportOpen(false);
          setImportFile(null);
          setImportResult(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Transactions from CSV</DialogTitle>
          </DialogHeader>
          
          {!importResult ? (
            <form onSubmit={handleImport} className="space-y-4">
              <div className="bg-muted p-3 rounded-md text-xs space-y-1">
                <p className="font-semibold">Required CSV format (with headers):</p>
                <code className="block bg-background p-1.5 rounded border">
                  date,description,amount,type,category
                </code>
                <p className="text-muted-foreground mt-2 italic">Example:</p>
                <code className="block bg-background p-1.5 rounded border">
                  2024-01-15,Office Rent,1500,expense,Rent
                </code>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={importMutation.isPending || !importFile}>
                  {importMutation.isPending ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
                <p className="font-bold">Import Complete!</p>
                <p>Successfully imported {importResult.imported} transactions.</p>
                {importResult.errors.length > 0 && (
                  <p className="mt-1">{importResult.errors.length} rows had errors and were skipped.</p>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Errors:</p>
                  <div className="max-h-40 overflow-y-auto text-xs space-y-1 bg-red-50 p-3 rounded border border-red-100 text-red-700">
                    {importResult.errors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setImportOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
