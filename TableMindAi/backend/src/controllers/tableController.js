const asyncHandler = require("express-async-handler");

const tableService = require("../services/tableService");
const { validateTablePayload } = require("../validators/tableValidator");
const { sendSuccess } = require("../utils/apiResponse");

const validateTableNumber = asyncHandler(async (req, res) => {
  validateTablePayload(req.body);
  const data = await tableService.validateTableNumber(req.body.restaurantId, req.body.tableNumber);
  sendSuccess(res, data.message, data);
});

const createTableSession = asyncHandler(async (req, res) => {
  validateTablePayload(req.body);
  const data = await tableService.createSession(req.body.restaurantId, req.body.tableNumber);
  sendSuccess(res, "Table session created successfully.", data, 201);
});

const getTableConfig = asyncHandler(async (req, res) => {
  const data = await tableService.getTableConfig();
  sendSuccess(res, "Table configuration fetched successfully.", data);
});

module.exports = {
  validateTableNumber,
  createTableSession,
  getTableConfig,
};
