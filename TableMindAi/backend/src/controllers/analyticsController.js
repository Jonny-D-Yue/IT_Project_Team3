const asyncHandler = require("express-async-handler");

const analyticsService = require("../services/analyticsService");
const { sendSuccess } = require("../utils/apiResponse");

const getAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAnalytics();
  sendSuccess(res, "Analytics fetched successfully.", data);
});

const closeBusinessDay = asyncHandler(async (req, res) => {
  const data = await analyticsService.closeBusinessDay({
    businessDate: req.body?.businessDate,
    notes: req.body?.notes,
    closedBy: req.user.userId,
  });
  sendSuccess(res, "Business day closed successfully.", data, 201);
});

const getDailyCheckouts = asyncHandler(async (req, res) => {
  const data = await analyticsService.getDailyCheckouts();
  sendSuccess(res, "Daily checkouts fetched successfully.", data);
});

const getHistoryEntries = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHistoryEntries(req.query);
  sendSuccess(res, "History entries fetched successfully.", data);
});

module.exports = {
  getAnalytics,
  closeBusinessDay,
  getDailyCheckouts,
  getHistoryEntries,
};
