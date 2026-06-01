const express = require("express");
const {
  getReelOembed,
  getReelThumbnail,
  listReels,
  createReel,
  deleteReel,
} = require("../controllers/instagramController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/reels", listReels);
router.post("/reels", protect, authorize("admin"), createReel);
router.delete("/reels/:id", protect, authorize("admin"), deleteReel);
router.get("/oembed", getReelOembed);
router.get("/thumbnail/:shortcode", getReelThumbnail);

module.exports = router;
