import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { fetchAdminOrders, patchOrderStatus, type OrderDoc } from "@/lib/orderApi";

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

const ManageOrders = () => {
  const { pathname } = useLocation();
  const statusQuery = STATUS_FILTER_BY_PATH[pathname];
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => sessionStorage.getItem("admin_token"), []);

  const refresh = async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchAdminOrders(token, statusQuery);
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
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Items</th>
                  <th className={`${thClass} text-right`}>Total</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr key={o._id} className={`border-b border-border ${idx % 2 === 1 ? "bg-muted/35" : "bg-card"}`}>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
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
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="border border-border rounded-md px-2 py-1.5 bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 capitalize"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
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

export default ManageOrders;
