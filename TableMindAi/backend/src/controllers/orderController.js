const asyncHandler = require("express-async-handler");

const orderService = require("../services/orderService");
const {
  validateCreateOrderPayload,
  validateStaffCreateOrderPayload,
  validateOrderStatusPayload,
  validatePaymentStatusPayload,
  validateSplitBillPayload,
} = require("../validators/orderValidator");
const { sendSuccess } = require("../utils/apiResponse");

const createOrder = asyncHandler(async (req, res) => {
  validateCreateOrderPayload(req.body);
  const data = await orderService.createOrder(req.body);
  sendSuccess(res, "Order created successfully.", data, 201);
});

const createStaffOrder = asyncHandler(async (req, res) => {
  validateStaffCreateOrderPayload(req.body);
  const data = await orderService.createStaffOrder(req.body);
  sendSuccess(res, "Staff order created successfully.", data, 201);
});

const getOrders = asyncHandler(async (req, res) => {
  const data = await orderService.getOrders(req.query);
  sendSuccess(res, "Orders fetched successfully.", data);
});

const getOrderById = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderById(req.params.id);
  sendSuccess(res, "Order fetched successfully.", data);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  validateOrderStatusPayload(req.body);
  const data = await orderService.updateOrderStatus(req.params.id, req.body.status);
  sendSuccess(res, "Order status updated successfully.", data);
});

const getOrdersByTable = asyncHandler(async (req, res) => {
  const data = await orderService.getOrdersByTable(req.params.tableNumber);
  sendSuccess(res, "Table orders fetched successfully.", data);
});

const updateOrderPaymentStatus = asyncHandler(async (req, res) => {
  validatePaymentStatusPayload(req.body);
  const data = await orderService.updateOrderPaymentStatus(req.params.id, req.body.paymentStatus, req.body);
  sendSuccess(res, "Order payment status updated successfully.", data);
});

const updateTablePaymentStatus = asyncHandler(async (req, res) => {
  validatePaymentStatusPayload(req.body);
  const data = await orderService.updateTablePaymentStatus(req.params.tableNumber, req.body.paymentStatus, req.body);
  sendSuccess(res, "Table payment status updated successfully.", data);
});

const getTableOverview = asyncHandler(async (req, res) => {
  const data = await orderService.getTableOverview();
  sendSuccess(res, "Table overview fetched successfully.", data);
});

const moveTableOrders = asyncHandler(async (req, res) => {
  const data = await orderService.moveTableOrders(req.params.tableNumber, req.body.targetTableNumber);
  sendSuccess(res, "Table bill moved successfully.", data);
});

const getSplitBillsByTable = asyncHandler(async (req, res) => {
  const data = await orderService.getSplitBillsByTable(req.params.tableNumber);
  sendSuccess(res, "Split bills fetched successfully.", data);
});

const createSplitBill = asyncHandler(async (req, res) => {
  validateSplitBillPayload(req.body);
  const data = await orderService.createSplitBill(req.params.tableNumber, req.body.items);
  sendSuccess(res, "Split bill created successfully.", data, 201);
});

const updateSplitBillStatus = asyncHandler(async (req, res) => {
  const data = await orderService.updateSplitBillStatus(req.params.id, req.body.status, req.body);
  sendSuccess(res, "Split bill status updated successfully.", data);
});

module.exports = {
  createOrder,
  createStaffOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByTable,
  updateOrderPaymentStatus,
  updateTablePaymentStatus,
  getTableOverview,
  moveTableOrders,
  getSplitBillsByTable,
  createSplitBill,
  updateSplitBillStatus,
};
