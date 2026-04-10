const mongoose = require("mongoose");

function notFound(_req, _res, next) {
  const err = new Error("Route not found.");
  err.statusCode = 404;
  next(err);
}

function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large. Maximum size is 100 MB.";
  }

  // MongoDB: document too large (e.g. storing images as Buffers)
  const msg = String(err && err.message ? err.message : "");
  if (
    msg.includes("BSONObj size") ||
    msg.includes("BSONObjectTooLarge") ||
    msg.toLowerCase().includes("document is too large") ||
    msg.toLowerCase().includes("bson") && msg.toLowerCase().includes("too large")
  ) {
    statusCode = 413;
    message = "Images are too large to store in MongoDB (document limit ~16MB). Please upload smaller images.";
  }

  if (err instanceof mongoose.Error.CastError) {
    message = "Invalid resource id.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { notFound, errorHandler };
