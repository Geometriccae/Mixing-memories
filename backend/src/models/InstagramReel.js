const mongoose = require("mongoose");

const instagramReelSchema = new mongoose.Schema(
  {
    shortcode: { type: String, required: true, trim: true, unique: true },
    url: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("InstagramReel", instagramReelSchema);
