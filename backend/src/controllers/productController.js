const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { safeUnlinkWebPath } = require("../utils/saveProductUpload");

/**
 * MongoDB document limit is ~16MB. Buffers (main image, variants, optional video) share one cap.
 */
const MAX_TOTAL_BINARY_BYTES = 15 * 1024 * 1024;

function bufferForMongo(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return Buffer.from(buffer);
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

function publicProduct(doc, isAdmin = false) {
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

  const hasVideoFlag = resolveHasVideo(o);
  const hasImageFlag = resolveHasImage(o, hasVideoFlag);

  if (!isAdmin) {
    delete o.stock;
    delete o.minStock;
    o.inStock = stock > 0;
    o.lowStock = stock > 0 && minStock > 0 && stock <= minStock;
    o.outOfStock = stock <= 0;
  }

  const id = String(o._id);
  const v = o.updatedAt ? new Date(o.updatedAt).getTime() : Date.now();
  o.imageUrl = hasImageFlag ? `/api/products/${id}/image?v=${v}` : null;
  o.videoUrl = hasVideoFlag ? `/api/products/${id}/video?v=${v}` : null;
  o.hasImage = hasImageFlag;
  o.hasVideo = hasVideoFlag;

  const legacyPaths = normalizeVariantPathSlots(o.variantImages);
  o.variantImageUrls = [0, 1, 2].map((i) => {
    const legacy = legacyPaths[i] && typeof legacyPaths[i] === "string" && legacyPaths[i].startsWith("/uploads/");
    if (variantFlags[i] || legacy) {
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

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, specification, price } = req.body;
  if (!name || price === undefined) {
    throw new ApiError(400, "name and price are required.");
  }

  const files = req.files || {};
  const mainList = files.image;
  const file = Array.isArray(mainList) && mainList[0] ? mainList[0] : null;
  const mainBuf = file && file.buffer ? bufferForMongo(file.buffer) : null;

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
    doc.imageContentType = file.mimetype || "image/jpeg";
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
      const vb = bufferForMongo(vf.buffer);
      if (!vb) {
        throw new ApiError(400, `Variant image ${i + 1} is invalid.`);
      }
      doc[`variantImageData${i}`] = vb;
      doc[`variantImageContentType${i}`] = vf.mimetype || "image/jpeg";
      doc[`hasVariant${i}`] = true;
      allBuffers.push(vb);
    }
  }
  ensureTotalBinaryUnderLimit(allBuffers);

  const product = await Product.create(doc);
  const full = await Product.findById(product._id).select(BINARY_EXCLUDE);
  res.status(201).json({ success: true, data: publicProduct(full, true) });
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

  const [items, total] = await Promise.all([
    Product.find(filter).select(BINARY_EXCLUDE).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  const isAdmin = !!(req.user && req.user.role === "admin");
  const data = items.map((p) => publicProduct(p, isAdmin));

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

const getProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  const buf = product.imageData;
  if (buf && Buffer.isBuffer(buf) && buf.length > 0) {
    res.set("Content-Type", product.imageContentType || "image/jpeg");
    res.set("Cache-Control", "no-store");
    return res.send(buf);
  }

  const abs = legacyFileAbsolute(product.image);
  if (abs && fs.existsSync(abs)) {
    return res.sendFile(path.resolve(abs));
  }

  throw new ApiError(404, "Image not found.");
});

const getProductVideo = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  const buf = product.videoData;
  if (buf && Buffer.isBuffer(buf) && buf.length > 0) {
    res.set("Content-Type", product.videoContentType || "video/mp4");
    res.set("Cache-Control", "no-store");
    res.set("Accept-Ranges", "bytes");
    return res.send(buf);
  }

  throw new ApiError(404, "Video not found.");
});

const getProductVariantImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  const idx = Number(req.params.idx);
  if (!Number.isInteger(idx) || idx < 0 || idx > 2) {
    throw new ApiError(404, "Image not found.");
  }

  const vbuf = product[`variantImageData${idx}`];
  if (vbuf && Buffer.isBuffer(vbuf) && vbuf.length > 0) {
    res.set("Content-Type", product[`variantImageContentType${idx}`] || "image/jpeg");
    res.set("Cache-Control", "no-store");
    return res.send(vbuf);
  }

  const slots = normalizeVariantPathSlots(product.variantImages);
  const webPath = slots[idx];
  const abs = legacyFileAbsolute(webPath);
  if (abs && fs.existsSync(abs)) {
    return res.sendFile(path.resolve(abs));
  }

  throw new ApiError(404, "Image not found.");
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select(BINARY_EXCLUDE);
  if (!product) throw new ApiError(404, "Product not found.");
  const isAdmin = !!(req.user && req.user.role === "admin");
  res.json({ success: true, data: publicProduct(product, isAdmin) });
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
  const products = await Product.find({ _id: { $in: objectIds } }).select("stock minStock name").lean();
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
  const product = await Product.findById(id);
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

  const newMainBuf = mainFile && mainFile.buffer ? bufferForMongo(mainFile.buffer) : null;
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
      const vb = bufferForMongo(vf.buffer);
      if (!vb) {
        throw new ApiError(400, `Variant image ${i + 1} is invalid.`);
      }
      if (legacySlots[i]) safeUnlinkWebPath(legacySlots[i]);
      legacySlots[i] = "";
      product[`variantImageData${i}`] = vb;
      product[`variantImageContentType${i}`] = vf.mimetype || "image/jpeg";
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
    product.imageContentType = mainFile.mimetype || "image/jpeg";
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

  await product.save();
  const fresh = await Product.findById(id).select(BINARY_EXCLUDE);
  res.json({ success: true, data: publicProduct(fresh, true) });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  safeUnlinkWebPath(product.image);
  normalizeVariantPathSlots(product.variantImages).forEach((p) => safeUnlinkWebPath(p));
  await product.deleteOne();
  res.json({ success: true, message: "Product deleted." });
});

module.exports = {
  createProduct,
  getProducts,
  getProductImage,
  getProductVideo,
  getProductVariantImage,
  getProductById,
  postProductsAvailability,
  updateProduct,
  deleteProduct,
};
