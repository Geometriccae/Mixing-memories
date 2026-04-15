const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const {
  getActiveShippingFromUser,
  syncLegacyAddressField,
  isAddressFilled,
} = require("../utils/userShippingAddress");

function signToken(id, role) {
  return jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function normalizeSavedCart(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const productId = row.productId != null ? String(row.productId).trim() : "";
    const name = row.name != null ? String(row.name).trim() : "";
    const price = Number(row.price);
    const quantity = Math.floor(Number(row.quantity));
    const image = row.image != null ? String(row.image) : "";
    if (!productId || !name || !Number.isFinite(price) || price < 0) continue;
    if (!Number.isFinite(quantity) || quantity < 1) continue;
    out.push({
      productId,
      name,
      price,
      image,
      quantity: Math.min(999, quantity),
    });
    if (out.length >= 50) break;
  }
  return out;
}

function normalizeSavedLikes(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const id of raw) {
    if (id == null) continue;
    const s = String(id).trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 300) break;
  }
  return out;
}

function mapSavedAddressToApi(a) {
  if (!a) return null;
  return {
    id: String(a._id),
    label: a.label != null ? String(a.label).trim() || "Home" : "Home",
    line1: a.line1 != null ? String(a.line1).trim() : "",
    line2: a.line2 != null ? String(a.line2).trim() : "",
    city: a.city != null ? String(a.city).trim() : "",
    state: a.state != null ? String(a.state).trim() : "",
    pincode: a.pincode != null ? String(a.pincode).trim() : "",
    country: a.country != null ? String(a.country).trim() || "India" : "India",
    phone: a.phone != null ? String(a.phone).trim() : "",
    phoneAlt: a.phoneAlt != null ? String(a.phoneAlt).trim() : "",
  };
}

function formatUser(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const addrs = Array.isArray(o.addresses) ? o.addresses : [];
  let addressesOut = addrs.map((a) => mapSavedAddressToApi(a)).filter(Boolean);
  let defaultAddressId =
    o.defaultAddress != null && String(o.defaultAddress).length > 0 ? String(o.defaultAddress) : null;

  if (addressesOut.length > 0) {
    if (!defaultAddressId || !addressesOut.some((x) => x.id === defaultAddressId)) {
      defaultAddressId = addressesOut[0].id;
    }
  } else {
    const leg = o.address || {};
    if (isAddressFilled(leg)) {
      const legPhone = leg.phone != null ? String(leg.phone).trim() : "";
      const legAlt = leg.phoneAlt != null ? String(leg.phoneAlt).trim() : "";
      const profilePhone = o.phone != null ? String(o.phone).trim() : "";
      addressesOut = [
        {
          id: "",
          label: "Home",
          line1: leg.line1 != null ? String(leg.line1).trim() : "",
          line2: leg.line2 != null ? String(leg.line2).trim() : "",
          city: leg.city != null ? String(leg.city).trim() : "",
          state: leg.state != null ? String(leg.state).trim() : "",
          pincode: leg.pincode != null ? String(leg.pincode).trim() : "",
          country: leg.country != null ? String(leg.country).trim() || "India" : "India",
          phone: legPhone || profilePhone,
          phoneAlt: legAlt,
        },
      ];
      defaultAddressId = "";
    } else {
      defaultAddressId = null;
    }
  }

  const active = getActiveShippingFromUser(o);
  return {
    id: String(o._id),
    name: o.name,
    email: o.email,
    role: o.role,
    phone: o.phone ?? "",
    address: active,
    addresses: addressesOut,
    defaultAddressId,
    savedCart: normalizeSavedCart(o.savedCart),
    savedLikes: normalizeSavedLikes(o.savedLikes),
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
  const { name, phone, address, addresses, defaultAddressId: bodyDefaultId, defaultAddressIndex } = req.body || {};
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

  if (Array.isArray(addresses)) {
    if (addresses.length > 8) throw new ApiError(400, "You can save at most 8 addresses.");
    const normalized = [];
    for (const row of addresses) {
      if (!row || typeof row !== "object") continue;
      const label = String(row.label || "Home").trim().slice(0, 40) || "Home";
      const line1 = row.line1 != null ? String(row.line1).trim() : "";
      const line2 = row.line2 != null ? String(row.line2).trim() : "";
      const city = row.city != null ? String(row.city).trim() : "";
      const state = row.state != null ? String(row.state).trim() : "";
      const pincode = row.pincode != null ? String(row.pincode).trim() : "";
      const country = row.country != null ? String(row.country).trim() || "India" : "India";
      const addrPhone = row.phone != null ? String(row.phone).trim().slice(0, 32) : "";
      const addrPhoneAlt = row.phoneAlt != null ? String(row.phoneAlt).trim().slice(0, 32) : "";
      const rawId = row.id != null ? String(row.id).trim() : "";
      const oid =
        rawId && mongoose.Types.ObjectId.isValid(rawId) ? new mongoose.Types.ObjectId(rawId) : new mongoose.Types.ObjectId();
      normalized.push({ _id: oid, label, line1, line2, city, state, pincode, country, phone: addrPhone, phoneAlt: addrPhoneAlt });
    }
    if (normalized.length === 0) {
      user.addresses = [];
      user.defaultAddress = null;
    } else {
      user.addresses = normalized;
      const idx = Number(defaultAddressIndex);
      let defOid = null;
      if (Number.isFinite(idx) && idx >= 0 && idx < normalized.length) {
        defOid = normalized[idx]._id;
      } else {
        const defStr = bodyDefaultId != null ? String(bodyDefaultId).trim() : "";
        if (defStr && mongoose.Types.ObjectId.isValid(defStr) && normalized.some((a) => String(a._id) === defStr)) {
          defOid = new mongoose.Types.ObjectId(defStr);
        } else {
          defOid = normalized[0]._id;
        }
      }
      user.defaultAddress = defOid;
    }
    user.markModified("addresses");
    syncLegacyAddressField(user);
  } else if (address !== undefined && address !== null && typeof address === "object") {
    if (!user.address) user.address = {};
    const keys = ["line1", "line2", "city", "state", "pincode", "country", "phone", "phoneAlt"];
    keys.forEach((k) => {
      if (address[k] !== undefined && address[k] !== null) {
        user.address[k] = String(address[k]).trim();
      }
    });
    user.markModified("address");
    if (!user.addresses || user.addresses.length === 0) {
      const sid = new mongoose.Types.ObjectId();
      user.addresses = [
        {
          _id: sid,
          label: "Home",
          line1: user.address.line1 || "",
          line2: user.address.line2 || "",
          city: user.address.city || "",
          state: user.address.state || "",
          pincode: user.address.pincode || "",
          country: user.address.country || "India",
          phone: user.address.phone != null ? String(user.address.phone).trim() : "",
          phoneAlt: user.address.phoneAlt != null ? String(user.address.phoneAlt).trim() : "",
        },
      ];
      user.defaultAddress = sid;
      user.markModified("addresses");
    }
    syncLegacyAddressField(user);
  }

  await user.save();
  res.json({ success: true, data: formatUser(user) });
});

/** Persist cart and/or likes for the logged-in customer (cross-browser). */
const updateShopState = asyncHandler(async (req, res) => {
  const { cart, likes } = req.body || {};
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found.");

  if (cart !== undefined) {
    user.savedCart = normalizeSavedCart(cart);
    user.markModified("savedCart");
  }
  if (likes !== undefined) {
    user.savedLikes = normalizeSavedLikes(likes);
    user.markModified("savedLikes");
  }

  await user.save();
  res.json({ success: true, data: formatUser(user) });
});

module.exports = { register, login, me, updateProfile, updateShopState };
