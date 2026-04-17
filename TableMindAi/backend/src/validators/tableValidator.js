const ApiError = require("../utils/ApiError");
const { isValidObjectId } = require("mongoose");

const validateTablePayload = (payload) => {
  if (!payload.restaurantId) {
    throw new ApiError(400, "restaurantId is required.");
  }

  if (!isValidObjectId(payload.restaurantId)) {
    throw new ApiError(400, "restaurantId must be a valid MongoDB ObjectId.");
  }

  const tableNumber = Number(payload.tableNumber);

  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    throw new ApiError(400, "Table number must be a positive integer.");
  }
};

module.exports = {
  validateTablePayload,
};
