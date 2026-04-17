const express = require("express");

const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/analytics", authMiddleware, roleMiddleware("admin"), analyticsController.getAnalytics);
router.get("/daily-checkouts", authMiddleware, roleMiddleware("admin"), analyticsController.getDailyCheckouts);
router.get("/history", authMiddleware, roleMiddleware("admin"), analyticsController.getHistoryEntries);
router.post("/daily-checkouts/close", authMiddleware, roleMiddleware("admin"), analyticsController.closeBusinessDay);

module.exports = router;
