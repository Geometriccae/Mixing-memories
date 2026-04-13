const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");

const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

/** Don't gzip JPEG/MP4 responses (already compressed; wastes CPU). */
function compressionFilterSkipBinaryProductMedia(req, res) {
  const p = req.path || "";
  if (
    p.includes("/api/products/") &&
    (p.includes("/image") || p.includes("/video") || p.includes("/variant"))
  ) {
    return false;
  }
  return compression.filter(req, res);
}

const app = express();

app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin, credentials: true }));
app.use(compression({ threshold: 512, filter: compressionFilterSkipBinaryProductMedia }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/testimonials", testimonialRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
