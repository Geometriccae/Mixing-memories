/**
 * Short-lived cache for GET /api/products/:id JSON (avoids repeated Atlas reads).
 * Busted when admin edits product or stock changes (orders / cancel).
 */

const DETAIL_JSON_TTL_MS = 8000;
const cache = new Map();

function cacheKey(id, isAdmin) {
  return `${String(id)}:${isAdmin ? "a" : "u"}`;
}

function getDetailJsonCached(id, isAdmin) {
  const k = cacheKey(id, isAdmin);
  const row = cache.get(k);
  if (!row || Date.now() > row.exp) {
    cache.delete(k);
    return null;
  }
  return row.data;
}

function setDetailJsonCached(id, isAdmin, data) {
  cache.set(cacheKey(id, isAdmin), { exp: Date.now() + DETAIL_JSON_TTL_MS, data });
}

function bustDetailJsonCache(productId) {
  const id = String(productId);
  cache.delete(cacheKey(id, true));
  cache.delete(cacheKey(id, false));
}

module.exports = {
  getDetailJsonCached,
  setDetailJsonCached,
  bustDetailJsonCache,
};
