const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");

function signToken(id, role) {
  return jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function formatUser(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const addr = o.address || {};
  return {
    id: String(o._id),
    name: o.name,
    email: o.email,
    role: o.role,
    phone: o.phone ?? "",
    address: {
      line1: addr.line1 ?? "",
      line2: addr.line2 ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      pincode: addr.pincode ?? "",
      country: addr.country ?? "India",
    },
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "Email already exists.");

  const safeRole = role === "admin" ? "admin" : "user";
  const user = await User.create({ name, email, password, role: safeRole });

  const token = signToken(user._id, user.role);
  const fresh = await User.findById(user._id);
  res.status(201).json({
    success: true,
    data: {
      token,
      user: formatUser(fresh),
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const identifierRaw = req.body && (req.body.identifier || req.body.email || req.body.username);
  const password = req.body && req.body.password;
  if (!identifierRaw || !password) {
    throw new ApiError(400, "identifier and password are required.");
  }

  const identifier = String(identifierRaw).trim();
  const isEmail = identifier.includes("@");
  const query = isEmail
    ? { email: identifier.toLowerCase() }
    : { name: { $regex: `^${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } };

  const user = await User.findOne(query).select("+password");
  if (!user) throw new ApiError(401, "Invalid credentials.");

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Invalid credentials.");

  const token = signToken(user._id, user.role);
  const fresh = await User.findById(user._id);
  res.json({
    success: true,
    data: {
      token,
      user: formatUser(fresh),
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: formatUser(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found.");

  if (name !== undefined && name !== null) {
    const n = String(name).trim();
    if (!n) throw new ApiError(400, "name cannot be empty.");
    user.name = n;
  }

  if (phone !== undefined && phone !== null) {
    user.phone = String(phone).trim();
  }

  if (address !== undefined && address !== null && typeof address === "object") {
    if (!user.address) user.address = {};
    const keys = ["line1", "line2", "city", "state", "pincode", "country"];
    keys.forEach((k) => {
      if (address[k] !== undefined && address[k] !== null) {
        user.address[k] = String(address[k]).trim();
      }
    });
    user.markModified("address");
  }

  await user.save();
  res.json({ success: true, data: formatUser(user) });
});

module.exports = { register, login, me, updateProfile };
