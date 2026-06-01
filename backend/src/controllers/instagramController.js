const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const InstagramReel = require("../models/InstagramReel");
const { parseInstagramReelUrl } = require("../utils/parseInstagramReelUrl");

const INSTAGRAM_REEL_RE = /^https:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?/i;
const SHORTCODE_RE = /^[A-Za-z0-9_-]+$/;
const CDN_IMAGE_RE = /^https:\/\//i;

function isAllowedThumbnailUrl(url) {
  if (!CDN_IMAGE_RE.test(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.endsWith(".cdninstagram.com") ||
      host.endsWith(".fbcdn.net") ||
      host.includes("instagram.")
    );
  } catch {
    return false;
  }
}

async function fetchOembedForReelUrl(reelUrl) {
  const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(reelUrl)}`;
  const response = await fetch(oembedUrl, {
    headers: { "User-Agent": "RoyalOvenCMS/1.0" },
  });
  if (!response.ok) return null;
  return response.json();
}

/** Proxy Instagram oEmbed so the browser is not blocked by CORS. */
const getReelOembed = asyncHandler(async (req, res) => {
  const rawUrl = req.query.url != null ? String(req.query.url).trim() : "";
  if (!rawUrl || !INSTAGRAM_REEL_RE.test(rawUrl)) {
    throw new ApiError(400, "A valid Instagram reel URL is required.");
  }

  const payload = await fetchOembedForReelUrl(rawUrl);
  if (!payload) {
    throw new ApiError(502, "Could not load Instagram preview for this reel.");
  }

  res.json({
    success: true,
    data: {
      thumbnailUrl: payload.thumbnail_url ?? null,
      title: payload.title ?? null,
      authorName: payload.author_name ?? null,
    },
  });
});

/** Proxy reel thumbnail image (Instagram CDN blocks hotlinking in <img>). */
const getReelThumbnail = asyncHandler(async (req, res) => {
  const shortcode = req.params.shortcode != null ? String(req.params.shortcode).trim() : "";
  if (!shortcode || !SHORTCODE_RE.test(shortcode)) {
    throw new ApiError(400, "A valid reel shortcode is required.");
  }

  const reelUrl = `https://www.instagram.com/reel/${shortcode}/`;
  const payload = await fetchOembedForReelUrl(reelUrl);
  const thumbUrl = payload?.thumbnail_url;
  if (!thumbUrl || !isAllowedThumbnailUrl(thumbUrl)) {
    throw new ApiError(404, "Thumbnail not available for this reel.");
  }

  const imageRes = await fetch(thumbUrl, {
    headers: {
      "User-Agent": "RoyalOvenCMS/1.0",
      Referer: "https://www.instagram.com/",
    },
  });

  if (!imageRes.ok) {
    throw new ApiError(502, "Could not load reel thumbnail image.");
  }

  const contentType = imageRes.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imageRes.arrayBuffer());

  res.set("Content-Type", contentType);
  res.set("Cache-Control", "public, max-age=86400");
  res.send(buffer);
});

/** Public: reels shown on the storefront Instagram Shorts section. */
const listReels = asyncHandler(async (_req, res) => {
  const rows = await InstagramReel.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ success: true, data: rows });
});

/** Admin: add a reel from a pasted Instagram URL. */
const createReel = asyncHandler(async (req, res) => {
  const parsed = parseInstagramReelUrl(req.body.url);
  if (!parsed) {
    throw new ApiError(400, "Paste a valid Instagram reel link (instagram.com/reel/...).");
  }

  const existing = await InstagramReel.findOne({ shortcode: parsed.shortcode });
  if (existing) {
    throw new ApiError(409, "This reel is already on the homepage.");
  }

  const maxOrder = await InstagramReel.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
  const sortOrder = maxOrder?.sortOrder != null ? maxOrder.sortOrder + 1 : 0;

  const doc = await InstagramReel.create({
    shortcode: parsed.shortcode,
    url: parsed.url,
    sortOrder,
  });

  res.status(201).json({ success: true, data: doc });
});

/** Admin: remove a reel from the homepage section. */
const deleteReel = asyncHandler(async (req, res) => {
  const doc = await InstagramReel.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, "Reel not found.");
  res.json({ success: true, message: "Reel removed." });
});

module.exports = {
  getReelOembed,
  getReelThumbnail,
  listReels,
  createReel,
  deleteReel,
};
