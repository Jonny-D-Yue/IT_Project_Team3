const express = require("express");

const menuController = require("../controllers/menuController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { validateObjectIdParam } = require("../middlewares/errorMiddleware");

const router = express.Router();

router.get("/", menuController.getMenu);
router.get("/:id", validateObjectIdParam(), menuController.getMenuItemById);
router.post("/upload-image", authMiddleware, roleMiddleware("admin"), menuController.uploadImage);
router.post("/", authMiddleware, roleMiddleware("admin"), menuController.createMenuItem);
router.put("/:id", authMiddleware, roleMiddleware("admin"), validateObjectIdParam(), menuController.updateMenuItem);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), validateObjectIdParam(), menuController.deleteMenuItem);

module.exports = router;
