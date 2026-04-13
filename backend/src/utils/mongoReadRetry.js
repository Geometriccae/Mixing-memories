/**
 * Atlas / TLS sometimes drops or corrupts large wire payloads (BinData images).
 * Retrying on a fresh round-trip often succeeds — this is not "masking" app bugs.
 */
function isTransientMongoReadError(err) {
  const m = String(err && err.message ? err.message : "");
  const name = String(err && err.name ? err.name : "");
  return (
    /MongoNetworkError|MongoServerSelectionError|MongoClientClosedError/i.test(name) ||
    /SSL|TLS|decryption|bad record|ECONNRESET|ETIMEDOUT|EPIPE|socket|Network timeout|connection.*closed/i.test(m)
  );
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number, baseDelayMs?: number }} [opts]
 * @returns {Promise<T>}
 */
async function withMongoReadRetry(fn, opts = {}) {
  const retries = opts.retries ?? 8;
  const baseDelayMs = opts.baseDelayMs ?? 400;
  let last;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i < retries - 1 && isTransientMongoReadError(err)) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw last;
}

module.exports = {
  withMongoReadRetry,
  /** Alias: same helper for writes (stock, orders) — transient TLS errors apply there too. */
  withMongoOpRetry: withMongoReadRetry,
  isTransientMongoReadError,
};
