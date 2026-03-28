const mongoose = require("mongoose");

function notFound(_req, _res, next) {
  const err = new Error("Route not found.");
  err.statusCode = 404;
  next(err);
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  if (err instanceof mongoose.Error.CastError) {
    message = "Invalid resource id.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { notFound, errorHandler };
