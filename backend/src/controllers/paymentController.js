const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { withMongoOpRetry } = require("../utils/mongoReadRetry");

function getRazorpayClient() {
  const key_id = env.razorpayKeyId;
  const key_secret = env.razorpayKeySecret;
  if (!key_id || !key_secret) {
    throw new ApiError(503, "Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.");
  }
  return new Razorpay({ key_id, key_secret });
}

function amountToPaise(totalAmount) {
  const n = Number(totalAmount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) throw new ApiError(400, "orderId is required.");

  const order = await withMongoOpRetry(() => Order.findById(orderId));
  if (!order) throw new ApiError(404, "Order not found.");
  if (String(order.userId) !== String(req.user._id)) {
    throw new ApiError(403, "You cannot pay for this order.");
  }
  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "This order is already paid.");
  }

  const paise = amountToPaise(order.totalAmount);
  if (paise < 100) {
    throw new ApiError(400, "Order total must be at least ₹1 to pay online.");
  }

  const rzp = getRazorpayClient();
  const receipt = String(order.orderNumber || order._id)
    .replace(/\s/g, "")
    .slice(0, 40);

  const rp = await rzp.orders.create({
    amount: paise,
    currency: "INR",
    receipt,
    notes: {
      orderMongoId: String(order._id),
      orderNumber: order.orderNumber || "",
    },
  });

  order.razorpayOrderId = rp.id;
  await withMongoOpRetry(() => order.save());

  res.json({
    success: true,
    data: {
      keyId: env.razorpayKeyId,
      amount: paise,
      currency: "INR",
      razorpayOrderId: rp.id,
      orderNumber: order.orderNumber,
    },
  });
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature: rawSig } = req.body || {};
  const razorpay_signature = rawSig != null ? String(rawSig).trim() : "";
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "orderId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required.");
  }

  if (!env.razorpayKeySecret) {
    throw new ApiError(503, "Payments are not configured.");
  }

  const order = await withMongoOpRetry(() => Order.findById(orderId));
  if (!order) throw new ApiError(404, "Order not found.");
  if (String(order.userId) !== String(req.user._id)) {
    throw new ApiError(403, "You cannot verify payment for this order.");
  }
  if (String(order.razorpayOrderId) !== String(razorpay_order_id)) {
    throw new ApiError(400, "This Razorpay order does not match your checkout.");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(razorpay_signature), "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    order.paymentStatus = "failed";
    await withMongoOpRetry(() => order.save());
    throw new ApiError(400, "Payment verification failed.");
  }

  order.paymentStatus = "paid";
  await withMongoOpRetry(() => order.save());
  const saved = await withMongoOpRetry(() => Order.findById(order._id).lean());
  res.json({ success: true, data: saved });
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
