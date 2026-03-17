const express = require("express");

const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { validateObjectIdParam } = require("../middlewares/errorMiddleware");

const router = express.Router();

router.post("/", orderController.createOrder);
router.post("/staff-create", authMiddleware, roleMiddleware("staff", "admin"), orderController.createStaffOrder);
router.get("/", authMiddleware, roleMiddleware("staff", "admin"), orderController.getOrders);
router.get("/table-overview", authMiddleware, roleMiddleware("staff", "admin"), orderController.getTableOverview);
router.get("/table/:tableNumber/splits", authMiddleware, roleMiddleware("staff", "admin"), orderController.getSplitBillsByTable);
router.post("/table/:tableNumber/splits", authMiddleware, roleMiddleware("staff", "admin"), orderController.createSplitBill);
router.patch(
  "/table/:tableNumber/move",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  orderController.moveTableOrders
);
router.get("/table/:tableNumber", authMiddleware, roleMiddleware("staff", "admin"), orderController.getOrdersByTable);
router.patch(
  "/splits/:id/status",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  validateObjectIdParam(),
  orderController.updateSplitBillStatus
);
router.patch(
  "/table/:tableNumber/payment",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  orderController.updateTablePaymentStatus
);
router.get("/:id", authMiddleware, roleMiddleware("staff", "admin"), validateObjectIdParam(), orderController.getOrderById);
router.patch(
  "/:id/payment",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  validateObjectIdParam(),
  orderController.updateOrderPaymentStatus
);
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  validateObjectIdParam(),
  orderController.updateOrderStatus
);

module.exports = router;
