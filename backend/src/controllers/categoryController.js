const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiError(400, "Category name is required.");

  const exists = await Category.findOne({ name: name.trim() });
  if (exists) throw new ApiError(409, "Category already exists.");

  const category = await Category.create({ name: name.trim(), description: description || "" });
  res.status(201).json({ success: true, data: category });
});

const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json({ success: true, data: categories });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found.");

  if (name) category.name = name.trim();
  if (description !== undefined) category.description = description;
  await category.save();

  res.json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found.");

  await Product.deleteMany({ categoryId: id });
  await SubCategory.deleteMany({ categoryId: id });
  await category.deleteOne();

  res.json({ success: true, message: "Category deleted." });
});

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
