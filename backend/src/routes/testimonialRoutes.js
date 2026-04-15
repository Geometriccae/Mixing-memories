const express = require("express");
const {
  listTestimonials,
  listAllTestimonials,
  submitCustomerTestimonial,
  approveTestimonial,
  createTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonialController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", listTestimonials);
router.get("/all", protect, authorize("admin"), listAllTestimonials);
router.post("/submit", protect, submitCustomerTestimonial);
router.patch("/:id/approve", protect, authorize("admin"), approveTestimonial);
router.post("/", protect, authorize("admin"), createTestimonial);
router.delete("/:id", protect, authorize("admin"), deleteTestimonial);

module.exports = router;
