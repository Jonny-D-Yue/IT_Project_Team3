const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");
const ApiError = require("../utils/ApiError");

const ensureCategoryExists = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new ApiError(400, "Category does not exist.");
  }
};

const getMenu = async (query) => {
  const filters = {};

  if (query.category) {
    filters.category = query.category;
  }

  if (typeof query.available !== "undefined") {
    filters.isAvailable = query.available === "true";
  }

  if (query.search) {
    filters.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
      { tags: { $regex: query.search, $options: "i" } },
    ];
  }

  const hasPagination = typeof query.page !== "undefined" || typeof query.limit !== "undefined";

  if (!hasPagination) {
    return MenuItem.find(filters).populate("category").sort({ createdAt: -1 });
  }

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 9));
  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    MenuItem.find(filters).populate("category").sort({ createdAt: -1 }).skip(skip).limit(limit),
    MenuItem.countDocuments(filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
};

const getMenuItemById = async (id) => {
  const item = await MenuItem.findById(id).populate("category");

  if (!item) {
    throw new ApiError(404, "Menu item not found.");
  }

  return item;
};

const createMenuItem = async (payload) => {
  await ensureCategoryExists(payload.category);
  return MenuItem.create(payload);
};

const updateMenuItem = async (id, payload) => {
  await ensureCategoryExists(payload.category);

  const item = await MenuItem.findById(id);

  if (!item) {
    throw new ApiError(404, "Menu item not found.");
  }

  Object.assign(item, payload);
  await item.save();

  return item;
};

const deleteMenuItem = async (id) => {
  const item = await MenuItem.findById(id);

  if (!item) {
    throw new ApiError(404, "Menu item not found.");
  }

  await item.deleteOne();

  return { _id: id };
};

module.exports = {
  getMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
