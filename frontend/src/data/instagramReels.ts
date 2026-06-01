export function reelEmbedUrl(shortcode: string) {
  return `https://www.instagram.com/reel/${shortcode}/embed/`;
}

/** Instagram embed is ~328px wide; scale to fit our card width. */
export const REEL_EMBED_WIDTH = 328;
export const REEL_EMBED_HEIGHT = 580;
