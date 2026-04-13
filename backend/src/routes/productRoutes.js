const express = require("express");
const upload = require("../config/multer");
const {
  createProduct,
  getProducts,
  getProductByBarcode,
  getProductImage,
  getProductVideo,
  getProductVariantImage,
  getProductBarcodePng,
  getProductById,
  postProductsAvailability,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

const productUpload = upload.uploadMemory.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "variantImage0", maxCount: 1 },
  { name: "variantImage1", maxCount: 1 },
  { name: "variantImage2", maxCount: 1 },
]);

router.post("/availability", postProductsAvailability);
router.get("/", optionalAuth, getProducts);
router.get("/lookup/barcode", optionalAuth, getProductByBarcode);
router.get("/:id/image", getProductImage);
router.get("/:id/video", getProductVideo);
router.get("/:id/variant/:idx", getProductVariantImage);
router.get("/:id/barcode", protect, authorize("admin"), getProductBarcodePng);
router.get("/:id", optionalAuth, getProductById);
router.post("/", protect, authorize("admin"), productUpload, createProduct);
router.put("/:id", protect, authorize("admin"), productUpload, updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
