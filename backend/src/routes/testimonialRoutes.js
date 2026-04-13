const express = require("express");
const {
  listTestimonials,
  createTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonialController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", listTestimonials);
router.post("/", protect, authorize("admin"), createTestimonial);
router.delete("/:id", protect, authorize("admin"), deleteTestimonial);

module.exports = router;
