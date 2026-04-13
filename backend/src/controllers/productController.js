const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { safeUnlinkWebPath } = require("../utils/saveProductUpload");
const { getCachedBuffer, setCachedBuffer, invalidateProductMedia } = require("../utils/mediaMemoryCache");
const {
  getDetailJsonCached,
  setDetailJsonCached,
  bustDetailJsonCache,
} = require("../utils/productDetailJsonCache");
const { withMongoReadRetry } = require("../utils/mongoReadRetry");

/**
 * MongoDB document limit is ~16MB. Buffers (main image, variants, optional video) share one cap.
 */
const MAX_TOTAL_BINARY_BYTES = 15 * 1024 * 1024;

function bufferForMongo(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return Buffer.from(buffer);
}

const STORE_IMAGE_MAX_EDGE = 1600;
const STORE_JPEG_QUALITY = 82;

/**
 * Resize/compress still images before storing in Mongo (smaller BinData = faster, fewer TLS drops).
 * Requires optional dependency `sharp` — run `npm install` in backend when npm/network works.
 */
async function optimizeStoreImageBuffer(inputBuf, mimetype) {
  const fallbackCt = String(mimetype || "image/jpeg").split(";")[0].trim() || "image/jpeg";
  if (!inputBuf || !Buffer.isBuffer(inputBuf) || inputBuf.length === 0) {
    return { buffer: inputBuf, contentType: fallbackCt };
  }
  let sharpMod;
  try {
    sharpMod = require("sharp");
  } catch {
    return { buffer: Buffer.from(inputBuf), contentType: fallbackCt };
  }
  const mime = String(mimetype || "image/jpeg").toLowerCase().split(";")[0].trim();
  if (mime.startsWith("video/") || mime === "image/gif" || mime === "image/svg+xml") {
    return { buffer: Buffer.from(inputBuf), contentType: mime };
  }
  try {
    const img = sharpMod(inputBuf, { failOn: "none", animated: false }).rotate();
    const meta = await img.metadata();
    const pipeline = img.resize({
      width: STORE_IMAGE_MAX_EDGE,
      height: STORE_IMAGE_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });
    if (meta.format === "png" || mime.includes("png")) {
      const out = await pipeline.png({ compressionLevel: 8, effort: 6 }).toBuffer();
      return { buffer: out, contentType: "image/png" };
    }
    if (meta.format === "webp" || mime.includes("webp")) {
      const out = await pipeline.webp({ quality: STORE_JPEG_QUALITY }).toBuffer();
      return { buffer: out, contentType: "image/webp" };
    }
    const out = await pipeline.jpeg({ quality: STORE_JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return { buffer: out, contentType: "image/jpeg" };
  } catch (e) {
    console.warn("[products] optimizeStoreImageBuffer:", e && e.message);
    return { buffer: Buffer.from(inputBuf), contentType: fallbackCt };
  }
}

function ensureTotalBinaryUnderLimit(buffers) {
  const total = (buffers || []).reduce((sum, b) => sum + (b && Buffer.isBuffer(b) ? b.length : 0), 0);
  if (total > MAX_TOTAL_BINARY_BYTES) {
    throw new ApiError(
      413,
      `Media is too large to store in MongoDB. Please use smaller images or a shorter video (max total ~${Math.floor(
        MAX_TOTAL_BINARY_BYTES / (1024 * 1024),
      )}MB).`,
    );
  }
}

function legacyFileAbsolute(webPath) {
  if (!webPath || typeof webPath !== "string" || !webPath.startsWith("/uploads/")) return null;
  const rel = webPath.replace(/^\/uploads\//, "");
  return path.resolve(__dirname, "../../uploads", rel);
}

/**
 * HTTP headers must not contain CR/LF; bad values throw ERR_INVALID_CHAR and become 500.
 * @param {string} raw
 * @param {string} fallback
 */
function safeMediaContentType(raw, fallback) {
  const fb = fallback || "application/octet-stream";
  const first = String(raw || "")
    .trim()
    .split(";")[0]
    .replace(/[\r\n\0]/g, "")
    .trim()
    .slice(0, 80);
  if (!/^[\w!#$&.\-^]+\/[\w!#$&.\-^+]+$/i.test(first)) return fb;
  return first;
}

/**
 * Mongoose lean() / driver may return Buffer, BSON Binary, Uint8Array, or { buffer: ArrayBuffer }.
 * Never throw — bad byte ranges or odd shapes caused 500s on /image.
 */
function asMongoBinaryBuffer(val, depth = 0) {
  if (val == null || depth > 8) return null;
  try {
    if (Buffer.isBuffer(val)) return val.length > 0 ? Buffer.from(val) : null;
    if (ArrayBuffer.isView(val)) {
      const u = val;
      const out = Buffer.from(u.buffer, u.byteOffset, u.byteLength);
      return out.length > 0 ? out : null;
    }
    if (typeof ArrayBuffer !== "undefined" && val instanceof ArrayBuffer) {
      const out = Buffer.from(val);
      return out.length > 0 ? out : null;
    }
    if (typeof val === "object") {
      if (val._bsontype === "Binary" && typeof val.value === "function") {
        return asMongoBinaryBuffer(val.value(true), depth + 1);
      }
      if (val.buffer != null && val.buffer !== val) {
        return asMongoBinaryBuffer(val.buffer, depth + 1);
      }
    }
  } catch (err) {
    console.warn("[products] asMongoBinaryBuffer:", err && err.message);
  }
  return null;
}

function parseOptionalNonNegNumber(val) {
  if (val === undefined || val === null || String(val).trim() === "") return null;
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseStock(val) {
  if (val === undefined || val === null || String(val).trim() === "") return 0;
  const n = Math.floor(Number(val));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseMinStock(val) {
  if (val === undefined || val === null || String(val).trim() === "") return 0;
  const n = Math.floor(Number(val));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeVariantPathSlots(arr) {
  const a = Array.isArray(arr) ? [...arr] : [];
  while (a.length < 3) a.push("");
  return a.slice(0, 3);
}

function stripBinaryFields(o) {
  delete o.imageData;
  delete o.videoData;
  for (let i = 0; i < 3; i += 1) {
    delete o[`variantImageData${i}`];
  }
}

function legacyHasDiskImage(o) {
  return !!(o.image && typeof o.image === "string" && o.image.startsWith("/uploads/"));
}

function resolveHasImage(o, hasVideoFlag) {
  if (typeof o.hasImage === "boolean") return o.hasImage;
  return legacyHasDiskImage(o) || !hasVideoFlag;
}

function resolveHasVideo(o) {
  return o.hasVideo === true;
}

/** True sizes of BinData fields (flags in DB can be wrong after partial updates). */
const MEDIA_BYTE_SIZE_PROJECT = {
  mainSize: {
    $cond: [{ $eq: [{ $type: "$imageData" }, "binData"] }, { $binarySize: "$imageData" }, 0],
  },
  v0s: {
    $cond: [{ $eq: [{ $type: "$variantImageData0" }, "binData"] }, { $binarySize: "$variantImageData0" }, 0],
  },
  v1s: {
    $cond: [{ $eq: [{ $type: "$variantImageData1" }, "binData"] }, { $binarySize: "$variantImageData1" }, 0],
  },
  v2s: {
    $cond: [{ $eq: [{ $type: "$variantImageData2" }, "binData"] }, { $binarySize: "$variantImageData2" }, 0],
  },
  vidS: {
    $cond: [{ $eq: [{ $type: "$videoData" }, "binData"] }, { $binarySize: "$videoData" }, 0],
  },
};

function presenceFromAggRow(r) {
  if (!r) {
    return { mainImage: false, v0: false, v1: false, v2: false, video: false };
  }
  return {
    mainImage: (r.mainSize || 0) > 0,
    v0: (r.v0s || 0) > 0,
    v1: (r.v1s || 0) > 0,
    v2: (r.v2s || 0) > 0,
    video: (r.vidS || 0) > 0,
  };
}

async function mediaPresenceMapForIds(ids) {
  const oids = [
    ...new Set(
      (ids || [])
        .map((id) => String(id))
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id)),
    ),
  ];
  if (oids.length === 0) return new Map();
  try {
    const rows = await withMongoReadRetry(() =>
      Product.aggregate([{ $match: { _id: { $in: oids } } }, { $project: MEDIA_BYTE_SIZE_PROJECT }]),
    );
    const m = new Map();
    for (const r of rows) {
      m.set(String(r._id), presenceFromAggRow(r));
    }
    return m;
  } catch (err) {
    console.warn("[products] mediaPresenceMapForIds:", err && err.message);
    return undefined;
  }
}

/**
 * @param {object} doc lean or mongoose doc
 * @param {boolean} isAdmin
 * @param {{ mainImage: boolean, v0: boolean, v1: boolean, v2: boolean, video: boolean } | undefined} presence from aggregate; omit only right after create when JSON is built elsewhere
 */
function publicProduct(doc, isAdmin = false, presence) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const variantFlags = [0, 1, 2].map((i) => o[`hasVariant${i}`] === true);
  const stockNum = Number(o.stock);
  const stock = Number.isFinite(stockNum) ? Math.max(0, Math.floor(stockNum)) : 0;
  const minStockNum = Number(o.minStock);
  const minStock = Number.isFinite(minStockNum) ? Math.max(0, Math.floor(minStockNum)) : 0;
  stripBinaryFields(o);
  delete o.hasVariant0;
  delete o.hasVariant1;
  delete o.hasVariant2;

  const legacyPaths = normalizeVariantPathSlots(o.variantImages);
  const hasLegacyVariantDisk = legacyPaths.some((p) => p && typeof p === "string" && p.startsWith("/uploads/"));

  const hasVideoFlag =
    presence === undefined ? resolveHasVideo(o) : resolveHasVideo(o) && presence.video;

  const hasVariantVisual =
    presence === undefined
      ? variantFlags.some(Boolean) || hasLegacyVariantDisk
      : !!(presence.v0 || presence.v1 || presence.v2);

  const hasImageFlag =
    presence === undefined
      ? resolveHasImage(o, hasVideoFlag) || hasVariantVisual
      : legacyHasDiskImage(o) || presence.mainImage || presence.v0 || presence.v1 || presence.v2;

  if (!isAdmin) {
    delete o.stock;
    delete o.minStock;
    o.inStock = stock > 0;
    o.lowStock = stock > 0 && minStock > 0 && stock <= minStock;
    o.outOfStock = stock <= 0;
    delete o.barcode;
  }

  const id = String(o._id);
  const v = o.updatedAt ? new Date(o.updatedAt).getTime() : Date.now();
  o.imageUrl = hasImageFlag ? `/api/products/${id}/image?v=${v}` : null;
  o.videoUrl = hasVideoFlag ? `/api/products/${id}/video?v=${v}` : null;
  o.hasImage = hasImageFlag;
  o.hasVideo = hasVideoFlag;

  o.variantImageUrls = [0, 1, 2].map((i) => {
    const legacy = legacyPaths[i] && typeof legacyPaths[i] === "string" && legacyPaths[i].startsWith("/uploads/");
    const hasBuf = presence === undefined ? variantFlags[i] : !!presence[`v${i}`];
    if (legacy || hasBuf) {
      return `/api/products/${id}/variant/${i}?v=${v}`;
    }
    return null;
  });
  return o;
}

function collectVariantFiles(files) {
  const out = [null, null, null];
  if (!files || typeof files !== "object") return out;
  for (let i = 0; i < 3; i += 1) {
    const key = `variantImage${i}`;
    const list = files[key];
    const f = Array.isArray(list) && list[0] ? list[0] : null;
    out[i] = f && f.buffer ? f : null;
  }
  return out;
}

/** Exclude large Buffers from list/detail JSON; hasVariant* flags preserve variant URL presence */
const BINARY_EXCLUDE = "-imageData -variantImageData0 -variantImageData1 -variantImageData2 -videoData";

/** Skip leading brand words so "Royal Oven Honey …" → HONEY not ROYAL. */
const BARCODE_KEYWORD_SKIP = new Set([
  "ROYAL",
  "OVEN",
  "THE",
  "AND",
  "A",
  "AN",
  "OF",
  "FOR",
]);

/** First substantial token from name → RO-{TOKEN} 0001 (same idea as your retail sheet). */
function retailBarcodeKeyword(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let fallback = "";
  for (const p of parts) {
    const alnum = p.replace(/[^a-zA-Z0-9]/g, "");
    if (alnum.length < 2) continue;
    const up = alnum.toUpperCase().slice(0, 32);
    if (!fallback) fallback = up;
    if (!BARCODE_KEYWORD_SKIP.has(up)) return up;
  }
  return fallback || "ITEM";
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function allocateRetailBarcode(name) {
  const keyword = retailBarcodeKeyword(name);
  const prefixRe = new RegExp(`^RO-${escapeRegex(keyword)} (\\d{4})$`);
  const rows = await withMongoReadRetry(() =>
    Product.find({ barcode: new RegExp(`^RO-${escapeRegex(keyword)} \\d{4}$`) })
      .select("barcode")
      .lean(),
  );
  let max = 0;
  for (const row of rows) {
    const m = String(row.barcode || "").match(prefixRe);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  for (let n = max + 1; n < max + 100; n += 1) {
    const code = `RO-${keyword} ${String(n).padStart(4, "0")}`;
    const clash = await withMongoReadRetry(() => Product.findOne({ barcode: code }).select("_id").lean());
    if (!clash) return code;
  }
  throw new ApiError(500, "Could not allocate barcode.");
}

/** Browser cache when URL includes ?v= (tied to product updatedAt in JSON). */
function setVersionedMediaCache(res, req) {
  const v = req.query && req.query.v;
  if (v != null && String(v).trim() !== "") {
    res.set("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    res.set("Cache-Control", "public, max-age=120");
  }
}

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, specification, price } = req.body;
  if (!name || price === undefined) {
    throw new ApiError(400, "name and price are required.");
  }

  const files = req.files || {};
  const mainList = files.image;
  const file = Array.isArray(mainList) && mainList[0] ? mainList[0] : null;
  let mainBuf = file && file.buffer ? bufferForMongo(file.buffer) : null;
  let mainImageContentType = file ? file.mimetype || "image/jpeg" : "image/jpeg";
  if (mainBuf) {
    const opt = await optimizeStoreImageBuffer(mainBuf, mainImageContentType);
    mainBuf = bufferForMongo(opt.buffer);
    mainImageContentType = opt.contentType;
  }

  const videoList = files.video;
  const videoFile = Array.isArray(videoList) && videoList[0] ? videoList[0] : null;
  const videoBuf = videoFile && videoFile.buffer ? bufferForMongo(videoFile.buffer) : null;

  if (!mainBuf && !videoBuf) {
    throw new ApiError(400, "Provide at least a product image or a product video.");
  }

  const actualPrice = parseOptionalNonNegNumber(req.body.actualPrice);
  const stock = parseStock(req.body.stock);
  const minStock = parseMinStock(req.body.minStock);
  const spec = specification != null ? String(specification).trim() : "";

  const variantFiles = collectVariantFiles(files);
  const doc = {
    name: name.trim(),
    description: description || "",
    specification: spec,
    price: Number(price),
    actualPrice,
    stock,
    minStock,
    image: "",
    videoContentType: videoFile ? videoFile.mimetype || "video/mp4" : "video/mp4",
    hasImage: Boolean(mainBuf),
    hasVideo: Boolean(videoBuf),
    variantImages: [],
    hasVariant0: false,
    hasVariant1: false,
    hasVariant2: false,
  };
  if (mainBuf) {
    doc.imageData = mainBuf;
    doc.imageContentType = mainImageContentType;
  } else {
    doc.imageContentType = "image/jpeg";
  }
  if (videoBuf) {
    doc.videoData = videoBuf;
  }

  const allBuffers = [];
  if (mainBuf) allBuffers.push(mainBuf);
  if (videoBuf) allBuffers.push(videoBuf);
  for (let i = 0; i < 3; i += 1) {
    const vf = variantFiles[i];
    if (vf && vf.buffer) {
      let vb = bufferForMongo(vf.buffer);
      if (!vb) {
        throw new ApiError(400, `Variant image ${i + 1} is invalid.`);
      }
      const vOpt = await optimizeStoreImageBuffer(vb, vf.mimetype || "image/jpeg");
      vb = bufferForMongo(vOpt.buffer);
      doc[`variantImageData${i}`] = vb;
      doc[`variantImageContentType${i}`] = vOpt.contentType;
      doc[`hasVariant${i}`] = true;
      allBuffers.push(vb);
    }
  }
  ensureTotalBinaryUnderLimit(allBuffers);

  doc.barcode = await allocateRetailBarcode(doc.name);

  const product = await withMongoReadRetry(() => Product.create(doc));
  const full = await withMongoReadRetry(() => Product.findById(product._id).select(BINARY_EXCLUDE).lean());
  const presMap = await mediaPresenceMapForIds([product._id]);
  const pr = presMap === undefined ? undefined : presMap.get(String(product._id)) || presenceFromAggRow(null);
  res.status(201).json({ success: true, data: publicProduct(full, true, pr) });
});

const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", minPrice, maxPrice, categoryId } = req.query;
  const filter = {};

  if (search) filter.name = { $regex: search, $options: "i" };
  if (categoryId) filter.categoryId = categoryId;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await withMongoReadRetry(() =>
    Promise.all([
      Product.find(filter).select(BINARY_EXCLUDE).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]),
  );

  const isAdmin = !!(req.user && req.user.role === "admin");
  const presMap = await mediaPresenceMapForIds(items.map((p) => p._id));
  const data = items.map((p) => {
    const pr = presMap === undefined ? undefined : presMap.get(String(p._id)) || presenceFromAggRow(null);
    return publicProduct(p, isAdmin, pr);
  });

  res.json({
    success: true,
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/** Strip zero-width chars; collapse spaces; normalize RO- prefix; uppercase (matches stored retail codes). */
function normalizeBarcodeLookupInput(raw) {
  let s = String(raw || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\u2212|\u2013|\u2014/g, "-")
    .trim()
    .replace(/\s+/g, " ");
  s = s.replace(/^RO\s*-\s*/i, "RO-");
  return s.toUpperCase();
}

/** Public lookup for handheld scanners / Scan page — opens product detail by stored barcode. */
const getProductByBarcode = asyncHandler(async (req, res) => {
  const raw =
    req.query.q != null
      ? String(req.query.q)
      : req.query.barcode != null
        ? String(req.query.barcode)
        : "";
  const normalized = normalizeBarcodeLookupInput(raw);
  if (!normalized) {
    throw new ApiError(400, "Query q (or barcode) is required.");
  }

  const compact = normalized.replace(/\s/g, "");

  let product = await withMongoReadRetry(() =>
    Product.findOne({ barcode: normalized }).select(BINARY_EXCLUDE).lean(),
  );
  if (!product) {
    product = await withMongoReadRetry(() =>
      Product.findOne({
        barcode: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
      })
        .select(BINARY_EXCLUDE)
        .lean(),
    );
  }
  /** Scanners often omit the space before the serial (RO-GULKAND0001 vs RO-GULKAND 0001). Regex avoids relying on $replaceAll in $expr (older MongoDB). */
  if (!product && compact.length >= 6) {
    const cm = compact.match(/^RO-(.+)(\d{4})$/i);
    if (cm) {
      const kw = String(cm[1] || "").toUpperCase();
      const serial = cm[2];
      product = await withMongoReadRetry(() =>
        Product.findOne({
          barcode: new RegExp(`^RO-${escapeRegex(kw)}\\s*${escapeRegex(serial)}$`, "i"),
        })
          .select(BINARY_EXCLUDE)
          .lean(),
      );
    }
  }
  /** Last resort: compare barcodes with all spaces removed (odd spacing in DB). */
  if (!product && compact.length >= 6) {
    try {
      product = await withMongoReadRetry(() =>
        Product.findOne({
          barcode: { $exists: true, $nin: [null, ""] },
          $expr: {
            $eq: [
              {
                $replaceAll: {
                  input: { $toUpper: { $ifNull: ["$barcode", ""] } },
                  find: " ",
                  replacement: "",
                },
              },
              compact,
            ],
          },
        })
          .select(BINARY_EXCLUDE)
          .lean(),
      );
    } catch (e) {
      product = null;
    }
  }
  if (!product) {
    throw new ApiError(404, "No product found for this barcode.");
  }

  const isAdmin = !!(req.user && req.user.role === "admin");
  const presMap = await mediaPresenceMapForIds([product._id]);
  const pr = presMap === undefined ? undefined : presMap.get(String(product._id)) || presenceFromAggRow(null);
  const data = publicProduct(product, isAdmin, pr);
  res.json({ success: true, data });
});

const getProductImage = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const vQ = req.query && req.query.v != null ? String(req.query.v) : "";
  const cacheKey = `img:${id}:${vQ}`;
  const hit = getCachedBuffer(cacheKey);
  if (hit) {
    res.set("Content-Type", safeMediaContentType(hit.contentType, "image/jpeg"));
    setVersionedMediaCache(res, req);
    return res.send(hit.buffer);
  }

  const product = await withMongoReadRetry(
    () =>
      Product.findById(id)
        .select("imageData imageContentType image variantImageData0 variantImageContentType0 variantImages")
        .lean(),
    { retries: 12, baseDelayMs: 500 },
  );
  if (!product) throw new ApiError(404, "Product not found.");

  let buf = asMongoBinaryBuffer(product.imageData);
  let contentType = safeMediaContentType(product.imageContentType, "image/jpeg");
  if (!buf) {
    buf = asMongoBinaryBuffer(product.variantImageData0);
    contentType = safeMediaContentType(product.variantImageContentType0, "image/jpeg");
  }
  if (buf && buf.length > 0) {
    setCachedBuffer(cacheKey, buf, contentType);
    res.set("Content-Type", contentType);
    setVersionedMediaCache(res, req);
    return res.send(buf);
  }

  const abs = legacyFileAbsolute(product.image);
  if (abs && fs.existsSync(abs)) {
    setVersionedMediaCache(res, req);
    return res.sendFile(path.resolve(abs));
  }

  const slots = normalizeVariantPathSlots(product.variantImages);
  const v0 = legacyFileAbsolute(slots[0]);
  if (v0 && fs.existsSync(v0)) {
    setVersionedMediaCache(res, req);
    return res.sendFile(path.resolve(v0));
  }

  throw new ApiError(404, "Image not found.");
});

const getProductVideo = asyncHandler(async (req, res) => {
  const product = await withMongoReadRetry(
    () => Product.findById(req.params.id).select("videoData videoContentType").lean(),
    { retries: 12, baseDelayMs: 500 },
  );
  if (!product) throw new ApiError(404, "Product not found.");

  const buf = asMongoBinaryBuffer(product.videoData);
  if (buf && buf.length > 0) {
    res.set("Content-Type", safeMediaContentType(product.videoContentType, "video/mp4"));
    setVersionedMediaCache(res, req);
    res.set("Accept-Ranges", "bytes");
    return res.send(buf);
  }

  throw new ApiError(404, "Video not found.");
});

const getProductVariantImage = asyncHandler(async (req, res) => {
  const idx = Number(req.params.idx);
  if (!Number.isInteger(idx) || idx < 0 || idx > 2) {
    throw new ApiError(404, "Image not found.");
  }

  const id = String(req.params.id);
  const vQ = req.query && req.query.v != null ? String(req.query.v) : "";
  const cacheKey = `vrt:${id}:${idx}:${vQ}`;
  const hit = getCachedBuffer(cacheKey);
  if (hit) {
    res.set("Content-Type", safeMediaContentType(hit.contentType, "image/jpeg"));
    setVersionedMediaCache(res, req);
    return res.send(hit.buffer);
  }

  const select = `variantImageData${idx} variantImageContentType${idx} variantImages`;
  const product = await withMongoReadRetry(() => Product.findById(id).select(select).lean(), {
    retries: 12,
    baseDelayMs: 500,
  });
  if (!product) throw new ApiError(404, "Product not found.");

  const vbuf = asMongoBinaryBuffer(product[`variantImageData${idx}`]);
  if (vbuf && vbuf.length > 0) {
    const ct = safeMediaContentType(product[`variantImageContentType${idx}`], "image/jpeg");
    setCachedBuffer(cacheKey, vbuf, ct);
    res.set("Content-Type", ct);
    setVersionedMediaCache(res, req);
    return res.send(vbuf);
  }

  const slots = normalizeVariantPathSlots(product.variantImages);
  const webPath = slots[idx];
  const abs = legacyFileAbsolute(webPath);
  if (abs && fs.existsSync(abs)) {
    setVersionedMediaCache(res, req);
    return res.sendFile(path.resolve(abs));
  }

  throw new ApiError(404, "Image not found.");
});

const getProductBarcodePng = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product id.");
  }
  const product = await withMongoReadRetry(() => Product.findById(id).select("barcode").lean());
  if (!product) throw new ApiError(404, "Product not found.");
  const text = String(product.barcode || "").trim();
  if (!text) throw new ApiError(404, "No barcode for this product.");

  let bwipjs;
  try {
    bwipjs = require("bwip-js");
  } catch {
    throw new ApiError(503, "Barcode download is not available on this server.");
  }

  let png;
  try {
    png = await bwipjs.toBuffer({
      bcid: "code128",
      text,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: "center",
    });
  } catch (e) {
    throw new ApiError(400, (e && e.message) || "Could not encode barcode.");
  }

  const fname = `barcode-${text.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || id}.png`;
  res.set("Content-Type", "image/png");
  res.set("Content-Disposition", `attachment; filename="${fname}"`);
  res.send(png);
});

const getProductById = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const isAdmin = !!(req.user && req.user.role === "admin");
  const cached = getDetailJsonCached(id, isAdmin);
  if (cached) {
    return res.json({ success: true, data: cached });
  }

  const [product, presMap] = await withMongoReadRetry(() =>
    Promise.all([Product.findById(id).select(BINARY_EXCLUDE).lean(), mediaPresenceMapForIds([id])]),
  );
  if (!product) throw new ApiError(404, "Product not found.");
  const pr = presMap === undefined ? undefined : presMap.get(id) || presenceFromAggRow(null);
  const data = publicProduct(product, isAdmin, pr);
  setDetailJsonCached(id, isAdmin, data);
  res.json({ success: true, data });
});

/** Checkout helper: returns max orderable quantity per product (no full catalog stock on browse). */
const postProductsAvailability = asyncHandler(async (req, res) => {
  const raw = req.body && req.body.productIds;
  const ids = Array.isArray(raw) ? raw.map((id) => String(id).trim()).filter(Boolean) : [];
  if (ids.length === 0) {
    throw new ApiError(400, "productIds array is required.");
  }
  const unique = [...new Set(ids)].slice(0, 50);
  const objectIds = unique.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const products = await withMongoReadRetry(() =>
    Product.find({ _id: { $in: objectIds } })
      .select("stock minStock name")
      .lean(),
  );
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const data = {};
  for (const id of unique) {
    const p = byId.get(id);
    if (!p) {
      data[id] = { maxOrderable: 0, lowStock: false, outOfStock: true };
      continue;
    }
    const s = Number(p.stock);
    const stock = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0;
    const m = Number(p.minStock);
    const minStock = Number.isFinite(m) ? Math.max(0, Math.floor(m)) : 0;
    data[id] = {
      maxOrderable: stock,
      lowStock: stock > 0 && minStock > 0 && stock <= minStock,
      outOfStock: stock <= 0,
    };
  }
  res.json({ success: true, data });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, specification, price } = req.body;
  const product = await withMongoReadRetry(() => Product.findById(id));
  if (!product) throw new ApiError(404, "Product not found.");

  if (name) product.name = name.trim();
  if (description !== undefined) product.description = description;
  if (specification !== undefined) product.specification = String(specification).trim();
  if (price !== undefined) product.price = Number(price);

  const ap = parseOptionalNonNegNumber(req.body.actualPrice);
  if (ap !== null) product.actualPrice = ap;
  else if (req.body.actualPrice !== undefined && String(req.body.actualPrice).trim() === "") {
    product.actualPrice = null;
  }

  if (req.body.stock !== undefined) product.stock = parseStock(req.body.stock);
  if (req.body.minStock !== undefined) product.minStock = parseMinStock(req.body.minStock);

  const files = req.files || {};
  const mainList = files.image;
  const mainFile = Array.isArray(mainList) && mainList[0] ? mainList[0] : null;

  let newMainBuf = mainFile && mainFile.buffer ? bufferForMongo(mainFile.buffer) : null;
  let newMainMime = mainFile ? mainFile.mimetype || "image/jpeg" : "image/jpeg";
  if (newMainBuf) {
    const opt = await optimizeStoreImageBuffer(newMainBuf, newMainMime);
    newMainBuf = bufferForMongo(opt.buffer);
    newMainMime = opt.contentType;
  }
  if (mainFile && mainFile.buffer && !newMainBuf) throw new ApiError(400, "Invalid product image.");
  const removeMain = String(req.body.removeMainImage || "").trim() === "1";

  const videoList = files.video;
  const videoFile = Array.isArray(videoList) && videoList[0] ? videoList[0] : null;
  const newVideoBuf = videoFile && videoFile.buffer ? bufferForMongo(videoFile.buffer) : null;
  if (videoFile && videoFile.buffer && !newVideoBuf) throw new ApiError(400, "Invalid product video.");
  const removeVideo = String(req.body.removeVideo || "").trim() === "1";

  const variantFiles = collectVariantFiles(files);
  let legacySlots = normalizeVariantPathSlots(product.variantImages);
  const newVariantBufs = [];
  for (let i = 0; i < 3; i += 1) {
    const removeVariant = String(req.body[`removeVariant${i}`] || "").trim() === "1";
    if (removeVariant) {
      if (legacySlots[i]) safeUnlinkWebPath(legacySlots[i]);
      legacySlots[i] = "";
      product.set(`variantImageData${i}`, undefined);
      product[`variantImageContentType${i}`] = "image/jpeg";
      product[`hasVariant${i}`] = false;
      product.markModified(`variantImageData${i}`);
    }
    const vf = variantFiles[i];
    if (vf && vf.buffer) {
      let vb = bufferForMongo(vf.buffer);
      if (!vb) {
        throw new ApiError(400, `Variant image ${i + 1} is invalid.`);
      }
      const vOpt = await optimizeStoreImageBuffer(vb, vf.mimetype || "image/jpeg");
      vb = bufferForMongo(vOpt.buffer);
      if (legacySlots[i]) safeUnlinkWebPath(legacySlots[i]);
      legacySlots[i] = "";
      product[`variantImageData${i}`] = vb;
      product[`variantImageContentType${i}`] = vOpt.contentType;
      product[`hasVariant${i}`] = true;
      product.markModified(`variantImageData${i}`);
      newVariantBufs.push(vb);
    }
  }
  product.variantImages = legacySlots;

  if (removeMain) {
    product.set("imageData", undefined);
    product.imageContentType = "image/jpeg";
    product.image = "";
    product.markModified("imageData");
  }
  if (newMainBuf) {
    product.imageData = newMainBuf;
    product.imageContentType = newMainMime;
    product.image = "";
    product.markModified("imageData");
  }

  if (removeVideo) {
    product.set("videoData", undefined);
    product.videoContentType = "video/mp4";
    product.markModified("videoData");
  }
  if (newVideoBuf) {
    product.videoData = newVideoBuf;
    product.videoContentType = videoFile.mimetype || "video/mp4";
    product.markModified("videoData");
  }

  const effectiveImage =
    newMainBuf ||
    (!removeMain && product.imageData && Buffer.isBuffer(product.imageData) ? product.imageData : null);
  const effectiveVideo =
    newVideoBuf ||
    (!removeVideo && product.videoData && Buffer.isBuffer(product.videoData) ? product.videoData : null);

  product.hasImage = Boolean(effectiveImage) || legacyHasDiskImage(product);
  product.hasVideo = Boolean(effectiveVideo);

  if (!product.hasImage && !product.hasVideo) {
    throw new ApiError(400, "Product must keep at least an image or a video.");
  }

  ensureTotalBinaryUnderLimit([
    product.imageData,
    product.videoData,
    product.variantImageData0,
    product.variantImageData1,
    product.variantImageData2,
    ...newVariantBufs,
  ]);

  await withMongoReadRetry(() => product.save());
  bustDetailJsonCache(id);
  invalidateProductMedia(id);
  const [fresh, presMap] = await withMongoReadRetry(() =>
    Promise.all([Product.findById(id).select(BINARY_EXCLUDE).lean(), mediaPresenceMapForIds([id])]),
  );
  const pr = presMap === undefined ? undefined : presMap.get(String(id)) || presenceFromAggRow(null);
  const out = publicProduct(fresh, true, pr);
  setDetailJsonCached(id, true, out);
  res.json({ success: true, data: out });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product id.");
  }
  /** Do not load imageData/videoData/variants — large BinData makes Atlas round-trips very slow. */
  const lean = await withMongoReadRetry(() => Product.findById(id).select("image variantImages").lean());
  if (!lean) throw new ApiError(404, "Product not found.");

  const pid = String(lean._id);
  safeUnlinkWebPath(lean.image);
  normalizeVariantPathSlots(lean.variantImages).forEach((p) => safeUnlinkWebPath(p));

  const del = await withMongoReadRetry(() => Product.deleteOne({ _id: lean._id }));
  if (del.deletedCount !== 1) throw new ApiError(404, "Product not found.");

  bustDetailJsonCache(pid);
  invalidateProductMedia(pid);
  res.json({ success: true, message: "Product deleted." });
});

module.exports = {
  createProduct,
  getProducts,
  getProductByBarcode,
  getProductImage,
  getProductVideo,
  getProductVariantImage,
  getProductBarcodePng,
  getProductById,
  postProductsAvailability,
  updateProduct,
  deleteProduct,
};
