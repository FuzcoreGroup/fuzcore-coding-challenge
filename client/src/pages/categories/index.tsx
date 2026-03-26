import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface CategoryFormData {
  name: string;
  type: "income" | "expense";
}

export default function Categories() {
  const { authHeaders } = useAuth();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    type: "income",
  });
  const [formError, setFormError] = useState("");

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/category"],
    queryFn: async () => {
      const response = await fetch("/api/category", { headers: authHeaders() });
      const json = await response.json();
      return json.data; // Return just the data array
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      fetch("/api/category", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (newCat: Category) => {
      qc.setQueryData<Category[]>(["/api/category"], (old = []) => [
        ...old,
        newCat,
      ]);
      closeModal();
    },
    onError: () => setFormError("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CategoryFormData>;
    }) =>
      fetch(`/api/category/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (updated: Category) => {
      qc.setQueryData<Category[]>(["/api/category"], (old = []) =>
        old.map((c) => (c.id === updated.id ? updated : c)),
      );
      closeModal();
    },
    onError: () => setFormError("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/category/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),
    onSuccess: () => {
      qc.setQueryData<Category[]>(["/api/category"], (old = []) =>
        old.filter((c) => c.id !== deleteTarget?.id),
      );
      setDeleteTarget(null);
    },
  });

  const openNew = () => {
    setEditTarget(null);
    setForm({ name: "", type: "income" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({ name: cat.name, type: cat.type });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setFormError("");
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (editTarget) {
      updateMutation.mutate({
        id: editTarget.id,
        data: { name: form.name, type: form.type },
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Categories</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage income and expense categories
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl gap-2"
        >
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p>No categories yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      cat.type === "income"
                        ? "bg-[#24605215] text-[#246052]"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {cat.type}
                  </span>
                  <p className="text-gray-800 font-medium mt-2 text-sm">
                    {cat.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#246052] hover:bg-[#24605210] transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Edit Category" : "Add Category"}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={closeModal}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl"
            >
              {isPending
                ? "Saving…"
                : editTarget
                  ? "Save Changes"
                  : "Add Category"}
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
                })
              }
              disabled={!!editTarget}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30 disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setFormError("");
              }}
              placeholder="e.g. Salary, Rent, Utilities"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
            />
          </div>
          {formError && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
              {formError}
            </p>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold">"{deleteTarget?.name}"</span>? This
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
