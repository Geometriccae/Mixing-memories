import type { PaymentMethod } from "@/components/checkout/PaymentMethodDialog";
import { createRazorpayOrderForCheckout, type OrderDoc } from "@/lib/orderApi";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpayCheckout";

type UserLite = { name?: string; email?: string; phone?: string };

/** Creates a Razorpay session for an existing unpaid order and opens checkout. */
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
    orderMongoId: order._id,
    paymentMethod,
    prefill: { name: user.name, email: user.email, phone: user.phone },
  });
}
