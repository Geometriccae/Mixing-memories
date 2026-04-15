const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

/** Multiple delivery addresses; `defaultAddress` points at one `_id`. Legacy `address` is kept in sync on save. */
const savedAddressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Home" },
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "India" },
    phone: { type: String, trim: true, default: "" },
    phoneAlt: { type: String, trim: true, default: "" },
  },
  { _id: true },
);

/** Persisted storefront cart (synced across browsers for the same account). */
const savedCartLineSchema = new mongoose.Schema(
  {
    productId: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0 },
    image: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    phone: { type: String, trim: true, default: "" },
    /** @deprecated Use addresses + defaultAddress; kept in sync with active selection for older code paths. */
    address: { type: addressSchema, default: () => ({}) },
    addresses: { type: [savedAddressSchema], default: [] },
    defaultAddress: { type: mongoose.Schema.Types.ObjectId, default: null },
    savedCart: { type: [savedCartLineSchema], default: [] },
    /** Product ids (Mongo string) the customer liked */
    savedLikes: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
