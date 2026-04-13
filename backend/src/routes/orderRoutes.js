const express = require("express");
const {
  createOrder,
  listOrders,
  getOrdersByCustomerEmail,
  getMyOrders,
  cancelMyOrder,
  abandonUnpaidMyOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, createOrder);
router.delete("/:id/abandon", protect, abandonUnpaidMyOrder);
router.patch("/:id/cancel", protect, cancelMyOrder);
router.get("/my", protect, getMyOrders);
router.get("/customer", getOrdersByCustomerEmail);
router.get("/", protect, authorize("admin"), listOrders);
router.patch("/:id/payment-status", protect, authorize("admin"), updateOrderPaymentStatus);
router.patch("/:id/status", protect, authorize("admin"), updateOrderStatus);

module.exports = router;
