const ApiError = require("../utils/ApiError");

const validateLoginPayload = (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }
};

module.exports = {
  validateLoginPayload,
};
