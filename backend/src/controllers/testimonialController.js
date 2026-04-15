const Testimonial = require("../models/Testimonial");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

function avatarFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

/** Storefront + public API: approved only (legacy docs without `status` count as approved). */
const listTestimonials = asyncHandler(async (_req, res) => {
  const rows = await Testimonial.find({
    $or: [{ status: "approved" }, { status: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: rows });
});

/** Admin: all testimonials, newest first. */
const listAllTestimonials = asyncHandler(async (_req, res) => {
  const rows = await Testimonial.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: rows });
});

/** Logged-in customer: submit review for admin approval. */
const submitCustomerTestimonial = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Not authorized.");
  const text = req.body.text != null ? String(req.body.text).trim() : "";
  if (!text) throw new ApiError(400, "Review text is required.");

  let rating = Number(req.body.rating);
  if (!Number.isFinite(rating)) rating = 5;
  rating = Math.min(5, Math.max(1, Math.round(rating)));

  const name = String(req.user.name || "").trim() || String(req.user.email || "").trim();
  if (!name) throw new ApiError(400, "Please set your name in your profile.");

  const avatar = avatarFromName(name);
  const doc = await Testimonial.create({ name, text, rating, avatar, status: "pending" });
  res.status(201).json({ success: true, data: doc });
});

const approveTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Testimonial.findById(id);
  if (!doc) throw new ApiError(404, "Testimonial not found.");
  doc.status = "approved";
  await doc.save();
  const out = await Testimonial.findById(id).lean();
  res.json({ success: true, data: out });
});

const createTestimonial = asyncHandler(async (req, res) => {
  const name = req.body.name != null ? String(req.body.name).trim() : "";
  const text = req.body.text != null ? String(req.body.text).trim() : "";
  if (!name) throw new ApiError(400, "Name is required.");
  if (!text) throw new ApiError(400, "Review text is required.");

  let rating = Number(req.body.rating);
  if (!Number.isFinite(rating)) rating = 5;
  rating = Math.min(5, Math.max(1, Math.round(rating)));

  const avatarRaw = req.body.avatar != null ? String(req.body.avatar).trim() : "";
  const avatar = avatarRaw || avatarFromName(name);

  const doc = await Testimonial.create({ name, text, rating, avatar, status: "approved" });
  res.status(201).json({ success: true, data: doc });
});

const deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Testimonial.findById(id);
  if (!doc) throw new ApiError(404, "Testimonial not found.");
  await doc.deleteOne();
  res.json({ success: true, message: "Testimonial deleted." });
});

module.exports = {
  listTestimonials,
  listAllTestimonials,
  submitCustomerTestimonial,
  approveTestimonial,
  createTestimonial,
  deleteTestimonial,
};
