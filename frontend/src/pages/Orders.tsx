import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CircleAlert, CircleCheck, Clock, FileDown, Loader2, RefreshCw } from "lucide-react";
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

  const statusLabel = (s: string) => {
    const v = String(s || "").toLowerCase();
    if (v === "placed") return "Ordered";
    if (v === "shipped") return "Shipped";
    if (v === "completed") return "Delivered";
    if (v === "cancelled") return "Cancelled";
    return s;
  };

  const getStatusColor = (s: string, ps: string) => {
    const status = String(s || "").toLowerCase();
    const payment = String(ps || "").toLowerCase();
    
    if (status === "cancelled") return "bg-destructive/10 text-destructive border-destructive/20";
    if (status === "completed") return "bg-green-500/10 text-green-600 border-green-500/20";
    if (status === "shipped") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (payment === "paid") return "bg-primary/10 text-primary border-primary/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  const statusStep = (s: string) => {
    const v = String(s || "").toLowerCase();
    if (v === "placed") return 0;
    if (v === "shipped") return 1;
    if (v === "completed") return 2;
    return 0;
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

  const sortedOrders = useMemo(() => {
    return [...myOrders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [myOrders]);

  const openPayDialog = (o: OrderDoc) => {
    if (!token || !user) return;
    void loadRazorpayScript().catch(() => { });
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
          } catch { }
          toast.error("Payment cancelled.");
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
    return <Navigate to="/auth" replace state={{ from: pathname || "/orders" }} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="flex-1 pb-20">
        <div className="bg-white border-b border-border/50">
          <SectionWrapper className="py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Order History</h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                  Track your active orders, manage payments, and view your purchase history all in one place.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadMyOrders()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
              >
                {loadingOrders ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Refresh List
              </button>
            </div>
          </SectionWrapper>
        </div>

        <div className="container py-10 md:py-12">
          {loadingOrders && myOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium">Loading your orders...</p>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-20 px-6 rounded-[2rem] bg-white border border-dashed border-border shadow-sm">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No orders found</h2>
              <p className="text-muted-foreground mb-8">You haven't placed any orders yet. Start shopping to see your history here!</p>
              <Link to="/products" className="inline-flex items-center px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sortedOrders.map((o) => (
                <div key={o._id} className="group bg-white rounded-[2rem] border border-border/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full">
                  {/* Order Card Header */}
                  <div className="p-5 border-b border-border/50 bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(o.status, o.paymentStatus || "")}`}>
                        {statusLabel(o.status)}
                      </span>
                      <p className="text-lg font-black text-foreground tracking-tight">₹{Number(o.totalAmount).toFixed(2)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">ID: {orderDisplayId(o)}</p>
                      <p className="text-xs text-foreground/70 font-medium">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Order Card Content */}
                  <div className="p-6 flex-1 flex flex-col space-y-6">
                    {/* Status Stepper (Active or Cancelled Pipeline) */}
                    {String(o.status).toLowerCase() === "cancelled" ? (
                      <div className="space-y-6">
                        <div className="relative py-2 px-1">
                          <div className="flex items-center justify-between">
                            {[0, 1, 2].map((idx) => {
                              const refundStep = o.refundStatus === "processed" ? 2 : (o.refundStatus === "initiated" ? 1 : 0);
                              const isActive = refundStep >= idx;
                              const labels = ["Cancelled", "Refunded", "Completed"];
                              return (
                                <div key={idx} className="relative flex flex-col items-center flex-1">
                                  {idx !== 0 && (
                                    <div className={`absolute right-1/2 top-2 w-full h-0.5 -translate-y-1/2 z-0 ${isActive ? "bg-destructive" : "bg-muted"}`} />
                                  )}
                                  <div className={`relative z-10 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isActive ? "bg-destructive border-destructive/20" : "bg-white border-muted"}`}>
                                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />}
                                  </div>
                                  <span className={`mt-2 text-[9px] font-black uppercase tracking-widest ${isActive ? "text-destructive" : "text-muted-foreground"}`}>
                                    {labels[idx]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {o.refundStatus && o.refundStatus !== "not_initiated" && (
                          <div className="p-3 rounded-2xl bg-muted/30 border border-border/40">
                             <p className="text-[10px] text-foreground/80 font-bold leading-tight">
                               Refund of ₹{Number(o.totalAmount).toFixed(0)} is {o.refundStatus === "processed" ? "completed" : "in progress"}.
                             </p>
                             <p className="text-[9px] text-muted-foreground mt-1.5 leading-relaxed">
                               Amount will be credited to your account within 5-7 business days.
                             </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative py-2 px-1">
                        <div className="flex items-center justify-between">
                          {[0, 1, 2].map((idx) => {
                            const step = statusStep(o.status);
                            const isActive = step >= idx;
                            const labels = ["Ordered", "Shipped", "Delivered"];
                            return (
                              <div key={idx} className="relative flex flex-col items-center flex-1">
                                {idx !== 0 && (
                                  <div className={`absolute right-1/2 top-2 w-full h-0.5 -translate-y-1/2 z-0 ${isActive ? "bg-primary" : "bg-muted"}`} />
                                )}
                                <div className={`relative z-10 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isActive ? "bg-primary border-primary/20" : "bg-white border-muted"}`}>
                                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />}
                                </div>
                                <span className={`mt-2 text-[9px] font-black uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                                  {labels[idx]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Order Items List */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
                      {o.items.map((it, i) => (
                        <Link 
                          key={i}
                          to={it.productId ? `/products/${it.productId}` : "#"}
                          className="flex items-center gap-3 p-2 rounded-xl border border-border/40 hover:border-primary/20 hover:bg-muted/5 transition-all group/item"
                        >
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                            {it.image ? (
                              <img src={it.image} alt="" className="h-full w-full object-cover group-hover/item:scale-110 transition-transform" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 text-[10px]">?</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-foreground truncate">{it.name}</p>
                            <p className="text-[10px] text-muted-foreground">Qty {it.quantity} • ₹{Number(it.price).toFixed(0)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-4 space-y-3 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        {canDownloadOrderInvoice(o) && (
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                downloadOrderInvoicePdf(o);
                                toast.success("Invoice downloaded");
                              } catch {
                                toast.error("Error generating invoice.");
                              }
                            }}
                            className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-wider hover:underline"
                          >
                            <FileDown className="h-4 w-4" />
                            Invoice
                          </button>
                        )}
                        {String(o.status).toLowerCase() === "placed" && (
                          <button
                            type="button"
                            onClick={() => setCancelOrderId(o._id)}
                            className="text-[10px] font-bold text-destructive hover:underline uppercase tracking-wider"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {String(o.status).toLowerCase() === "placed" && String(o.paymentStatus || "").toLowerCase() !== "paid" && (
                        <button
                          type="button"
                          disabled={payingOrderId === o._id}
                          onClick={() => openPayDialog(o)}
                          className="w-full py-2.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          {payingOrderId === o._id ? "Processing..." : "Pay Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        title="Payment Method"
        confirmLabel="Continue to Razorpay"
        confirming={false}
        onConfirm={confirmPayDialog}
      />

      <ConfirmDialog
        open={Boolean(cancelOrderId)}
        onOpenChange={(open) => {
          if (!open) setCancelOrderId(null);
        }}
        title="Cancel Order?"
        description="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel={cancelling ? "Cancelling..." : "Confirm Cancellation"}
        confirming={cancelling}
        onConfirm={confirmCancelOrder}
      />
    </div>
  );
};

export default Orders;
