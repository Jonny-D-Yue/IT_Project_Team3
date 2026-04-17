const Restaurant = require("../models/Restaurant");
const TableSession = require("../models/TableSession");
const ApiError = require("../utils/ApiError");
const { generateSessionToken } = require("../utils/generateSessionToken");

const getRestaurantOrThrow = async (restaurantId) => {
  const restaurant = restaurantId
    ? await Restaurant.findById(restaurantId)
    : await Restaurant.findOne().sort({ createdAt: 1 });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant settings not found.");
  }

  return restaurant;
};

const validateTableNumber = async (restaurantId, tableNumber) => {
  const restaurant = await getRestaurantOrThrow(restaurantId);
  const parsedTableNumber = Number(tableNumber);
  const isValid = Number.isInteger(parsedTableNumber) && parsedTableNumber >= 1 && parsedTableNumber <= restaurant.totalTables;

  return {
    valid: isValid,
    message: isValid
      ? "Table number is valid."
      : `It looks like there is a mistake. This restaurant only has tables up to ${restaurant.totalTables}.`,
    restaurantId: restaurant._id,
    tableNumber: parsedTableNumber,
    totalTables: restaurant.totalTables,
  };
};

const createSession = async (restaurantId, tableNumber) => {
  const validationResult = await validateTableNumber(restaurantId, tableNumber);

  if (!validationResult.valid) {
    throw new ApiError(400, validationResult.message);
  }

  const restaurant = await getRestaurantOrThrow(restaurantId);
  const session = await TableSession.create({
    restaurantId: restaurant._id,
    tableNumber: Number(tableNumber),
    sessionToken: generateSessionToken(),
  });

  return {
    restaurantId: restaurant._id,
    tableNumber: session.tableNumber,
    sessionToken: session.sessionToken,
  };
};

const getTableConfig = async () => {
  const restaurant = await getRestaurantOrThrow();

  return {
    restaurantId: restaurant._id,
    totalTables: restaurant.totalTables,
    isOpen: restaurant.isOpen,
  };
};

module.exports = {
  validateTableNumber,
  createSession,
  getTableConfig,
};
