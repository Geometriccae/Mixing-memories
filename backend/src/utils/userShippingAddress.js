const mongoose = require("mongoose");

function isAddressFilled(a) {
  if (!a) return false;
  return Boolean(
    String(a.line1 || "").trim() &&
      String(a.city || "").trim() &&
      String(a.state || "").trim() &&
      String(a.pincode || "").trim(),
  );
}

/**
 * Plain shipping snapshot for orders — uses default saved address, else first, else legacy `user.address`.
 * @param {object} u - User document or plain object
 */
function getActiveShippingFromUser(u) {
  const o = u && typeof u.toObject === "function" ? u.toObject() : u || {};
  const addrs = Array.isArray(o.addresses) ? o.addresses : [];
  let chosen = null;
  if (addrs.length > 0) {
    const defId = o.defaultAddress;
    if (defId) {
      chosen = addrs.find((a) => a && String(a._id) === String(defId)) || null;
    }
    if (!chosen) chosen = addrs[0];
  }
  if (chosen) {
    const rowPhone = chosen.phone != null ? String(chosen.phone).trim() : "";
    const rowAlt = chosen.phoneAlt != null ? String(chosen.phoneAlt).trim() : "";
    const profilePhone = o.phone != null ? String(o.phone).trim() : "";
    return {
      line1: chosen.line1 != null ? String(chosen.line1).trim() : "",
      line2: chosen.line2 != null ? String(chosen.line2).trim() : "",
      city: chosen.city != null ? String(chosen.city).trim() : "",
      state: chosen.state != null ? String(chosen.state).trim() : "",
      pincode: chosen.pincode != null ? String(chosen.pincode).trim() : "",
      country: chosen.country != null ? String(chosen.country).trim() || "India" : "India",
      phone: rowPhone || profilePhone,
      phoneAlt: rowAlt,
    };
  }
  const leg = o.address || {};
  const legPhone = leg.phone != null ? String(leg.phone).trim() : "";
  const legAlt = leg.phoneAlt != null ? String(leg.phoneAlt).trim() : "";
  const profilePhone = o.phone != null ? String(o.phone).trim() : "";
  return {
    line1: leg.line1 != null ? String(leg.line1).trim() : "",
    line2: leg.line2 != null ? String(leg.line2).trim() : "",
    city: leg.city != null ? String(leg.city).trim() : "",
    state: leg.state != null ? String(leg.state).trim() : "",
    pincode: leg.pincode != null ? String(leg.pincode).trim() : "",
    country: leg.country != null ? String(leg.country).trim() || "India" : "India",
    phone: legPhone || profilePhone,
    phoneAlt: legAlt,
  };
}

/** Copy active shipping into legacy `address` field for backward compatibility. */
function syncLegacyAddressField(userDoc) {
  if (!userDoc) return;
  const snap = getActiveShippingFromUser(userDoc);
  if (!userDoc.address) userDoc.address = {};
  userDoc.address.line1 = snap.line1;
  userDoc.address.line2 = snap.line2;
  userDoc.address.city = snap.city;
  userDoc.address.state = snap.state;
  userDoc.address.pincode = snap.pincode;
  userDoc.address.country = snap.country || "India";
  userDoc.address.phone = snap.phone != null ? String(snap.phone).trim() : "";
  userDoc.address.phoneAlt = snap.phoneAlt != null ? String(snap.phoneAlt).trim() : "";
}

function isValidObjectId(id) {
  return id != null && mongoose.Types.ObjectId.isValid(String(id));
}

module.exports = {
  isAddressFilled,
  getActiveShippingFromUser,
  syncLegacyAddressField,
  isValidObjectId,
};
