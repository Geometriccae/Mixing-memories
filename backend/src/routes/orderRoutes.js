const express = require("express");
const {
  createOrder,
  listOrders,
  getOrdersByCustomerEmail,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", createOrder);
router.get("/customer", getOrdersByCustomerEmail);
router.get("/", protect, authorize("admin"), listOrders);
router.patch("/:id/status", protect, authorize("admin"), updateOrderStatus);

module.exports = router;
