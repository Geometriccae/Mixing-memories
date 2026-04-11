import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Eye, FileDown } from "lucide-react";
import { fetchAdminOrders, patchOrderStatus, type OrderDoc } from "@/lib/orderApi";
import { downloadOrderInvoicePdf, orderDisplayId, orderStatusLabel, paymentStatusLabel } from "@/lib/orderInvoicePdf";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_OPTIONS = ["placed", "shipped", "completed", "cancelled"] as const;

const STATUS_FILTER_BY_PATH: Record<string, string | undefined> = {
  "/admin/orders": undefined,
  "/admin/orders/placed": "placed",
  "/admin/orders/shipped": "shipped",
  "/admin/orders/completed": "completed",
  "/admin/orders/cancelled": "cancelled",
};

const navy = "bg-[hsl(222_47%_16%)]";
const thClass = `${navy} text-white text-left text-xs font-semibold uppercase tracking-wide px-4 py-3 border-b border-white/10`;

function addressLine(o: OrderDoc): string {
  const a = o.shippingAddress;
  if (!a) return "—";
  const parts = [a.line1, a.line2, a.city, a.state, a.pincode, a.country].map((s) => String(s || "").trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

const ManageOrders = () => {
  const { pathname } = useLocation();
  const statusQuery = STATUS_FILTER_BY_PATH[pathname];
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<OrderDoc | null>(null);
  const [adminCancelOrderId, setAdminCancelOrderId] = useState<string | null>(null);
  const [adminCancelReason, setAdminCancelReason] = useState("");
  const [adminCancelSubmitting, setAdminCancelSubmitting] = useState(false);

  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);

  const refresh = async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchAdminOrders(token, { orderStatus: statusQuery ?? undefined });
      setOrders(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, token]);

  const handleStatusChange = (orderId: string, status: string) => {
    if (!token) return;
    if (status === "cancelled") {
      setAdminCancelOrderId(orderId);
      setAdminCancelReason("");
      return;
    }
    void (async () => {
      try {
        await patchOrderStatus(token, orderId, status);
        toast.success("Order updated");
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      }
    })();
  };

  const dialogOrder = useMemo(() => {
    if (!selected) return null;
    return orders.find((x) => x._id === selected._id) ?? selected;
  }, [selected, orders]);

  const submitAdminCancel = () => {
    if (!token || !adminCancelOrderId) return;
    const reason = adminCancelReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for the customer.");
      return;
    }
    void (async () => {
      setAdminCancelSubmitting(true);
      try {
        await patchOrderStatus(token, adminCancelOrderId, "cancelled", reason);
        toast.success("Order cancelled; stock restored");
        setAdminCancelOrderId(null);
        setAdminCancelReason("");
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      } finally {
        setAdminCancelSubmitting(false);
      }
    })();
  };

  if (!token) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Sign in to the admin panel to manage orders.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Orders</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {statusQuery ? `Showing: ${statusQuery}` : "All orders"} — updates sync from the customer portal when shoppers place orders.
        </p>
      </div>
      <div className="p-5 pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders in this view.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Order ID</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Items</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-center`}>View</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o._id} className={`border-b border-border ${idx % 2 === 1 ? "bg-muted/35" : "bg-card"}`}>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">
                      {orderDisplayId(o)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{o.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{o.email}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[280px]">
                      {o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                      ₹{Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        disabled={o.status === "cancelled"}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="border border-border rounded-md px-2 py-1.5 bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(o);
                          setViewOpen(true);
                        }}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-muted/50"
                        aria-label="View order"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={viewOpen}
        onOpenChange={(o) => {
          setViewOpen(o);
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">Order details</p>
                {dialogOrder ? (
                  <>
                    <p className="text-sm font-mono font-semibold text-primary mt-1">{orderDisplayId(dialogOrder)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-all">Ref: {dialogOrder._id}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">—</p>
                )}
              </div>
              {dialogOrder ? (
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      try {
                        await downloadOrderInvoicePdf(dialogOrder);
                        toast.success("Invoice downloaded (current status)");
                      } catch {
                        toast.error("Could not generate invoice.");
                      }
                    })();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 text-primary px-3 py-2 text-sm font-semibold hover:bg-primary/10"
                >
                  <FileDown className="h-4 w-4" />
                  Download invoice PDF
                </button>
              ) : null}
            </div>

            {dialogOrder ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium text-foreground">{dialogOrder.customerName}</p>
                    <p className="text-muted-foreground">{dialogOrder.email}</p>
                    <p className="text-muted-foreground">{dialogOrder.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delivery address</p>
                    <p className="font-medium text-foreground">{addressLine(dialogOrder)}</p>
                    <p className="text-muted-foreground mt-2">
                      Payment: {dialogOrder.paymentMethod ? String(dialogOrder.paymentMethod).toUpperCase() : "—"}
                      {dialogOrder.paymentStatus != null ? (
                        <>
                          {" "}
                          •{" "}
                          <span className="font-medium text-foreground">
                            {paymentStatusLabel(dialogOrder.paymentStatus)}
                          </span>
                        </>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground">
                      Status: <span className="font-medium text-foreground">{orderStatusLabel(dialogOrder.status)}</span>
                    </p>
                    {dialogOrder.status === "cancelled" && dialogOrder.cancelReason?.trim() ? (
                      <p className="text-sm text-foreground mt-2">
                        <span className="text-muted-foreground">Customer-facing reason: </span>
                        {dialogOrder.cancelReason.trim()}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium text-foreground mb-2">Items</p>
                  <ul className="space-y-2">
                    {dialogOrder.items.map((it, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {it.image ? (
                            <img src={it.image} alt="" className="h-10 w-10 rounded object-cover border border-border shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded border border-dashed border-border bg-muted/40 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                            <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-foreground tabular-nums">
                          ₹{(Number(it.price) * Number(it.quantity)).toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="text-right text-sm font-semibold text-foreground pt-2 border-t border-border mt-3">
                    Total ₹{Number(dialogOrder.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No order selected.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(adminCancelOrderId)}
        onOpenChange={(open) => {
          if (!open) {
            setAdminCancelOrderId(null);
            setAdminCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will cancel the order, restore product stock, and show your message to the customer on their orders page.
          </p>
          <label className="block text-sm font-medium text-foreground" htmlFor="admin-cancel-reason">
            Reason for customer <span className="text-destructive">*</span>
          </label>
          <textarea
            id="admin-cancel-reason"
            rows={4}
            value={adminCancelReason}
            onChange={(e) => setAdminCancelReason(e.target.value)}
            placeholder="e.g. Item out of stock — we’ll refund within 2 business days."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => {
                setAdminCancelOrderId(null);
                setAdminCancelReason("");
              }}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted/50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={adminCancelSubmitting}
              onClick={submitAdminCancel}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium hover:opacity-90 disabled:opacity-50"
            >
              {adminCancelSubmitting ? "Cancelling…" : "Cancel order"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageOrders;
