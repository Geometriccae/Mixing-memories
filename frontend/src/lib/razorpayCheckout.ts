import type { PaymentMethod } from "@/components/checkout/PaymentMethodDialog";
import { verifyRazorpayPayment, type RazorpayCheckoutBundle } from "@/lib/orderApi";

type Prefill = { name?: string; email?: string; phone?: string };

/**
 * Narrow checkout to the method the user already picked in our UI.
 *
 * Do **not** use a custom `blocks` + `show_default_blocks: false` with only `{ method: "upi" }` — that
 * drops Razorpay’s default UPI instruments (QR / routing) and triggers “No appropriate payment method found.”
 * Hiding other methods keeps the default UPI block intact.
 */
function checkoutConfigHideExcept(chosen: PaymentMethod): Record<string, unknown> {
  const hide: { method: string }[] = [];
  if (chosen !== "upi") hide.push({ method: "upi" });
  if (chosen !== "card") hide.push({ method: "card" });
  if (chosen !== "netbanking") hide.push({ method: "netbanking" });
  hide.push({ method: "wallet" }, { method: "emi" }, { method: "paylater" });
  return { display: { hide } };
}

/** UPI Intent (in-browser app list) is for mobile; forcing it on desktop can leave Razorpay’s modal blank — use default QR flow on PC. */
function isLikelyMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function normalizeIndianContact(raw?: string): string {
  const s = String(raw ?? "")
    .trim()
    .replace(/\s/g, "");
  if (!s) return "";
  if (/^\+/.test(s)) return s;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return s;
}

/** Razorpay UPI routing often expects both `contact` and `email`; phone-only accounts get a disposable address. */
function effectiveCheckoutPrefill(prefill?: Prefill) {
  const contact = normalizeIndianContact(prefill?.phone);
  const emailRaw = String(prefill?.email ?? "").trim();
  const email =
    emailRaw ||
    (contact
      ? `checkout${contact.replace(/\D/g, "").slice(-10)}@noreply.royaloven.invalid`
      : "");
  return {
    name: String(prefill?.name ?? "").trim(),
    email,
    contact,
  };
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window."));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay.")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(s);
  });
}

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type OpenRazorpayOpts = {
  bundle: RazorpayCheckoutBundle;
  token: string;
  orderMongoId: string;
  paymentMethod: PaymentMethod;
  prefill?: Prefill;
};

/**
 * Opens Razorpay Standard Checkout with only the selected method enabled
 * (UPI shows in-app options like Google Pay / PhonePe when the customer pays on mobile / supported browsers).
 */
export function openRazorpayCheckout(opts: OpenRazorpayOpts): Promise<void> {
  const { bundle, token, orderMongoId, paymentMethod, prefill } = opts;
  return loadRazorpayScript().then(
    () =>
      new Promise((resolve, reject) => {
        const Ctor = window.Razorpay;
        if (!Ctor) {
          reject(new Error("Razorpay failed to load."));
          return;
        }
        let paymentHandled = false;
        const prefillPayload = effectiveCheckoutPrefill(prefill);
        const mobile = isLikelyMobileBrowser();
        const desktopUpi = paymentMethod === "upi" && !mobile;

        /**
         * Desktop UPI: boolean `method` map only — no `config.display.hide` (breaks QR/instruments).
         * Card: same idea — `display.hide` can collapse the card rail to a single saved token with no
         * “new card” / switch path; boolean map keeps the full card experience.
         * Mobile UPI / netbanking: `hide` + optional string `method` for routing.
         */
        const methodRestriction = {
          upi: paymentMethod === "upi",
          card: paymentMethod === "card",
          netbanking: paymentMethod === "netbanking",
          wallet: false,
          emi: false,
          paylater: false,
        };

        const options: Record<string, unknown> = {
          key: bundle.keyId,
          amount: bundle.amount,
          currency: bundle.currency,
          order_id: bundle.razorpayOrderId,
          name: "Royal Oven",
          description: bundle.orderNumber ? `Order ${bundle.orderNumber}` : "Order payment",
          ...(desktopUpi || paymentMethod === "card"
            ? { method: methodRestriction }
            : {
                config: checkoutConfigHideExcept(paymentMethod),
                ...(paymentMethod === "upi" && mobile ? { upi: { flow: "intent" as const } } : {}),
                ...(prefillPayload.email.trim() && prefillPayload.contact ? { method: paymentMethod } : {}),
              }),
          prefill: prefillPayload,
          theme: { color: "#000533" },
          handler: (response: RazorpayHandlerResponse) => {
            paymentHandled = true;
            void (async () => {
              try {
                await verifyRazorpayPayment(
                  token,
                  orderMongoId,
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                );
                resolve();
              } catch (e) {
                reject(e instanceof Error ? e : new Error(String(e)));
              }
            })();
          },
          modal: {
            ondismiss: () => {
              queueMicrotask(() => {
                if (!paymentHandled) {
                  reject(new Error("Payment was cancelled."));
                }
              });
            },
          },
        };
        const rzp = new Ctor(options);
        rzp.open();
      }),
  );
}
