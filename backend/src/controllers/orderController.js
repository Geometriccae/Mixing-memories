const mongoose = require("mongoose");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const ALLOWED_STATUSES = ["placed", "shipped", "completed", "cancelled"];

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

const createOrder = asyncHandler(async (req, res) => {
  const { customerName, email, phone, address, items: bodyItems } = req.body;
  if (!customerName || !email) {
    throw new ApiError(400, "customerName and email are required.");
  }
  const items = normalizeItems(bodyItems);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    customerName: String(customerName).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone != null ? String(phone).trim() : "",
    address: address != null ? String(address).trim() : "",
    items,
    totalAmount,
    status: "placed",
  });

  const saved = await Order.findById(order._id).lean();
  res.status(201).json({ success: true, data: saved });
});

const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && ALLOWED_STATUSES.includes(String(status))) {
    filter.status = String(status);
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

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order id.");
  }
  if (!status || !ALLOWED_STATUSES.includes(String(status))) {
    throw new ApiError(400, `status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }
  const order = await Order.findByIdAndUpdate(id, { status: String(status) }, { new: true }).lean();
  if (!order) throw new ApiError(404, "Order not found.");
  res.json({ success: true, data: order });
});

module.exports = {
  createOrder,
  listOrders,
  getOrdersByCustomerEmail,
  updateOrderStatus,
};
