const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "India" },
    phone: { type: String, trim: true, default: "" },
    phoneAlt: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

/**
 * Temporary checkout (stock reserved, Razorpay order created).
 * No Order document until payment succeeds or definitively fails — dismiss = DELETE session + restock.
 */
const checkoutSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    shippingAddress: { type: addressSchema, default: () => ({}) },
    paymentMethod: {
      type: String,
      enum: ["upi", "netbanking", "card"],
      default: "upi",
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one line item is required",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    razorpayOrderId: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
