const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  },
  { timestamps: true }
);

subCategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model("SubCategory", subCategorySchema);
