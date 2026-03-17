const ApiError = require("../utils/ApiError");

const validateCategoryPayload = (payload) => {
  if (!payload.name) {
    throw new ApiError(400, "Category name is required.");
  }
};

module.exports = {
  validateCategoryPayload,
};
