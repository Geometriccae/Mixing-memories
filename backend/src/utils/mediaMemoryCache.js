/**
 * In-process LRU for product image bytes so repeat views skip Mongo round-trips.
 * Cleared on product update/delete.
 */

const MAX_ENTRIES = 45;
/** Match product media cap (~15MB doc); large JPEGs failed cache silently before but still 500'd on bad headers — keep in sync with serving path. */
const MAX_BYTES_PER_ITEM = 12 * 1024 * 1024;

const order = [];
const map = new Map();

function touch(key) {
  const i = order.indexOf(key);
  if (i >= 0) order.splice(i, 1);
  order.push(key);
}

function evictIfNeeded() {
  while (order.length >= MAX_ENTRIES) {
    const k = order.shift();
    if (k) map.delete(k);
  }
}

/**
 * @param {string} key
 * @returns {{ buffer: Buffer, contentType: string } | null}
 */
function getCachedBuffer(key) {
  const e = map.get(key);
  if (!e) return null;
  touch(key);
  return e;
}

/**
 * @param {string} key
 * @param {Buffer} buffer
 * @param {string} contentType
 */
function setCachedBuffer(key, buffer, contentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_BYTES_PER_ITEM) return;
  evictIfNeeded();
  map.set(key, { buffer: Buffer.from(buffer), contentType });
  touch(key);
}

/** Drop all cached media for one product id (main + variants). */
function invalidateProductMedia(productId) {
  const id = String(productId);
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const k = order[i];
    const parts = k.split(":");
    if (parts.length >= 2 && parts[1] === id) {
      order.splice(i, 1);
      map.delete(k);
    }
  }
}

module.exports = {
  getCachedBuffer,
  setCachedBuffer,
  invalidateProductMedia,
};
