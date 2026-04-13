const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    specification: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    actualPrice: { type: Number, default: null, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    /** Alert threshold: when stock <= minStock, admin UI highlights; storefront shows "limited" */
    minStock: { type: Number, default: 0, min: 0 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory", default: null },
    /** Retail code e.g. RO-GULKAND 0001 (CODE128). Not exposed on public product JSON. */
    barcode: { type: String, trim: true },
    manufacturer: { type: String, default: "", trim: true },
    quality: { type: String, default: "", trim: true },
    /** Main product image — stored only in MongoDB (no uploads/ file) */
    imageData: { type: Buffer, default: undefined },
    imageContentType: { type: String, default: "image/jpeg" },
    /** Optional short product video (same document size limits as images) */
    videoData: { type: Buffer, default: undefined },
    videoContentType: { type: String, default: "video/mp4" },
    /** Denormalized for list JSON without loading Buffer fields */
    hasImage: { type: Boolean },
    hasVideo: { type: Boolean },
    /** @deprecated Legacy disk path; new products leave this empty */
    image: { type: String, default: "" },
    /** @deprecated Legacy variant paths under /uploads/ — new products use variantImageData* */
    variantImages: { type: [String], default: [] },
    variantImageData0: { type: Buffer, default: undefined },
    variantImageContentType0: { type: String, default: "image/jpeg" },
    variantImageData1: { type: Buffer, default: undefined },
    variantImageContentType1: { type: String, default: "image/jpeg" },
    variantImageData2: { type: Buffer, default: undefined },
    variantImageContentType2: { type: String, default: "image/jpeg" },
    /** Denormalized so list API can expose variant URLs without loading Buffer fields */
    hasVariant0: { type: Boolean, default: false },
    hasVariant1: { type: Boolean, default: false },
    hasVariant2: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ barcode: 1 }, { unique: true, sparse: true });

productSchema.methods.hasImageBuffer = function hasImageBuffer() {
  return this.imageData && this.imageData.length > 0;
};

module.exports = mongoose.model("Product", productSchema);
