const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/paymentController");

const router = express.Router();

router.post("/razorpay/order", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);

module.exports = router;
