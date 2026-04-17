const ApiError = require("../utils/ApiError");
const { isValidObjectId } = require("mongoose");

const validateAiChatPayload = (payload) => {
  if (!payload.restaurantId || !payload.sessionToken || !payload.message) {
    throw new ApiError(400, "restaurantId, sessionToken, and message are required.");
  }

  if (!isValidObjectId(payload.restaurantId)) {
    throw new ApiError(400, "restaurantId must be a valid MongoDB ObjectId.");
  }

  if (!Number.isInteger(Number(payload.tableNumber)) || Number(payload.tableNumber) < 1) {
    throw new ApiError(400, "tableNumber must be a positive integer.");
  }
};

const validateMenuImagePayload = (payload) => {
  if (!payload.imageBase64 || !payload.mimeType) {
    throw new ApiError(400, "imageBase64 and mimeType are required.");
  }

  if (!/^image\/(png|jpeg|jpg|webp)$/i.test(payload.mimeType)) {
    throw new ApiError(400, "Only PNG, JPG, JPEG, and WEBP images are supported.");
  }
};

module.exports = {
  validateAiChatPayload,
  validateMenuImagePayload,
};
