const ApiError = require("../utils/ApiError");

const validateRestaurantSettingsPayload = (payload) => {
  if (!Number.isInteger(Number(payload.totalTables)) || Number(payload.totalTables) < 1) {
    throw new ApiError(400, "totalTables must be a positive integer.");
  }

  if (typeof payload.taxRate !== "number" || payload.taxRate < 0) {
    throw new ApiError(400, "taxRate must be a non-negative number.");
  }
};

module.exports = {
  validateRestaurantSettingsPayload,
};
