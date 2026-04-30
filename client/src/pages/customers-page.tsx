import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
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

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const EMPTY_FORM: CustomerForm = { name: "", email: "", phone: "", address: "" };

export default function CustomersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [formError, setFormError] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await apiRequest("/api/customers");
      return res.json();
    },
  });

  // ── Mutations ────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: CustomerForm) => {
      const res = await apiRequest("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customers"] });
      closeDialog();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerForm & { id: string }) => {
      const { id, ...body } = data;
      const res = await apiRequest(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customers"] });
      closeDialog();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/customers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customers"] });
      setDeleteConfirm(null);
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
    });
    setFormError("");
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (editing) {
      updateMutation.mutate({ ...form, id: editing.id });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Customers</h1>
        </div>
        <Button onClick={openCreate} id="add-customer-btn">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : customers.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No customers yet.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Add your first customer
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Address</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.address || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        title="Edit customer"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(c)}
                        title="Delete customer"
                        className="text-destructive hover:text-destructive"
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

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {formError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : editing ? "Save Changes" : "Add Customer"}
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
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {deleteConfirm?.name}
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
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
