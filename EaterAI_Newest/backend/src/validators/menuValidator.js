const ApiError = require("../utils/ApiError");

const validateMenuPayload = (payload) => {
  if (!payload.name || !payload.category) {
    throw new ApiError(400, "name and category are required.");
  }

  if (typeof payload.price !== "number" || payload.price < 0) {
    throw new ApiError(400, "price must be a non-negative number.");
  }
};

const validateMenuImageUploadPayload = (payload) => {
  if (!payload.imageBase64 || !payload.mimeType) {
    throw new ApiError(400, "imageBase64 and mimeType are required.");
  }

  if (!/^image\/(png|jpeg|jpg|webp)$/i.test(payload.mimeType)) {
    throw new ApiError(400, "Only PNG, JPG, JPEG, and WEBP images are supported.");
  }
};

module.exports = {
  validateMenuPayload,
  validateMenuImageUploadPayload,
};
