import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import officeImg from "@/assets/images/office.jpg";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type CustomersResponse = {
  items: Customer[];
  page: number;
  pageSize: number;
};

export default function CustomersPage() {
  const auth = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const queryKey = useMemo(() => ["customers", { search }], [search]);

  const listQuery = useQuery<CustomersResponse>({
    queryKey,
    enabled: !!token,
    queryFn: async () => {
      const qs = search.trim().length ? `?search=${encodeURIComponent(search.trim())}` : "";
      return apiFetch<CustomersResponse>(`/api/customers${qs}`, token);
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const upsertCustomer = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      const payload = {
        name,
        email: email || "",
        phone: phone || "",
        address: address || "",
      };

      if (editingId) {
        return apiFetch(`/api/customers/${editingId}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      return apiFetch("/api/customers", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setEditingId(null);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => setError((err as Error).message),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/customers/${id}`, token, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="rounded-lg border overflow-hidden">
        <div className="relative">
          <img src={officeImg} alt="Office" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute left-6 bottom-3 text-white">
            <h1 className="text-2xl font-bold">Customers</h1>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-muted-foreground">Add, edit, and manage your customer list.</p>
        </div>

        <label className="flex flex-col gap-1 w-72">
          <span className="text-sm text-muted-foreground">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-md border px-3 bg-background"
            type="search"
            placeholder="Name, email, phone..."
          />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">{editingId ? "Edit customer" : "New customer"}</h2>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-md border px-3 bg-background" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-md border px-3 bg-background" type="email" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-md border px-3 bg-background" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Address</span>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-20 rounded-md border px-3 bg-background pt-2" />
              </label>

              {error ? <div className="text-sm text-destructive">{error}</div> : null}

              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    upsertCustomer.mutate();
                  }}
                  disabled={upsertCustomer.isPending}
                >
                  {upsertCustomer.isPending ? "Saving..." : editingId ? "Save changes" : "Add customer"}
                </Button>
                {editingId ? (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingId(null);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setAddress("");
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3">Customer list</h2>
            {listQuery.isLoading ? <div>Loading...</div> : null}
            {listQuery.error ? <div className="text-sm text-destructive">Failed to load</div> : null}

            <div className="flex flex-col gap-3 mt-3">
              {listQuery.data?.items?.length ? (
                listQuery.data.items.map((c) => (
                  <div key={c.id} className="border rounded-lg p-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.email ? c.email : "No email"} {c.phone ? `• ${c.phone}` : ""}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(c.id);
                          setName(c.name);
                          setEmail(c.email ?? "");
                          setPhone(c.phone ?? "");
                          setAddress(c.address ?? "");
                          setError(null);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete ${c.name}?`)) {
                            deleteCustomer.mutate(c.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No customers yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

