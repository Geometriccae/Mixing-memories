const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");
const CheckoutSession = require("../models/CheckoutSession");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { bustDetailJsonCache } = require("../utils/productDetailJsonCache");
const { withMongoOpRetry } = require("../utils/mongoReadRetry");
const { getActiveShippingFromUser } = require("../utils/userShippingAddress");

const ALLOWED_PAYMENT_METHODS = ["upi", "netbanking", "card"];

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

function normalizeItems(bodyItems) {
  if (!Array.isArray(bodyItems) || bodyItems.length === 0) {
    throw new ApiError(400, "items must be a non-empty array.");
  }
  return bodyItems.map((row) => {
    const name = String(row.name || "").trim();
    const price = Number(row.price);
    const quantity = Math.floor(Number(row.quantity));
    if (!name) throw new ApiError(400, "Each item must have a name.");
    if (!Number.isFinite(price) || price < 0) throw new ApiError(400, "Each item must have a valid price.");
    if (!Number.isFinite(quantity) || quantity < 1) throw new ApiError(400, "Each item must have quantity >= 1.");
    let productId = null;
    if (row.productId && mongoose.Types.ObjectId.isValid(String(row.productId))) {
      productId = new mongoose.Types.ObjectId(String(row.productId));
    }
    const image = typeof row.image === "string" ? row.image : "";
    return { productId, name, price, quantity, image };
  });
}

function normalizeShippingAddress(addr) {
  const a = addr && typeof addr === "object" ? addr : {};
  return {
    line1: a.line1 != null ? String(a.line1).trim() : "",
    line2: a.line2 != null ? String(a.line2).trim() : "",
    city: a.city != null ? String(a.city).trim() : "",
    state: a.state != null ? String(a.state).trim() : "",
    pincode: a.pincode != null ? String(a.pincode).trim() : "",
    country: a.country != null ? String(a.country).trim() : "India",
    phone: a.phone != null ? String(a.phone).trim() : "",
    phoneAlt: a.phoneAlt != null ? String(a.phoneAlt).trim() : "",
  };
}

function isAddressFilled(a) {
  if (!a) return false;
  return Boolean(String(a.line1 || "").trim() && String(a.city || "").trim() && String(a.state || "").trim() && String(a.pincode || "").trim());
}

async function allocateOrderNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const d = new Date();
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `MM-${y}${mo}${day}-${rand}`;
    const exists = await withMongoOpRetry(() => Order.findOne({ orderNumber }).select("_id").lean());
    if (!exists) return orderNumber;
  }
  throw new ApiError(500, "Could not allocate order id. Please try again.");
}

async function restockSessionItems(items) {
  if (!Array.isArray(items)) return;
  for (const row of items) {
    const pid = row.productId;
    if (!pid || !mongoose.Types.ObjectId.isValid(String(pid))) continue;
    const qty = Math.floor(Number(row.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;
    await withMongoOpRetry(() => Product.findByIdAndUpdate(pid, { $inc: { stock: qty } }));
    bustDetailJsonCache(String(pid));
  }
}

async function finalizeOrderFromSession(session, { paymentStatus, razorpayOrderId, razorpayPaymentId }) {
  const orderNumber = await allocateOrderNumber();
  const order = await withMongoOpRetry(() =>
    Order.create({
      orderNumber,
      userId: session.userId,
      customerName: session.customerName,
      email: session.email,
      phone: session.phone,
      shippingAddress: session.shippingAddress,
      paymentMethod: session.paymentMethod,
      paymentStatus,
      razorpayOrderId: razorpayOrderId != null ? String(razorpayOrderId).trim() : String(session.razorpayOrderId || "").trim(),
      razorpayPaymentId: razorpayPaymentId != null ? String(razorpayPaymentId).trim() : "",
      items: session.items,
      totalAmount: session.totalAmount,
      status: "placed",
    }),
  );
  await withMongoOpRetry(() => CheckoutSession.deleteOne({ _id: session._id }));
  for (const item of session.items) {
    if (item.productId) bustDetailJsonCache(String(item.productId));
  }
  return withMongoOpRetry(() => Order.findById(order._id).lean());
}

/** Start Razorpay checkout without creating an Order row (dismiss = delete session + restock). */
const startCheckoutSession = asyncHandler(async (req, res) => {
  const { items: bodyItems, paymentMethod } = req.body || {};
  const items = normalizeItems(bodyItems);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  for (const item of items) {
    if (!item.productId) {
      throw new ApiError(400, "Each cart item must include a product id. Please clear the cart and add products again.");
    }
  }

  const pm = paymentMethod ? String(paymentMethod).trim().toLowerCase() : "upi";
  if (!ALLOWED_PAYMENT_METHODS.includes(pm)) {
    throw new ApiError(400, `paymentMethod must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`);
  }

  const u = req.user;
  if (!u) throw new ApiError(401, "Not authorized.");

  const snapName = String(u.name || "").trim();
  const snapEmail = String(u.email || "").trim().toLowerCase();
  const snapPhone = u.phone != null ? String(u.phone).trim() : "";
  if (!snapName || !snapEmail) throw new ApiError(400, "Please complete your profile (name + email).");

  const addrBody = normalizeShippingAddress(req.body && req.body.shippingAddress);
  const addrProfile = normalizeShippingAddress(getActiveShippingFromUser(u));
  const shippingAddress = isAddressFilled(addrBody) ? addrBody : addrProfile;
  if (!isAddressFilled(shippingAddress)) {
    throw new ApiError(400, "Please fill your delivery address in Profile before placing an order.");
  }

  const shipPhone = shippingAddress.phone != null ? String(shippingAddress.phone).trim() : "";
  const sessionPhone = shipPhone || snapPhone;

  const paise = amountToPaise(totalAmount);
  if (paise < 100) {
    throw new ApiError(400, "Order total must be at least ₹1 to pay online.");
  }

  const decremented = [];
  let session = null;

  try {
    /** Different line items → stock decrements can run in parallel (faster than sequential). */
    const results = await Promise.all(
      items.map((item) =>
        withMongoOpRetry(() =>
          Product.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true },
          ),
        ),
      ),
    );

    for (let i = 0; i < results.length; i += 1) {
      if (!results[i]) {
        const item = items[i];
        const p = await withMongoOpRetry(() => Product.findById(item.productId));
        const avail = p ? Math.max(0, Math.floor(Number(p.stock) || 0)) : 0;
        for (let j = 0; j < i; j += 1) {
          const prev = items[j];
          if (prev.productId) {
            await withMongoOpRetry(() =>
              Product.findByIdAndUpdate(prev.productId, { $inc: { stock: prev.quantity } }),
            );
            bustDetailJsonCache(String(prev.productId));
          }
        }
        throw new ApiError(400, `Not enough stock for "${item.name}". Only ${avail} available.`);
      }
    }

    for (const item of items) {
      decremented.push({ id: item.productId, qty: item.quantity });
    }

    session = await withMongoOpRetry(() =>
      CheckoutSession.create({
        userId: u._id,
        customerName: snapName,
        email: snapEmail,
        phone: sessionPhone,
        shippingAddress,
        paymentMethod: pm,
        items,
        totalAmount,
      }),
    );

    const rzp = getRazorpayClient();
    const receipt = `CS-${String(session._id).replace(/\s/g, "").slice(-24)}`.slice(0, 40);
    const rp = await rzp.orders.create({
      amount: paise,
      currency: "INR",
      receipt,
      notes: {
        checkoutSessionId: String(session._id),
      },
    });

    session.razorpayOrderId = rp.id;
    await withMongoOpRetry(() => session.save());

    for (const item of items) {
      if (item.productId) bustDetailJsonCache(String(item.productId));
    }

    res.status(201).json({
      success: true,
      data: {
        sessionId: String(session._id),
        keyId: env.razorpayKeyId,
        amount: paise,
        currency: "INR",
        razorpayOrderId: rp.id,
      },
    });
  } catch (err) {
    if (session) {
      await withMongoOpRetry(() => CheckoutSession.deleteOne({ _id: session._id }));
    }
    for (const d of decremented.reverse()) {
      await withMongoOpRetry(() => Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } }));
    }
    throw err;
  }
});

const verifyCheckoutSession = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature: rawSig } = req.body || {};
  const razorpay_signature = rawSig != null ? String(rawSig).trim() : "";
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid session id.");
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "razorpay_order_id, razorpay_payment_id and razorpay_signature are required.");
  }
  if (!env.razorpayKeySecret) {
    throw new ApiError(503, "Payments are not configured.");
  }

  const session = await withMongoOpRetry(() => CheckoutSession.findById(id));
  if (!session) throw new ApiError(404, "Checkout session not found or already completed.");
  if (String(session.userId) !== String(req.user._id)) {
    throw new ApiError(403, "You cannot complete this checkout.");
  }
  if (String(session.razorpayOrderId) !== String(razorpay_order_id)) {
    throw new ApiError(400, "This Razorpay order does not match your checkout.");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(razorpay_signature), "utf8");

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await finalizeOrderFromSession(session, {
      paymentStatus: "failed",
      razorpayOrderId: razorpay_order_id,
    });
    throw new ApiError(400, "Payment verification failed.");
  }

  const saved = await finalizeOrderFromSession(session, {
    paymentStatus: "paid",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });
  res.json({ success: true, data: saved });
});

const abandonCheckoutSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid session id.");
  }
  const session = await withMongoOpRetry(() => CheckoutSession.findById(id));
  if (!session) {
    return res.json({ success: true, data: { removed: true } });
  }
  if (String(session.userId) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed.");
  }
  await restockSessionItems(session.items);
  for (const item of session.items) {
    if (item.productId) bustDetailJsonCache(String(item.productId));
  }
  await withMongoOpRetry(() => CheckoutSession.deleteOne({ _id: session._id }));
  res.json({ success: true, data: { removed: true } });
});

/** Razorpay payment.failed (e.g. bank decline) — keep stock committed, create a failed Order for My Orders. */
const checkoutSessionPaymentFailed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid session id.");
  }
  const session = await withMongoOpRetry(() => CheckoutSession.findById(id));
  if (!session) {
    return res.json({ success: true, data: { alreadyHandled: true } });
  }
  if (String(session.userId) !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed.");
  }
  const saved = await finalizeOrderFromSession(session, {
    paymentStatus: "failed",
    razorpayOrderId: session.razorpayOrderId,
  });
  res.json({ success: true, data: saved });
});

module.exports = {
  startCheckoutSession,
  verifyCheckoutSession,
  abandonCheckoutSession,
  checkoutSessionPaymentFailed,
};
