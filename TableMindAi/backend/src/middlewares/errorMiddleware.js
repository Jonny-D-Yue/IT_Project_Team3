const { isValidObjectId } = require("mongoose");

const ApiError = require("../utils/ApiError");

const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong.";

  if (err.name === "CastError" && err.path === "_id") {
    statusCode = 400;
    message = "Invalid resource ID.";
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0];
    message = `${duplicateField || "Record"} already exists.`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (err.type === "entity.too.large" || err.status === 413) {
    statusCode = 413;
    message = "Uploaded image is too large. Please use a smaller image or compress it before uploading.";
  }

  if (statusCode >= 500) {
    console.error("Request failed:", {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

const validateObjectIdParam = (paramName = "id") => (req, res, next) => {
  if (!isValidObjectId(req.params[paramName])) {
    return next(new ApiError(400, "Invalid resource ID."));
  }

  next();
};

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
  validateObjectIdParam,
};
