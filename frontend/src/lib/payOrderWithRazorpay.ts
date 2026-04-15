import type { PaymentMethod } from "@/components/checkout/PaymentMethodDialog";
import { createRazorpayOrderForCheckout, type CheckoutSessionBundle, type OrderDoc } from "@/lib/orderApi";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpayCheckout";

type UserLite = { name?: string; email?: string; phone?: string };

/** Pay an existing unpaid order (My Orders → Pay now). */
export async function payOrderWithRazorpay(
  token: string,
  order: OrderDoc,
  paymentMethod: PaymentMethod,
  user: UserLite,
): Promise<void> {
  const [bundle] = await Promise.all([createRazorpayOrderForCheckout(token, order._id), loadRazorpayScript()]);
  await openRazorpayCheckout({
    bundle,
    token,
    verifyTarget: { type: "order", orderMongoId: order._id },
    paymentMethod,
    prefill: { name: user.name, email: user.email, phone: user.phone },
  });
}

/** Pay a new cart / product checkout session (no Order row until success or payment failure). */
export async function payCheckoutSessionWithRazorpay(
  token: string,
  session: CheckoutSessionBundle,
  paymentMethod: PaymentMethod,
  user: UserLite,
): Promise<void> {
  await openRazorpayCheckout({
    bundle: {
      keyId: session.keyId,
      amount: session.amount,
      currency: session.currency,
      razorpayOrderId: session.razorpayOrderId,
    },
    token,
    verifyTarget: { type: "checkoutSession", sessionId: session.sessionId },
    paymentMethod,
    prefill: { name: user.name, email: user.email, phone: user.phone },
  });
}
