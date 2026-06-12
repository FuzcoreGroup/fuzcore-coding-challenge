import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { apiRequest } from "../lib/queryClient";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingType, setAddingType] = useState<"income" | "expense" | null>(null);
  const [error, setError] = useState<string>("");

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("/api/categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string; type: "income" | "expense" }) => {
      const res = await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name, type }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      setAddingType(null);
      setNewCategoryName("");
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete category");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/categories"] });
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message);
      // Automatically clear error after 5 seconds
      setTimeout(() => setError(""), 5000);
    },
  });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !addingType) return;
    createMutation.mutate({ name: newCategoryName, type: addingType });
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading categories...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Tag className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Category Management</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Income Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold flex items-center text-green-600 dark:text-green-500">
              <ArrowUpRight className="w-5 h-5 mr-2" />
              Income
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setAddingType("income")}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {addingType === "income" && (
            <form onSubmit={handleAddCategory} className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border animate-in slide-in-from-top-2 fade-in duration-200">
              <Input
                autoFocus
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={createMutation.isPending || !newCategoryName.trim()}>
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingType(null); setNewCategoryName(""); setError(""); }}>
                Cancel
              </Button>
            </form>
          )}

          <div className="space-y-2">
            {incomeCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm italic py-4">No income categories found.</p>
            ) : (
              incomeCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                  <span className="font-medium text-sm">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold flex items-center text-red-600 dark:text-red-500">
              <ArrowDownRight className="w-5 h-5 mr-2" />
              Expense
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setAddingType("expense")}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {addingType === "expense" && (
            <form onSubmit={handleAddCategory} className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border animate-in slide-in-from-top-2 fade-in duration-200">
              <Input
                autoFocus
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={createMutation.isPending || !newCategoryName.trim()}>
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingType(null); setNewCategoryName(""); setError(""); }}>
                Cancel
              </Button>
            </form>
          )}

          <div className="space-y-2">
            {expenseCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm italic py-4">No expense categories found.</p>
            ) : (
              expenseCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                  <span className="font-medium text-sm">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
