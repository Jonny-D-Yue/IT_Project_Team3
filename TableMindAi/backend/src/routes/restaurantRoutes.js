const express = require("express");

const restaurantController = require("../controllers/restaurantController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/", restaurantController.getRestaurant);
router.put("/settings", authMiddleware, roleMiddleware("admin"), restaurantController.updateRestaurantSettings);

module.exports = router;
