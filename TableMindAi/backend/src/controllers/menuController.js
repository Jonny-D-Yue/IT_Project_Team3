const asyncHandler = require("express-async-handler");

const menuService = require("../services/menuService");
const { uploadMenuImage } = require("../services/imageUploadService");
const { validateMenuPayload, validateMenuImageUploadPayload } = require("../validators/menuValidator");
const { sendSuccess } = require("../utils/apiResponse");

const getMenu = asyncHandler(async (req, res) => {
  const data = await menuService.getMenu(req.query);
  sendSuccess(res, "Menu fetched successfully.", data);
});

const getMenuItemById = asyncHandler(async (req, res) => {
  const data = await menuService.getMenuItemById(req.params.id);
  sendSuccess(res, "Menu item fetched successfully.", data);
});

const createMenuItem = asyncHandler(async (req, res) => {
  validateMenuPayload(req.body);
  const data = await menuService.createMenuItem(req.body);
  sendSuccess(res, "Menu item created successfully.", data, 201);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  validateMenuPayload(req.body);
  const data = await menuService.updateMenuItem(req.params.id, req.body);
  sendSuccess(res, "Menu item updated successfully.", data);
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const data = await menuService.deleteMenuItem(req.params.id);
  sendSuccess(res, "Menu item deleted successfully.", data);
});

const uploadImage = asyncHandler(async (req, res) => {
  validateMenuImageUploadPayload(req.body);
  const data = await uploadMenuImage(req.body);
  sendSuccess(res, "Menu image uploaded successfully.", data);
});

module.exports = {
  getMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadImage,
};
