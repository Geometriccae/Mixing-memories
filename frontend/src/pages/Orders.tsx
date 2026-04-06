import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/common/SectionWrapper";
import SectionHeading from "@/components/common/SectionHeading";
import { useCart } from "@/contexts/CartContext";
import { createOrder, fetchOrdersForCustomerEmail, type OrderDoc } from "@/lib/orderApi";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const EMAIL_STORAGE_KEY = "royal_oven_customer_email";

const Orders = () => {
  const { items, setQuantity, removeLine, clearCart, subtotal, itemCount } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_STORAGE_KEY) || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookupEmail, setLookupEmail] = useState(() => localStorage.getItem(EMAIL_STORAGE_KEY) || "");
  const [myOrders, setMyOrders] = useState<OrderDoc[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadOrdersForEmail = async (e: string) => {
    const trimmed = e.trim();
    if (!trimmed) {
      setMyOrders([]);
      return;
    }
    setLoadingOrders(true);
    try {
      const list = await fetchOrdersForCustomerEmail(trimmed);
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
    const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (stored) void loadOrdersForEmail(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceOrder = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!customerName.trim() || !email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        items: items.map((l) => ({
          productId: l.productId,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
          image: l.image,
        })),
      });
      localStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase());
      setLookupEmail(email.trim());
      clearCart();
      toast.success("Order placed successfully!");
      await loadOrdersForEmail(email.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <SectionWrapper>
          <SectionHeading title="Orders" subtitle="Review your cart, place an order, and track your purchases" />

          <div className="max-w-3xl mx-auto space-y-10">
            <section>
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">Cart {itemCount > 0 ? `(${itemCount} items)` : ""}</h3>
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
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => setQuantity(line.productId, Number(e.target.value))}
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
              <form onSubmit={handlePlaceOrder} className="space-y-4 max-w-xl">
                <input
                  type="text"
                  placeholder="Full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  placeholder="Delivery address (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-5 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? "Placing order…" : "Place order"}
                </button>
              </form>
            </section>

            <section>
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">My orders</h3>
              <p className="text-sm text-muted-foreground mb-3">Enter the email you used at checkout to load your order history.</p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-xl mb-6">
                <input
                  type="email"
                  placeholder="Email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  className="flex-1 px-5 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = lookupEmail.trim();
                    if (t) localStorage.setItem(EMAIL_STORAGE_KEY, t.toLowerCase());
                    void loadOrdersForEmail(t);
                  }}
                  className="px-6 py-3 rounded-xl bg-muted text-foreground font-medium border border-border hover:bg-muted/80"
                >
                  Load orders
                </button>
              </div>
              {loadingOrders ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : myOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders to show.</p>
              ) : (
                <ul className="space-y-4">
                  {myOrders.map((o) => (
                    <li key={o._id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          {new Date(o.createdAt || "").toLocaleString()}
                        </span>
                        <span className="text-muted-foreground capitalize">Status: {o.status}</span>
                      </div>
                      <p className="text-sm text-foreground mt-2">₹{Number(o.totalAmount).toFixed(2)} total</p>
                      <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                        {o.items.map((it, i) => (
                          <li key={i}>
                            {it.name} × {it.quantity} — ₹{(it.price * it.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
};

export default Orders;
