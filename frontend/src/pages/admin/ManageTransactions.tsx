import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { fetchAdminOrders, patchOrderPaymentStatus, type OrderDoc } from "@/lib/orderApi";
import { orderDisplayId, paymentStatusLabel } from "@/lib/orderInvoicePdf";

const navy = "bg-[hsl(222_47%_16%)]";
const thClass = `${navy} text-white text-left text-xs font-semibold uppercase tracking-wide px-4 py-3 border-b border-white/10`;

function itemsSummary(o: OrderDoc): string {
  return o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ");
}

const ManageTransactions = () => {
  const { pathname } = useLocation();
  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);

  if (pathname === "/admin/transactions") {
    return <Navigate to="/admin/transactions/pending" replace />;
  }

  const paymentFilter = pathname.includes("/success") ? "paid" : "pending";

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchAdminOrders(token, { paymentStatus: paymentFilter });
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
  }, [pathname, token, paymentFilter]);

  const markPaid = (orderId: string) => {
    if (!token) return;
    void (async () => {
      setUpdatingId(orderId);
      try {
        await patchOrderPaymentStatus(token, orderId, "paid");
        toast.success("Payment marked successful");
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      } finally {
        setUpdatingId(null);
      }
    })();
  };

  if (!token) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Sign in to the admin panel to manage transactions.
      </div>
    );
  }

  const title = paymentFilter === "paid" ? "Successful payments" : "Pending payments";
  const subtitle =
    paymentFilter === "paid"
      ? "Orders where payment has been confirmed."
      : "Confirm COD / other payments here — customers will see “Successful” on their order after you update.";

  return (
    <div className="rounded-xl bg-card border border-border/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="p-5 pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders in this list.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr>
                  <th className={thClass}>Order ID</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Products</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={thClass}>Pay method</th>
                  <th className={thClass}>Delivery</th>
                  <th className={thClass}>Payment</th>
                  {paymentFilter === "pending" ? <th className={`${thClass} text-center`}>Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o._id} className={`border-b border-border ${idx % 2 === 1 ? "bg-muted/35" : "bg-card"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">{orderDisplayId(o)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[280px] text-xs">{itemsSummary(o)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                      ₹{Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground uppercase text-xs">{o.paymentMethod || "—"}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{o.status}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          String(o.paymentStatus).toLowerCase() === "paid"
                            ? "bg-primary/15 text-primary"
                            : String(o.paymentStatus).toLowerCase() === "failed"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {paymentStatusLabel(o.paymentStatus)}
                      </span>
                    </td>
                    {paymentFilter === "pending" ? (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={updatingId === o._id || String(o.status).toLowerCase() === "cancelled"}
                          onClick={() => markPaid(o._id)}
                          className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {updatingId === o._id ? "Saving…" : "Mark successful"}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTransactions;
