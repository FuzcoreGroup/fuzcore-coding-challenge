import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Trash2, Send, CheckCircle, FileText, Download, Link as LinkIcon, Copy, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";

export default function InvoiceDetailPage() {
  const [, params] = useRoute("/invoices/:id");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────
  const { data: invoice, isLoading, error } = useQuery<any>({
    queryKey: [`/api/invoices/${id}`],
    queryFn: async () => {
      const res = await apiRequest(`/api/invoices/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  // ── Mutations ────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/invoices/${id}`] });
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/invoices/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setLocation("/invoices");
    },
  });

  const paymentLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/invoices/${id}/payment-link`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate payment link");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/invoices/${id}`] });
      alert("Payment link generated! You can now share it with your customer.");
    },
    onError: (err: any) => {
      alert("Error generating payment link: " + err.message);
    }
  });

  const handleCopyLink = () => {
    if (invoice?.paymentLinkUrl) {
      navigator.clipboard.writeText(invoice.paymentLinkUrl);
      alert("Payment link copied to clipboard.");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading invoice…</div>;
  if (error || !invoice) return <div className="p-8 text-center text-destructive">Error loading invoice or invoice not found.</div>;

  const grandTotal = invoice.items.reduce((sum: number, item: any) => {
    return sum + (Number(item.quantity) * Number(item.unitPrice));
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" onClick={() => setLocation("/invoices")} className="-ml-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <span className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>

          {invoice.status === 'draft' && (
            <Button 
              variant="outline" 
              className="text-destructive hover:bg-destructive/10" 
              onClick={() => {
                if(confirm("Are you sure you want to delete this draft invoice?")) deleteMutation.mutate()
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          )}

          {invoice.status === 'draft' && (
            <Button onClick={() => statusMutation.mutate('sent')} disabled={statusMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />
              Mark as Sent
            </Button>
          )}

          {invoice.status === 'sent' && (
            <Button onClick={() => statusMutation.mutate('paid')} disabled={statusMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}

          {invoice.status === 'sent' && !invoice.paymentLinkUrl && (
            <Button 
              variant="outline" 
              onClick={() => paymentLinkMutation.mutate()} 
              disabled={paymentLinkMutation.isPending}
              className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {paymentLinkMutation.isPending ? "Generating..." : "Generate Link"}
            </Button>
          )}

          {invoice.status === 'sent' && invoice.paymentLinkUrl && (
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md border text-sm">
              {invoice.paymentLinkAmount && Math.abs(Number(invoice.paymentLinkAmount) - grandTotal) > 0.01 && (
                <div className="flex items-center text-amber-600 dark:text-amber-400 mr-2 ml-1" title={`Amount mismatch! Link was for ₦${Number(invoice.paymentLinkAmount).toLocaleString('en-NG')}, but current total is ₦${grandTotal.toLocaleString('en-NG')}. Please regenerate.`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              <span className="truncate max-w-[150px] text-muted-foreground ml-2">{invoice.paymentLinkUrl}</span>
              <Button variant="ghost" size="icon" onClick={handleCopyLink} className="h-7 w-7 ml-1" title="Copy Link">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.open(invoice.paymentLinkUrl, "_blank")} className="h-7 w-7" title="Open Link">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if(confirm("Regenerate payment link? This will replace the current one.")) paymentLinkMutation.mutate();
                }} 
                className={`h-7 w-7 ${invoice.paymentLinkAmount && Math.abs(Number(invoice.paymentLinkAmount) - grandTotal) > 0.01 ? 'text-amber-600 hover:text-amber-700 animate-pulse' : ''}`}
                disabled={paymentLinkMutation.isPending}
                title="Regenerate Link"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${paymentLinkMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}

          {invoice.status === 'paid' && (
            <Button disabled className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 opacity-100">
              <CheckCircle className="w-4 h-4 mr-2" />
              Invoice Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document Look */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 md:p-12 border-b flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-3 rounded-xl text-primary">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
                <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Billed To</h3>
            {invoice.customer ? (
              <div className="text-right">
                <p className="font-semibold text-lg">{invoice.customer.name}</p>
                {invoice.customer.email && <p className="text-muted-foreground text-sm">{invoice.customer.email}</p>}
                {invoice.customer.phone && <p className="text-muted-foreground text-sm">{invoice.customer.phone}</p>}
                {invoice.customer.address && <p className="text-muted-foreground text-sm mt-1 max-w-[200px] leading-tight">{invoice.customer.address}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground italic">Unknown Customer</p>
            )}
          </div>
        </div>

        {/* Dates Section */}
        <div className="px-8 md:px-12 py-6 bg-muted/20 border-b flex flex-wrap gap-12">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Issued Date</p>
            <p className="font-semibold">{new Date(invoice.issuedDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Due Date</p>
            <p className="font-semibold">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon receipt"}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8 md:p-12">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">{item.description}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">₦{Number(item.unitPrice).toLocaleString('en-NG')}</td>
                    <td className="px-4 py-4 text-right font-medium">₦{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('en-NG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="mt-8 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span>₦{grandTotal.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                <span>Total Due</span>
                <span>₦{grandTotal.toLocaleString('en-NG')}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-12 pt-8 border-t">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
