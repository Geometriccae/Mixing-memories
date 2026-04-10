const express = require("express");
const { login, register, me, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", protect, me);
router.patch("/profile", protect, updateProfile);

module.exports = router;
