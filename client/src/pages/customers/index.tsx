import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  createdAt: string;
}

interface CustomersResponse {
  data: Customer[];
  totalData: number;
  totalPages: number;
  page: number;
  pageLength: number;
}

function truncate(str: string, n = 10) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Customers() {
  const { authHeaders } = useAuth();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageLength, setPageLength] = useState(10);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery<CustomersResponse>({
    queryKey: ["/api/customers", page, pageLength],
    queryFn: () =>
      fetch(`/api/customers?page=${page}&pageLength=${pageLength}`, {
        headers: authHeaders(),
      }).then((r) => r.json()),
  });

  const customers = data?.data ?? [];
  const totalData = data?.totalData ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const createMutation = useMutation({
    mutationFn: (customerName: string) =>
      fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name: customerName }),
      }).then((r) => r.json()),
    onSuccess: (newCustomer: Customer) => {
      qc.setQueryData<CustomersResponse>(
        ["/api/customers", page, pageLength],
        (old) => {
          if (!old)
            return {
              data: [newCustomer],
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
            data: [newCustomer, ...old.data],
            totalData: updatedTotalData,
            totalPages: updatedTotalPages,
            page: old.page,
            pageLength: old.pageLength,
          };
        },
      );
      closeAdd();
    },
    onError: () => setFormError("Failed to add customer"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name }),
      }).then((r) => r.json()),
    onSuccess: (updated: Customer) => {
      qc.setQueryData<CustomersResponse>(
        ["/api/customers", page, pageLength],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((c) => (c.id === updated.id ? updated : c)),
          };
        },
      );
      setEditTarget(null);
    },
    onError: () => setFormError("Failed to update customer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/customers/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/customers"] });
      setDeleteTarget(null);
    },
  });

  const closeAdd = () => {
    setAddOpen(false);
    setName("");
    setFormError("");
  };
  const closeEdit = () => {
    setEditTarget(null);
    setName("");
    setFormError("");
  };

  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setName(c.name);
    setFormError("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Customers</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your customer list
          </p>
        </div>
        <Button
          onClick={() => {
            setName("");
            setFormError("");
            setAddOpen(true);
          }}
          className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl gap-2"
        >
          <Plus size={16} /> Add Customer
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
                  ID
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#246052] uppercase tracking-wider hidden sm:table-cell">
                  Created
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
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-gray-400">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    <p>No customers found.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 hover:bg-[#24605205] transition-colors"
                  >
                    <td className="px-5 py-4 text-gray-400">
                      {(page - 1) * pageLength + idx + 1}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {truncate(c.id)}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {c.name}
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#246052] hover:bg-[#24605210] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={14} />
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
            onPageLengthChange={setPageLength}
          />
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        open={addOpen}
        onClose={closeAdd}
        title="Add Customer"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeAdd} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) {
                  setFormError("Name is required");
                  return;
                }
                createMutation.mutate(name);
              }}
              disabled={createMutation.isPending}
              className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl"
            >
              {createMutation.isPending ? "Adding…" : "Add Customer"}
            </Button>
          </div>
        }
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFormError("");
            }}
            placeholder="Customer name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
          />
          {formError && (
            <p className="text-red-500 text-xs mt-2">{formError}</p>
          )}
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title="Edit Customer"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={closeEdit}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) {
                  setFormError("Name is required");
                  return;
                }
                updateMutation.mutate({ id: editTarget!.id, name });
              }}
              disabled={updateMutation.isPending}
              className="bg-[#246052] hover:bg-[#246052]/90 text-white rounded-xl"
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFormError("");
            }}
            placeholder="Customer name"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
          />
          {formError && (
            <p className="text-red-500 text-xs mt-2">{formError}</p>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
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
          <span className="font-semibold">"{deleteTarget?.name}"</span>?
        </p>
      </Modal>
    </div>
  );
}
