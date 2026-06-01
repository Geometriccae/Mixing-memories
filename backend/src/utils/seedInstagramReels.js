const InstagramReel = require("../models/InstagramReel");

const DEFAULT_REELS = [
  { shortcode: "DYy6wfjTkGV", url: "https://www.instagram.com/reel/DYy6wfjTkGV/", sortOrder: 0 },
  { shortcode: "DYwsiEoAb0P", url: "https://www.instagram.com/reel/DYwsiEoAb0P/", sortOrder: 1 },
  { shortcode: "DYhattUlBfF", url: "https://www.instagram.com/reel/DYhattUlBfF/", sortOrder: 2 },
  { shortcode: "DXotbnYk3HO", url: "https://www.instagram.com/reel/DXotbnYk3HO/", sortOrder: 3 },
  { shortcode: "DYUbP46FP0h", url: "https://www.instagram.com/reel/DYUbP46FP0h/", sortOrder: 4 },
  { shortcode: "DXY4Cl2k5Ms", url: "https://www.instagram.com/reel/DXY4Cl2k5Ms/", sortOrder: 5 },
];

async function seedInstagramReelsIfEmpty() {
  try {
    const n = await InstagramReel.countDocuments();
    if (n > 0) return;
    await InstagramReel.insertMany(DEFAULT_REELS);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("seedInstagramReelsIfEmpty:", err.message);
  }
}

module.exports = { seedInstagramReelsIfEmpty };
