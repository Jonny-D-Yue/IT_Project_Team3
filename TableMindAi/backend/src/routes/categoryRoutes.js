const express = require("express");

const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { validateObjectIdParam } = require("../middlewares/errorMiddleware");

const router = express.Router();

router.get("/", categoryController.getCategories);
router.post("/", authMiddleware, roleMiddleware("admin"), categoryController.createCategory);
router.put("/:id", authMiddleware, roleMiddleware("admin"), validateObjectIdParam(), categoryController.updateCategory);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), validateObjectIdParam(), categoryController.deleteCategory);

module.exports = router;
