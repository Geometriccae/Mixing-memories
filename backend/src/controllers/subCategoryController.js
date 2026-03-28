const Category = require("../models/Category");
const Product = require("../models/Product");
const SubCategory = require("../models/SubCategory");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const createSubCategory = asyncHandler(async (req, res) => {
  const { name, categoryId } = req.body;
  if (!name || !categoryId) throw new ApiError(400, "name and categoryId are required.");

  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(404, "Parent category not found.");

  const subCategory = await SubCategory.create({ name: name.trim(), categoryId });
  res.status(201).json({ success: true, data: subCategory });
});

const getSubCategories = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const filter = categoryId ? { categoryId } : {};
  const subCategories = await SubCategory.find(filter).populate("categoryId", "name").sort({ createdAt: -1 });
  res.json({ success: true, data: subCategories });
});

const updateSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, categoryId } = req.body;
  const subCategory = await SubCategory.findById(id);
  if (!subCategory) throw new ApiError(404, "SubCategory not found.");

  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new ApiError(404, "Parent category not found.");
    subCategory.categoryId = categoryId;
  }
  if (name) subCategory.name = name.trim();

  await subCategory.save();
  res.json({ success: true, data: subCategory });
});

const deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subCategory = await SubCategory.findById(id);
  if (!subCategory) throw new ApiError(404, "SubCategory not found.");

  await Product.deleteMany({ subCategoryId: id });
  await subCategory.deleteOne();

  res.json({ success: true, message: "SubCategory deleted." });
});

module.exports = { createSubCategory, getSubCategories, updateSubCategory, deleteSubCategory };
