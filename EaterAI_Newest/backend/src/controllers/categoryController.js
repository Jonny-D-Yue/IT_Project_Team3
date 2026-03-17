const asyncHandler = require("express-async-handler");

const categoryService = require("../services/categoryService");
const { validateCategoryPayload } = require("../validators/categoryValidator");
const { sendSuccess } = require("../utils/apiResponse");

const getCategories = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategories();
  sendSuccess(res, "Categories fetched successfully.", data);
});

const createCategory = asyncHandler(async (req, res) => {
  validateCategoryPayload(req.body);
  const data = await categoryService.createCategory(req.body);
  sendSuccess(res, "Category created successfully.", data, 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  validateCategoryPayload(req.body);
  const data = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, "Category updated successfully.", data);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, "Category deleted successfully.", data);
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
