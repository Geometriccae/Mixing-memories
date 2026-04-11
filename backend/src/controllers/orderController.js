const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const ALLOWED_STATUSES = ["placed", "shipped", "completed", "cancelled"];
const ALLOWED_PAYMENT_METHODS = ["cod", "upi", "online"];
const ALLOWED_PAYMENT_STATUS = ["pending", "paid", "failed"];

async function restockOrderItems(items) {
  if (!Array.isArray(items)) return;
  for (const row of items) {
    const pid = row.productId;
    if (!pid || !mongoose.Types.ObjectId.isValid(String(pid))) continue;
    const qty = Math.floor(Number(row.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;
    await Product.findByIdAndUpdate(pid, { $inc: { stock: qty } });
  }
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
  const out = {
    line1: a.line1 != null ? String(a.line1).trim() : "",
    line2: a.line2 != null ? String(a.line2).trim() : "",
    city: a.city != null ? String(a.city).trim() : "",
    state: a.state != null ? String(a.state).trim() : "",
    pincode: a.pincode != null ? String(a.pincode).trim() : "",
    country: a.country != null ? String(a.country).trim() : "India",
  };
  return out;
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
    const exists = await Order.findOne({ orderNumber }).select("_id").lean();
    if (!exists) return orderNumber;
  }
  throw new ApiError(500, "Could not allocate order id. Please try again.");
}

const createOrder = asyncHandler(async (req, res) => {
  const { items: bodyItems, paymentMethod } = req.body || {};
  const items = normalizeItems(bodyItems);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  for (const item of items) {
    if (!item.productId) {
      throw new ApiError(400, "Each cart item must include a product id. Please clear the cart and add products again.");
    }
  }

  const pm = paymentMethod ? String(paymentMethod).trim().toLowerCase() : "cod";
  if (!ALLOWED_PAYMENT_METHODS.includes(pm)) {
    throw new ApiError(400, `paymentMethod must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`);
  }

  // Require authenticated user (set by protect middleware)
  const u = req.user;
  if (!u) throw new ApiError(401, "Not authorized.");

  const snapName = String(u.name || "").trim();
  const snapEmail = String(u.email || "").trim().toLowerCase();
  const snapPhone = u.phone != null ? String(u.phone).trim() : "";
  if (!snapName || !snapEmail) throw new ApiError(400, "Please complete your profile (name + email).");

  const addrBody = normalizeShippingAddress(req.body && req.body.shippingAddress);
  const addrProfile = normalizeShippingAddress(u.address);
  const shippingAddress = isAddressFilled(addrBody) ? addrBody : addrProfile;
  if (!isAddressFilled(shippingAddress)) {
    throw new ApiError(400, "Please fill your delivery address in Profile before placing an order.");
  }

  const decremented = [];

  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        const p = await Product.findById(item.productId);
        const avail = p ? Math.max(0, Math.floor(Number(p.stock) || 0)) : 0;
        throw new ApiError(400, `Not enough stock for "${item.name}". Only ${avail} available.`);
      }
      decremented.push({ id: item.productId, qty: item.quantity });
    }

    const orderNumber = await allocateOrderNumber();
    const order = await Order.create({
      orderNumber,
      userId: u._id,
      customerName: snapName,
      email: snapEmail,
      phone: snapPhone,
      shippingAddress,
      paymentMethod: pm,
      paymentStatus: pm === "cod" ? "pending" : "pending",
      items,
      totalAmount,
      status: "placed",
    });

    const saved = await Order.findById(order._id).lean();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    for (const d of decremented.reverse()) {
      await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } });
    }
    throw err;
  }
});

const listOrders = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.query;
  const filter = {};
  if (status && ALLOWED_STATUSES.includes(String(status))) {
    filter.status = String(status);
  }
  if (paymentStatus && ALLOWED_PAYMENT_STATUS.includes(String(paymentStatus))) {
    filter.paymentStatus = String(paymentStatus);
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: orders });
});

const getOrdersByCustomerEmail = asyncHandler(async (req, res) => {
  const email = req.query.email != null ? String(req.query.email).trim().toLowerCase() : "";
  if (!email) {
    throw new ApiError(400, "email query parameter is required.");
  }
  const orders = await Order.find({ email }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: orders });
});

const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Not authorized.");
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: orders });
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Not authorized.");
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order id.");
  }
  const order = await Order.findOne({ _id: id, userId: req.user._id });
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.status === "cancelled") {
    throw new ApiError(400, "Order is already cancelled.");
  }
  if (order.status !== "placed") {
    throw new ApiError(400, "You can only cancel orders that have not shipped yet.");
  }
  await restockOrderItems(order.items);
  order.status = "cancelled";
  order.cancelledBy = "user";
  order.cancelReason = "";
  await order.save();
  const out = await Order.findById(order._id).lean();
  res.json({ success: true, data: out });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, cancelReason } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order id.");
  }
  if (!status || !ALLOWED_STATUSES.includes(String(status))) {
    throw new ApiError(400, `status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }
  const nextStatus = String(status);
  const existing = await Order.findById(id);
  if (!existing) throw new ApiError(404, "Order not found.");

  if (existing.status === "cancelled" && nextStatus !== "cancelled") {
    throw new ApiError(400, "Cannot change status of a cancelled order.");
  }

  if (nextStatus === "cancelled") {
    if (existing.status === "cancelled") {
      const out = await Order.findById(id).lean();
      return res.json({ success: true, data: out });
    }
    const reason = cancelReason != null ? String(cancelReason).trim() : "";
    if (!reason) {
      throw new ApiError(400, "cancelReason is required when cancelling an order as admin.");
    }
    await restockOrderItems(existing.items);
    existing.status = "cancelled";
    existing.cancelledBy = "admin";
    existing.cancelReason = reason.slice(0, 2000);
    await existing.save();
    const out = await Order.findById(id).lean();
    return res.json({ success: true, data: out });
  }

  existing.status = nextStatus;
  await existing.save();
  const out = await Order.findById(id).lean();
  res.json({ success: true, data: out });
});

const updateOrderPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order id.");
  }
  const next = paymentStatus != null ? String(paymentStatus).toLowerCase() : "";
  if (!ALLOWED_PAYMENT_STATUS.includes(next)) {
    throw new ApiError(400, `paymentStatus must be one of: ${ALLOWED_PAYMENT_STATUS.join(", ")}`);
  }
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found.");
  order.paymentStatus = next;
  await order.save();
  const out = await Order.findById(id).lean();
  res.json({ success: true, data: out });
});

module.exports = {
  createOrder,
  listOrders,
  getOrdersByCustomerEmail,
  getMyOrders,
  cancelMyOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
};
