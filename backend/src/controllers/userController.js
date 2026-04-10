const User = require("../models/User");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
 
function formatUserRow(u, ordersCountByEmail) {
  const email = String(u.email || "").toLowerCase();
  return {
    id: String(u._id),
    name: u.name || "",
    email,
    role: u.role || "user",
    createdAt: u.createdAt,
    orders: ordersCountByEmail.get(email) || 0,
  };
}
 
const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select("name email role createdAt").sort({ createdAt: -1 }).lean();
 
  const orderCounts = await Order.aggregate([
    { $group: { _id: { $toLower: "$email" }, orders: { $sum: 1 } } },
  ]);
  const byEmail = new Map(orderCounts.map((r) => [String(r._id), Number(r.orders) || 0]));
 
  res.json({ success: true, data: users.map((u) => formatUserRow(u, byEmail)) });
});
 
module.exports = { listUsers };

