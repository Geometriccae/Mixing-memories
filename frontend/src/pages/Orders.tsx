import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { cancelMyOrder, fetchMyOrders, type OrderDoc } from "@/lib/orderApi";
import { toast } from "sonner";

const Orders = () => {
  const { user, token, isLoading } = useAuth();
  const [myOrders, setMyOrders] = useState<OrderDoc[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const statusLabel = useMemo(
    () => (s: string) => {
      const v = String(s || "").toLowerCase();
      if (v === "placed") return "Ordered";
      if (v === "shipped") return "Shipped";
      if (v === "completed") return "Delivered";
      if (v === "cancelled") return "Cancelled";
      return s;
    },
    [],
  );
 
  const statusStep = useMemo(
    () => (s: string) => {
      const v = String(s || "").toLowerCase();
      if (v === "placed") return 0;
      if (v === "shipped") return 1;
      if (v === "completed") return 2;
      return 0;
    },
    [],
  );
 
  const stepTextClass = (idx: number, currentStep: number) => {
    if (idx === currentStep) return "text-foreground font-medium";
    if (idx < currentStep) return "text-foreground";
    return "text-muted-foreground";
  };

  const loadMyOrders = async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const list = await fetchMyOrders(token);
      setMyOrders(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      setMyOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadMyOrders();
  }, [token]);

  const confirmCancelOrder = () => {
    if (!token || !cancelOrderId) return;
    void (async () => {
      setCancelling(true);
      try {
        await cancelMyOrder(token, cancelOrderId);
        toast.success("Order cancelled");
        setCancelOrderId(null);
        await loadMyOrders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      } finally {
        setCancelling(false);
      }
    })();
  };

  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <SectionWrapper>
          <SectionHeading title="My Orders" subtitle="Track your orders and delivery status" />

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.name}</span>
              </p>
              <button
                type="button"
                onClick={() => void loadMyOrders()}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-medium border border-border hover:bg-muted/80"
              >
                Refresh
              </button>
            </div>

            {loadingOrders ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : myOrders.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-foreground font-medium">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Go to your <Link to="/cart" className="text-primary font-medium hover:underline">cart</Link> to place an order.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {myOrders.map((o) => (
                  <li key={o._id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                      </span>
                      <span className="text-muted-foreground">
                        Status: <span className="font-medium text-foreground">{statusLabel(o.status)}</span>
                      </span>
                    </div>

                    <p className="text-sm text-foreground mt-2">₹{Number(o.totalAmount).toFixed(2)} total</p>
                    {o.paymentMethod ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Payment: {String(o.paymentMethod).toUpperCase()} {o.paymentStatus ? `• ${String(o.paymentStatus)}` : ""}
                      </p>
                    ) : null}
 
                    {String(o.status).toLowerCase() === "cancelled" ? (
                      <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm space-y-1.5">
                        <p className="text-destructive font-medium">Cancelled</p>
                        {o.cancelledBy === "admin" && String(o.cancelReason || "").trim() ? (
                          <p className="text-foreground leading-relaxed">
                            <span className="text-muted-foreground">Message from store: </span>
                            {String(o.cancelReason).trim()}
                          </p>
                        ) : o.cancelledBy === "user" ? (
                          <p className="text-muted-foreground">You cancelled this order.</p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
                        {(() => {
                          const step = statusStep(o.status);
                          const steps = ["Ordered", "Shipped", "Delivered"] as const;
                          return (
                            <div className="mx-auto max-w-md space-y-2">
                              <div className="flex items-center">
                                {steps.map((label, idx) => (
                                  <div key={`track-${label}`} className="flex min-w-0 flex-1 items-center">
                                    <div
                                      className={`h-0.5 min-w-0 flex-1 rounded-full ${
                                        idx === 0 ? "opacity-0" : step >= idx ? "bg-primary" : "bg-border"
                                      }`}
                                      aria-hidden
                                    />
                                    <div
                                      className={`relative z-10 h-3.5 w-3.5 shrink-0 rounded-full border-2 bg-background ${
                                        step >= idx ? "border-primary bg-primary" : "border-border"
                                      }`}
                                      title={label}
                                    />
                                    <div
                                      className={`h-0.5 min-w-0 flex-1 rounded-full ${
                                        idx === steps.length - 1
                                          ? "opacity-0"
                                          : step > idx
                                            ? "bg-primary"
                                            : "bg-border"
                                      }`}
                                      aria-hidden
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex">
                                {steps.map((label, idx) => (
                                  <div
                                    key={label}
                                    className={`min-w-0 flex-1 text-center text-[10px] leading-tight sm:text-xs ${stepTextClass(
                                      idx,
                                      step,
                                    )}`}
                                  >
                                    {label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {String(o.status).toLowerCase() === "placed" ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setCancelOrderId(o._id)}
                          className="text-sm font-medium text-destructive hover:underline"
                        >
                          Cancel order
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can cancel before the order ships. Stock will be returned to the store.
                        </p>
                      </div>
                    ) : null}

                    <ul className="mt-4 space-y-2">
                      {o.items.map((it, i) => {
                        const pid = it.productId ? String(it.productId) : "";
                        const row = (
                          <div className="flex items-center gap-3">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt=""
                                className="h-12 w-12 rounded-lg object-cover border border-border shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg border border-dashed border-border bg-muted/40 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty {it.quantity} • ₹{Number(it.price).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-sm font-semibold text-foreground tabular-nums">
                              ₹{(Number(it.price) * Number(it.quantity)).toFixed(2)}
                            </div>
                          </div>
                        );
                        return (
                          <li key={i} className="rounded-lg border border-border bg-background/50 p-3">
                            {pid ? (
                              <Link to={`/products/${pid}`} className="block hover:opacity-90 transition-opacity">
                                {row}
                              </Link>
                            ) : (
                              row
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionWrapper>
      </main>
      <Footer />

      <ConfirmDialog
        open={Boolean(cancelOrderId)}
        onOpenChange={(open) => {
          if (!open) setCancelOrderId(null);
        }}
        title="Cancel this order?"
        description="This cannot be undone. Items will be put back in stock."
        confirmLabel={cancelling ? "Cancelling…" : "Yes, cancel order"}
        confirming={cancelling}
        onConfirm={confirmCancelOrder}
      />
    </>
  );
};

export default Orders;
