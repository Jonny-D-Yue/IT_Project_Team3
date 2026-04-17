const asyncHandler = require("express-async-handler");

const restaurantService = require("../services/restaurantService");
const { validateRestaurantSettingsPayload } = require("../validators/restaurantValidator");
const { sendSuccess } = require("../utils/apiResponse");

const getRestaurant = asyncHandler(async (req, res) => {
  const data = await restaurantService.getRestaurant();
  sendSuccess(res, "Restaurant fetched successfully.", data);
});

const updateRestaurantSettings = asyncHandler(async (req, res) => {
  validateRestaurantSettingsPayload(req.body);
  const data = await restaurantService.updateSettings(req.body);
  sendSuccess(res, "Restaurant settings updated successfully.", data);
});

module.exports = {
  getRestaurant,
  updateRestaurantSettings,
};
