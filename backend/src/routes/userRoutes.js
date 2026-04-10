const express = require("express");
const { listUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
 
const router = express.Router();
 
// Admin: list users (customers)
router.get("/", protect, authorize("admin"), listUsers);
 
module.exports = router;

