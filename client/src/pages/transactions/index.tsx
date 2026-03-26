import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import { Plus, Upload, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  categoryId: string;
  categoryName: string;
  amount: number;
  description?: string;
  createdAt: string;
}

interface TransactionsResponse {
  data: Transaction[];
  totalData: number;
  totalPages: number;
  page: number;
  pageLength: number;
}

interface CreateTransactionPayload {
  amount: number;
  type: "income" | "expense";
  categoryId: string;
  description: string;
}

function fmt(val: number) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function truncate(str: string, n = 10) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export default function Transactions() {
  const { authHeaders } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [pageLength, setPageLength] = useState(10);

  const [filterType, setFilterType] = useState<"" | "income" | "expense">("");
  const [filterCategory, setFilterCategory] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const [form, setForm] = useState<CreateTransactionPayload>({
    amount: 0,
    type: "income",
    categoryId: "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  const buildParams = () => {
    const params = new URLSearchParams({
      page: String(page),
      pageLength: String(pageLength),
    });
    if (filterType) params.set("type", filterType);
    if (filterCategory) params.set("category", filterCategory);
    return params.toString();
  };

  const queryKey = [
    "/api/transactions",
    page,
    pageLength,
    filterType,
    filterCategory,
  ];

  const { data, isLoading } = useQuery<TransactionsResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/transactions?${buildParams()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      return json;
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/category"],
    queryFn: async () => {
      const res = await fetch("/api/category", {
        headers: authHeaders(),
      });
      const json = await res.json();
      return json.data;
    },
  });

  const transactions = data?.data ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const createMutation = useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      closeCreate();
    },
    onError: () => setFormError("Failed to create transaction"),
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      } else {
        setImportError("Import failed. Please check your CSV and try again.");
      }
    } catch {
      setImportError("Import failed. Please try again.");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setForm({ amount: 0, type: "income", categoryId: "", description: "" });
    setFormError("");
  };

  const handleSubmit = () => {
    if (!form.amount || form.amount <= 0) {
      setFormError("Enter a valid amount");
      return;
    }
    if (!form.categoryId) {
      setFormError("Please select a category");
      return;
    }
    createMutation.mutate(form);
  };

  const filteredCategoryOptions = filterType
    ? categories.filter((c) => c.type === filterType)
    : categories;

  const formCategoryOptions = form.type
    ? categories.filter((c) => c.type === form.type)
    : categories;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Your income and expense records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className="rounded-xl gap-2 border-[#246052] text-[#246052] hover:bg-[#24605210]"
          >
            <Upload size={15} />
            {importLoading ? "Importing…" : "Import CSV"}
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl gap-2"
          >
            <Plus size={16} /> Add Transaction
          </Button>
        </div>
      </div>

      {importError && (
        <p className="text-red-500 text-xs bg-red-50 px-4 py-2.5 rounded-xl mb-4 border border-red-100">
          {importError}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as "" | "income" | "expense");
            setFilterCategory("");
            setPage(1);
          }}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#246052]/30 bg-white"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#246052]/30 bg-white"
        >
          <option value="">All categories</option>
          {filteredCategoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {(filterType || filterCategory) && (
          <button
            onClick={() => {
              setFilterType("");
              setFilterCategory("");
              setPage(1);
            }}
            className="text-xs text-[#246052] hover:underline px-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#24605208] border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider w-12">
                  S/N
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider hidden sm:table-cell">
                  Category
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider">
                  Amount
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
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-gray-400">
                    <p>No transactions found.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-50 hover:bg-[#24605205] transition-colors"
                  >
                    <td className="px-5 py-4 text-gray-400">
                      {(page - 1) * pageLength + idx + 1}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {truncate(tx.id)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          tx.type === "income"
                            ? "bg-[#24605215] text-[#246052]"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRight size={12} />
                        ) : (
                          <ArrowDownRight size={12} />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 hidden sm:table-cell">
                      {tx.categoryName}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      <span
                        className={
                          tx.type === "income"
                            ? "text-[#246052]"
                            : "text-rose-500"
                        }
                      >
                        {tx.type === "income" ? "+" : "−"}₦{fmt(tx.amount)}
                      </span>
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

      {/* Create Transaction Modal */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Add Transaction"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={closeCreate}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl"
            >
              {createMutation.isPending ? "Saving…" : "Add Transaction"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "income" | "expense",
                  categoryId: "",
                })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
            >
              <option value="">Select category…</option>
              {formCategoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Amount (₦)
            </label>
            <input
              type="number"
              min={0}
              value={form.amount || ""}
              onChange={(e) =>
                setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Description{" "}
              <span className="text-gray-400 normal-case font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What is this transaction for?"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30 resize-none"
            />
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
