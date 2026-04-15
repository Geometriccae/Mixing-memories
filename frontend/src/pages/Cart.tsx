import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProductsAvailability, type ProductAvailability } from "@/lib/catalogApi";
import { loadRazorpayScript, isRazorpayUserDismissed } from "@/lib/razorpayCheckout";
import { abandonCheckoutSession, startCheckoutSession, type CheckoutSessionBundle } from "@/lib/orderApi";
import { payCheckoutSessionWithRazorpay } from "@/lib/payOrderWithRazorpay";
import PaymentMethodDialog, { type PaymentMethod } from "@/components/checkout/PaymentMethodDialog";

const Cart = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { items, setQuantity, removeLine, clearCart, subtotal, itemCount } = useCart();
  const [availability, setAvailability] = useState<Record<string, ProductAvailability>>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderingOne, setOrderingOne] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [pmOpen, setPmOpen] = useState(false);
  const [pmForProductId, setPmForProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ids = items.map((l) => l.productId).filter(Boolean);
    if (ids.length === 0) {
      setAvailability({});
      return;
    }
    void (async () => {
      try {
        const map = await fetchProductsAvailability(ids);
        if (!cancelled) setAvailability(map);
      } catch {
        if (!cancelled) setAvailability({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const addressOk = useMemo(() => {
    if (!user) return false;
    const a = user.address;
    return Boolean(a.line1 && a.city && a.state && a.pincode && a.phone);
  }, [user]);

  useEffect(() => {
    if (token && user && addressOk && items.length > 0) {
      void loadRazorpayScript().catch(() => {});
    }
  }, [token, user, addressOk, items.length]);

  const placeOrderDisabled = submitting || items.length === 0 || !user;

  const handleOrderSingle = async (productId: string, pm: PaymentMethod) => {
    const line = items.find((l) => l.productId === productId);
    if (!line) return;
    if (!token) {
      toast.error("Please sign in to place an order.");
      return;
    }
    if (!addressOk) {
      toast.error("Please fill your delivery address in Profile.");
      return;
    }
    setOrderingOne(productId);
    let checkout: CheckoutSessionBundle | null = null;
    try {
      const avail =
        availability[productId] != null ? availability : await fetchProductsAvailability([productId]);
      const a = avail[productId];
      const max = a ? Number(a.maxOrderable) : 0;
      if (!Number.isFinite(max) || max < 1) {
        throw new Error(`"${line.name}" is out of stock.`);
      }
      if (line.quantity > max) {
        throw new Error(`Not enough stock for "${line.name}". Only ${max} available.`);
      }

      const [sessionOut] = await Promise.all([
        startCheckoutSession(token, {
          items: [
            {
              productId: line.productId,
              name: line.name,
              price: line.price,
              quantity: line.quantity,
              image: line.image,
            },
          ],
          paymentMethod: pm,
        }),
        loadRazorpayScript().catch(() => {}),
      ]);
      checkout = sessionOut;
      if (!user) return;
      await payCheckoutSessionWithRazorpay(token, sessionOut, pm, {
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
      removeLine(productId);
      toast.success("Order placed and paid successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (checkout && isRazorpayUserDismissed(err)) {
        await abandonCheckoutSession(token, checkout.sessionId).catch(() => {});
        toast.info("Checkout cancelled. Nothing was saved to your orders.");
      } else if (
        checkout &&
        (msg === "Payment failed." || msg.includes("Payment verification failed"))
      ) {
        toast.warning("Payment did not complete. You can review or retry under My Orders → Pending.");
        void navigate("/orders/pending");
      } else if (checkout) {
        await abandonCheckoutSession(token, checkout.sessionId).catch(() => {});
        toast.error(msg || "Could not complete checkout.");
      } else {
        toast.error(msg || "Failed to start checkout.");
      }
    } finally {
      setOrderingOne(null);
    }
  };

  const handlePlaceOrder = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token) {
      toast.error("Please sign in to place an order.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!addressOk) {
      toast.error("Please fill your delivery address in Profile.");
      return;
    }
    setSubmitting(true);
    let checkout: CheckoutSessionBundle | null = null;
    try {
      const ids = items.map((l) => l.productId).filter(Boolean);
      const haveAll = ids.length > 0 && ids.every((id) => availability[id] != null);
      const avail = haveAll ? availability : await fetchProductsAvailability(ids);
      for (const line of items) {
        const a = avail[line.productId];
        const max = a ? Number(a.maxOrderable) : 0;
        if (!Number.isFinite(max) || max < 1) {
          throw new Error(`"${line.name}" is out of stock.`);
        }
        if (line.quantity > max) {
          throw new Error(`Not enough stock for "${line.name}". Only ${max} available.`);
        }
      }

      const [sessionOut] = await Promise.all([
        startCheckoutSession(token, {
          items: items.map((l) => ({
            productId: l.productId,
            name: l.name,
            price: l.price,
            quantity: l.quantity,
            image: l.image,
          })),
          paymentMethod,
        }),
        loadRazorpayScript().catch(() => {}),
      ]);
      checkout = sessionOut;
      await payCheckoutSessionWithRazorpay(token, sessionOut, paymentMethod, {
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
      clearCart();
      toast.success("Order placed and paid successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (checkout && isRazorpayUserDismissed(err)) {
        await abandonCheckoutSession(token, checkout.sessionId).catch(() => {});
        toast.info("Checkout cancelled. Nothing was saved to your orders.");
      } else if (
        checkout &&
        (msg === "Payment failed." || msg.includes("Payment verification failed"))
      ) {
        toast.warning("Payment did not complete. You can review or retry under My Orders → Pending.");
        void navigate("/orders/pending");
      } else if (checkout) {
        await abandonCheckoutSession(token, checkout.sessionId).catch(() => {});
        toast.error(msg || "Could not complete checkout.");
      } else {
        toast.error(msg || "Failed to start checkout.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <SectionWrapper>
          <SectionHeading title="Cart" subtitle="Review your cart and place your order" />

          <div className="max-w-3xl mx-auto space-y-10">
            <section>
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                Cart {itemCount > 0 ? `(${itemCount} items)` : ""}
              </h3>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm mb-4">
                  Your cart is empty.{" "}
                  <Link to="/products" className="text-primary font-medium hover:underline">
                    Browse products
                  </Link>
                </p>
              ) : (
                <ul className="space-y-3 rounded-xl border border-border bg-card divide-y divide-border">
                  {items.map((line) => (
                    <li key={line.productId} className="flex flex-wrap items-center gap-3 p-4">
                      <img src={line.image} alt="" className="h-14 w-14 rounded-lg object-cover border border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{line.name}</p>
                        <p className="text-sm text-muted-foreground">₹{line.price.toFixed(2)} each</p>
                        {availability[line.productId]?.lowStock ? (
                          <p className="text-xs font-medium text-destructive mt-1">Limited products are available.</p>
                        ) : availability[line.productId]?.outOfStock ? (
                          <p className="text-xs font-medium text-destructive mt-1">Out of stock.</p>
                        ) : null}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                toast.error("Please sign in to place an order.");
                                return;
                              }
                              setPmForProductId(line.productId);
                              setPmOpen(true);
                            }}
                            disabled={!user || submitting || orderingOne === line.productId}
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 disabled:opacity-50"
                          >
                            {orderingOne === line.productId ? "Ordering…" : "Order this item"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={availability[line.productId]?.maxOrderable || undefined}
                          value={line.quantity}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            const max = availability[line.productId]?.maxOrderable;
                            if (typeof max === "number" && Number.isFinite(max) && max > 0) {
                              setQuantity(line.productId, Math.min(Math.max(1, Math.floor(n)), Math.floor(max)));
                              return;
                            }
                            setQuantity(line.productId, n);
                          }}
                          className="w-16 rounded-md border border-border px-2 py-1.5 text-sm bg-background text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => removeLine(line.productId)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground w-full sm:w-auto sm:text-right">
                        ₹{(line.price * line.quantity).toFixed(2)}
                      </p>
                    </li>
                  ))}
                  <li className="flex justify-between items-center p-4 font-semibold text-foreground">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </li>
                </ul>
              )}
            </section>

            <section>
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">Checkout</h3>

              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                {!user ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-5 text-sm">
                    <p className="font-semibold text-foreground">Sign in to place your order</p>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      You can browse products and use your cart without an account. When you are ready to order, log in or create an account.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Link
                        to="/auth"
                        state={{ from: location.pathname }}
                        className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/auth?mode=signup"
                        state={{ from: location.pathname }}
                        className="inline-flex items-center justify-center rounded-xl border-2 border-primary text-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary/5"
                      >
                        Create account
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Ordering as <span className="font-medium text-foreground">{user.name}</span> ({user.email})
                    </div>

                    {!addressOk ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
                        <p className="font-medium text-destructive">Please fill your delivery address.</p>
                        <p className="text-muted-foreground mt-1">
                          Go to{" "}
                          <Link to="/profile" className="text-primary font-medium hover:underline">
                            Profile
                          </Link>{" "}
                          and save your address, then come back to place the order.
                        </p>
                      </div>
                    ) : null}

                    <form onSubmit={handlePlaceOrder} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Payment method</label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            {
                              id: "upi" as const,
                              label: "UPI",
                              hint: "Google Pay, PhonePe, or any UPI app",
                            },
                            { id: "netbanking" as const, label: "Net banking", hint: "Pay from your bank account" },
                            { id: "card" as const, label: "Card", hint: "Debit or credit card" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setPaymentMethod(m.id);
                                void loadRazorpayScript().catch(() => {});
                              }}
                              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                                paymentMethod === m.id ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                              }`}
                            >
                              <span className="block text-sm font-medium text-foreground">{m.label}</span>
                              <span className="block text-xs text-muted-foreground mt-0.5">{m.hint}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={placeOrderDisabled}
                        onMouseEnter={() => void loadRazorpayScript().catch(() => {})}
                        onFocus={() => void loadRazorpayScript().catch(() => {})}
                        className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {submitting ? "Placing order…" : "Place order"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </section>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
      <PaymentMethodDialog
        open={pmOpen}
        onOpenChange={(o) => {
          if (o && !user) {
            toast.error("Please log in to place an order.");
            navigate("/auth", { state: { from: location.pathname } });
            return;
          }
          if (o) void loadRazorpayScript().catch(() => {});
          setPmOpen(o);
          if (!o) setPmForProductId(null);
        }}
        value={paymentMethod}
        onChange={setPaymentMethod}
        title="Payment method"
        confirmLabel="Place order"
        confirming={!!pmForProductId && orderingOne === pmForProductId}
        onConfirm={() => {
          if (!pmForProductId) return;
          setPmOpen(false);
          void handleOrderSingle(pmForProductId, paymentMethod);
        }}
      />
    </>
  );
};

export default Cart;

