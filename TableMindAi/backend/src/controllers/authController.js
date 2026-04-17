const asyncHandler = require("express-async-handler");

const authService = require("../services/authService");
const { validateLoginPayload } = require("../validators/authValidator");
const { sendSuccess } = require("../utils/apiResponse");

const login = asyncHandler(async (req, res) => {
  validateLoginPayload(req.body);
  const data = await authService.login(req.body);
  sendSuccess(res, "Login successful.", data);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const data = await authService.getCurrentUser(req.user.userId);
  sendSuccess(res, "Authenticated user fetched successfully.", data);
});

module.exports = {
  login,
  getCurrentUser,
};
