const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");

const getCategories = async () => Category.find().sort({ name: 1 });

const createCategory = async (payload) => Category.create(payload);

const updateCategory = async (id, payload) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found.");
  }

  Object.assign(category, payload);
  await category.save();

  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new ApiError(404, "Category not found.");
  }

  await category.deleteOne();

  return { _id: id };
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
