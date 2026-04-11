const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "India" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    /** Human-readable id for invoices (e.g. RO-20260410-ABC12X) */
    orderNumber: { type: String, trim: true, unique: true, sparse: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    /** Shipping address snapshot at order time */
    shippingAddress: { type: addressSchema, default: () => ({}) },
    paymentMethod: { type: String, enum: ["cod", "upi", "online"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one line item is required",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["placed", "shipped", "completed", "cancelled"],
      default: "placed",
    },
    /** Set when status is cancelled: who initiated */
    cancelledBy: { type: String, enum: ["user", "admin"], required: false },
    /** Admin cancellation message shown to the customer (optional for user-initiated cancel) */
    cancelReason: { type: String, default: "", trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
