const INSTAGRAM_REEL_IN_URL = /instagram\.com\/reel\/([A-Za-z0-9_-]+)/i;

/** @returns {{ shortcode: string, url: string } | null} */
function parseInstagramReelUrl(input) {
  const raw = input != null ? String(input).trim() : "";
  if (!raw) return null;

  const match = raw.match(INSTAGRAM_REEL_IN_URL);
  if (!match) return null;

  const shortcode = match[1];
  return {
    shortcode,
    url: `https://www.instagram.com/reel/${shortcode}/`,
  };
}

module.exports = { parseInstagramReelUrl };
