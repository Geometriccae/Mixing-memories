const Category = require("../models/Category");
const Product = require("../models/Product");
const SubCategory = require("../models/SubCategory");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, categoryId, subCategoryId } = req.body;
  if (!name || price === undefined || !categoryId || !subCategoryId) {
    throw new ApiError(400, "name, price, categoryId and subCategoryId are required.");
  }

  const [category, subCategory] = await Promise.all([
    Category.findById(categoryId),
    SubCategory.findById(subCategoryId),
  ]);
  if (!category) throw new ApiError(404, "Category not found.");
  if (!subCategory) throw new ApiError(404, "SubCategory not found.");

  const image = req.file ? `/uploads/${req.file.filename}` : "";
  const product = await Product.create({
    name: name.trim(),
    description: description || "",
    price: Number(price),
    image,
    categoryId,
    subCategoryId,
  });

  res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", categoryId, subCategoryId, minPrice, maxPrice } = req.query;
  const filter = {};

  if (categoryId) filter.categoryId = categoryId;
  if (subCategoryId) filter.subCategoryId = subCategoryId;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("categoryId", "name")
    .populate("subCategoryId", "name");
  if (!product) throw new ApiError(404, "Product not found.");
  res.json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, categoryId, subCategoryId } = req.body;
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found.");

  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new ApiError(404, "Category not found.");
    product.categoryId = categoryId;
  }

  if (subCategoryId) {
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) throw new ApiError(404, "SubCategory not found.");
    product.subCategoryId = subCategoryId;
  }

  if (name) product.name = name.trim();
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (req.file) product.image = `/uploads/${req.file.filename}`;

  await product.save();
  res.json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  await product.deleteOne();
  res.json({ success: true, message: "Product deleted." });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
