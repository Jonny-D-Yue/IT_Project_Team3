const express = require("express");

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/chat", aiController.getChatHistory);
router.post("/chat", aiController.chat);
router.post("/recommend", aiController.recommend);
router.post("/menu-from-image", authMiddleware, roleMiddleware("admin"), aiController.analyzeMenuImage);

module.exports = router;
