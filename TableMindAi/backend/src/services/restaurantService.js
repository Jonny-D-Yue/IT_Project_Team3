const Restaurant = require("../models/Restaurant");
const ApiError = require("../utils/ApiError");

const getRestaurant = async () => {
  const restaurant = await Restaurant.findOne().sort({ createdAt: 1 });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant settings not found. Run the seed script first.");
  }

  return restaurant;
};

const updateSettings = async (payload) => {
  const restaurant = await getRestaurant();

  Object.assign(restaurant, payload);
  await restaurant.save();

  return restaurant;
};

module.exports = {
  getRestaurant,
  updateSettings,
};
