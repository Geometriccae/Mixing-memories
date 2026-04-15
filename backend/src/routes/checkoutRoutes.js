const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  startCheckoutSession,
  verifyCheckoutSession,
  abandonCheckoutSession,
  checkoutSessionPaymentFailed,
} = require("../controllers/checkoutController");

const router = express.Router();

router.post("/session", protect, startCheckoutSession);
router.post("/session/:id/verify", protect, verifyCheckoutSession);
router.delete("/session/:id/abandon", protect, abandonCheckoutSession);
router.post("/session/:id/payment-failed", protect, checkoutSessionPaymentFailed);

module.exports = router;
