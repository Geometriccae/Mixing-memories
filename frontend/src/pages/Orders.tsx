import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CircleCheck, Clock, FileDown, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { abandonUnpaidOrder, cancelMyOrder, fetchMyOrders, type OrderDoc } from "@/lib/orderApi";
import { payOrderWithRazorpay } from "@/lib/payOrderWithRazorpay";
import { loadRazorpayScript } from "@/lib/razorpayCheckout";
import PaymentMethodDialog, { type PaymentMethod } from "@/components/checkout/PaymentMethodDialog";
import { canDownloadOrderInvoice, downloadOrderInvoicePdf, orderDisplayId, paymentStatusLabel } from "@/lib/orderInvoicePdf";
import { toast } from "sonner";

function orderPaymentMethod(o: OrderDoc): PaymentMethod {
  const m = String(o.paymentMethod || "").toLowerCase();
  if (m === "card" || m === "netbanking" || m === "upi") return m;
  return "upi";
}

const Orders = () => {
  const { pathname } = useLocation();
  const { user, token, isLoading } = useAuth();
  const [myOrders, setMyOrders] = useState<OrderDoc[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payDialogOrder, setPayDialogOrder] = useState<OrderDoc | null>(null);
  const [payDialogMethod, setPayDialogMethod] = useState<PaymentMethod>("upi");

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
  }, [token, pathname]);

  const paymentView: "paid" | "unpaid" = pathname.includes("/success") ? "paid" : "unpaid";

  const filteredOrders = useMemo(() => {
    return myOrders.filter((o) => {
      const ps = String(o.paymentStatus || "").toLowerCase();
      const st = String(o.status || "").toLowerCase();
      if (paymentView === "paid") return ps === "paid";
      return ps !== "paid" && st !== "cancelled";
    });
  }, [myOrders, paymentView]);

  const openPayDialog = (o: OrderDoc) => {
    if (!token || !user) return;
    void loadRazorpayScript().catch(() => {});
    setPayDialogOrder(o);
    setPayDialogMethod(orderPaymentMethod(o));
    setPayDialogOpen(true);
  };

  const runPayOrder = (o: OrderDoc, pm: PaymentMethod) => {
    if (!token || !user) return;
    void (async () => {
      setPayingOrderId(o._id);
      try {
        await payOrderWithRazorpay(token, o, pm, {
          name: user.name,
          email: user.email,
          phone: user.phone,
        });
        toast.success("Payment successful!");
        await loadMyOrders();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "Payment was cancelled.") {
          try {
            await abandonUnpaidOrder(token, o._id);
            toast.error("Payment cancelled — order was not placed.");
          } catch {
            toast.error("Payment cancelled.");
          }
          await loadMyOrders();
        } else {
          toast.error(msg || "Payment failed.");
        }
      } finally {
        setPayingOrderId(null);
        setPayDialogOrder(null);
      }
    })();
  };

  const confirmPayDialog = () => {
    if (!payDialogOrder || payingOrderId) return;
    const o = payDialogOrder;
    const pm = payDialogMethod;
    setPayDialogOpen(false);
    runPayOrder(o, pm);
  };

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
    return <Navigate to="/auth" replace state={{ from: pathname || "/orders/pending" }} />;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <SectionWrapper>
          <SectionHeading
            title="My Orders"
            subtitle={
              paymentView === "paid"
                ? "Orders with successful payment — download invoices here."
                : "Orders that still need payment (or failed online) — use Pay now for Razorpay. When payment is confirmed (Razorpay or manually by the store), the order moves to the Successful tab."
            }
          />

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.name}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-border bg-card p-1">
                  <Link
                    to="/orders/success"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      paymentView === "paid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Successful
                  </Link>
                  <Link
                    to="/orders/pending"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      paymentView === "unpaid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Pending
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => void loadMyOrders()}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground font-medium border border-border hover:bg-muted/80"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loadingOrders ? (
              <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-foreground font-medium">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Go to your <Link to="/cart" className="text-primary font-medium hover:underline">cart</Link> to place an order.
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                {paymentView === "paid" ? (
                  <>
                    <CircleCheck className="mx-auto h-12 w-12 text-muted-foreground/55" aria-hidden />
                    <p className="mt-3 font-medium text-foreground">No successful orders yet</p>
                  </>
                ) : (
                  <>
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground/55" aria-hidden />
                    <p className="mt-3 font-medium text-foreground">No pending orders</p>
                  </>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredOrders.map((o) => (
                  <li key={o._id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap justify-between gap-2 text-sm items-start">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                        <p className="font-mono font-semibold text-foreground">{orderDisplayId(o)}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-muted-foreground text-right">
                          Status: <span className="font-medium text-foreground">{statusLabel(o.status)}</span>
                        </span>
                        {canDownloadOrderInvoice(o) ? (
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                downloadOrderInvoicePdf(o);
                                toast.success("Invoice downloaded");
                              } catch (err) {
                                const msg = err instanceof Error ? err.message : "Could not generate invoice.";
                                toast.error(msg);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/10 transition-colors"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                            Download invoice
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <p className="text-sm text-foreground mt-3">₹{Number(o.totalAmount).toFixed(2)} total</p>

                    {paymentView === "unpaid" &&
                    String(o.status).toLowerCase() === "placed" &&
                    String(o.paymentStatus || "").toLowerCase() === "pending" ? (
                      <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground leading-relaxed">
                        <span className="font-medium">Order placed successfully.</span> Payment is still pending — use{" "}
                        <span className="font-medium">Pay now</span> when you are ready.
                      </div>
                    ) : null}
                    {paymentView === "unpaid" &&
                    String(o.status).toLowerCase() === "placed" &&
                    String(o.paymentStatus || "").toLowerCase() === "failed" ? (
                      <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-foreground leading-relaxed">
                        <span className="font-medium">Order placed successfully,</span> but the last payment attempt did not
                        complete. Use <span className="font-medium">Pay now</span> to try again.
                      </div>
                    ) : null}

                    {o.paymentMethod ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Payment: {String(o.paymentMethod).toUpperCase()}
                        {o.paymentStatus != null ? (
                          <>
                            {" "}
                            •{" "}
                            <span className="font-medium text-foreground">{paymentStatusLabel(o.paymentStatus)}</span>
                          </>
                        ) : null}
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
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {String(o.paymentStatus || "").toLowerCase() !== "paid" ? (
                          <button
                            type="button"
                            disabled={payingOrderId === o._id}
                            onClick={() => openPayDialog(o)}
                            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                          >
                            {payingOrderId === o._id ? "Opening payment…" : "Pay now"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setCancelOrderId(o._id)}
                          className="text-sm font-medium text-destructive hover:underline"
                        >
                          Cancel order
                        </button>
                        <p className="text-xs text-muted-foreground w-full">
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

      <PaymentMethodDialog
        open={payDialogOpen}
        onOpenChange={(open) => {
          setPayDialogOpen(open);
          if (!open) setPayDialogOrder(null);
        }}
        value={payDialogMethod}
        onChange={setPayDialogMethod}
        title="How do you want to pay?"
        confirmLabel="Continue to Razorpay"
        confirming={false}
        onConfirm={confirmPayDialog}
      />

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
