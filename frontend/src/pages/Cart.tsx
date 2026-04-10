import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProductsAvailability, type ProductAvailability } from "@/lib/catalogApi";
import { createOrder } from "@/lib/orderApi";
import PaymentMethodDialog, { type PaymentMethod } from "@/components/checkout/PaymentMethodDialog";

const Cart = () => {
  const location = useLocation();
  const { user, token, isLoading } = useAuth();
  const { items, setQuantity, removeLine, clearCart, subtotal, itemCount } = useCart();
  const [availability, setAvailability] = useState<Record<string, ProductAvailability>>({});
  const [submitting, setSubmitting] = useState(false);
  const [orderingOne, setOrderingOne] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
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
    return Boolean(a.line1 && a.city && a.state && a.pincode);
  }, [user]);

  if (!isLoading && !user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  const placeOrderDisabled = submitting || items.length === 0;

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
    try {
      const avail = await fetchProductsAvailability([productId]);
      const a = avail[productId];
      const max = a ? Number(a.maxOrderable) : 0;
      if (!Number.isFinite(max) || max < 1) {
        throw new Error(`"${line.name}" is out of stock.`);
      }
      if (line.quantity > max) {
        throw new Error(`Not enough stock for "${line.name}". Only ${max} available.`);
      }

      await createOrder(token, {
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
      });

      removeLine(productId);
      toast.success("Order placed successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to place order.");
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
    try {
      const ids = items.map((l) => l.productId).filter(Boolean);
      const avail = await fetchProductsAvailability(ids);
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

      await createOrder(token, {
        items: items.map((l) => ({
          productId: l.productId,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
          image: l.image,
        })),
        paymentMethod,
      });

      clearCart();
      toast.success("Order placed successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to place order.");
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
                              setPmForProductId(line.productId);
                              setPmOpen(true);
                            }}
                            disabled={submitting || orderingOne === line.productId}
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
                <div className="text-sm text-muted-foreground">
                  {user ? (
                    <>
                      Ordering as <span className="font-medium text-foreground">{user.name}</span> ({user.email})
                    </>
                  ) : (
                    "Sign in to place an order."
                  )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "cod" as const, label: "Cash on delivery" },
                        { id: "upi" as const, label: "UPI" },
                        { id: "online" as const, label: "Online payment" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                            paymentMethod === m.id ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={placeOrderDisabled}
                    className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? "Placing order…" : "Place order"}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
      <PaymentMethodDialog
        open={pmOpen}
        onOpenChange={(o) => {
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

