const express = require("express");
const {
  createSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getSubCategories);
router.post("/", protect, authorize("admin"), createSubCategory);
router.put("/:id", protect, authorize("admin"), updateSubCategory);
router.delete("/:id", protect, authorize("admin"), deleteSubCategory);

module.exports = router;
