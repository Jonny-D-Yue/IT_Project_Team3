const ApiError = require("../utils/ApiError");
const { ORDER_STATUSES, PAYMENT_STATUSES } = require("../utils/constants");

const validateCreateOrderPayload = (payload) => {
  const { restaurantId, tableNumber, sessionToken, items } = payload;

  if (!restaurantId || !sessionToken) {
    throw new ApiError(400, "restaurantId and sessionToken are required.");
  }

  if (!Number.isInteger(Number(tableNumber)) || Number(tableNumber) < 1) {
    throw new ApiError(400, "tableNumber must be a positive integer.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one order item is required.");
  }

  items.forEach((item, index) => {
    if (!item.menuItemId) {
      throw new ApiError(400, `items[${index}].menuItemId is required.`);
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      throw new ApiError(400, `items[${index}].quantity must be a positive integer.`);
    }
  });
};

const validateStaffCreateOrderPayload = (payload) => {
  const { tableNumber, items } = payload;

  if (!Number.isInteger(Number(tableNumber)) || Number(tableNumber) < 1) {
    throw new ApiError(400, "tableNumber must be a positive integer.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one order item is required.");
  }

  items.forEach((item, index) => {
    if (!item.menuItemId) {
      throw new ApiError(400, `items[${index}].menuItemId is required.`);
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      throw new ApiError(400, `items[${index}].quantity must be a positive integer.`);
    }
  });
};

const validateOrderStatusPayload = (payload) => {
  if (!payload.status || !Object.values(ORDER_STATUSES).includes(payload.status)) {
    throw new ApiError(400, `status must be one of: ${Object.values(ORDER_STATUSES).join(", ")}.`);
  }
};

const validatePaymentStatusPayload = (payload) => {
  if (!payload.paymentStatus || ![PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PAID].includes(payload.paymentStatus)) {
    throw new ApiError(400, `paymentStatus must be one of: ${PAYMENT_STATUSES.UNPAID}, ${PAYMENT_STATUSES.PAID}.`);
  }

  if (payload.paymentMethod && !["CASH", "CARD"].includes(payload.paymentMethod)) {
    throw new ApiError(400, "paymentMethod must be CASH or CARD.");
  }

  if (payload.cashReceived != null && Number(payload.cashReceived) < 0) {
    throw new ApiError(400, "cashReceived must be a non-negative number.");
  }

  if (payload.changeDue != null && Number(payload.changeDue) < 0) {
    throw new ApiError(400, "changeDue must be a non-negative number.");
  }
};

const validateSplitBillPayload = (payload) => {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ApiError(400, "At least one split bill item is required.");
  }

  payload.items.forEach((item, index) => {
    if (!item.orderId) {
      throw new ApiError(400, `items[${index}].orderId is required.`);
    }

    if (!Number.isInteger(Number(item.itemIndex)) || Number(item.itemIndex) < 0) {
      throw new ApiError(400, `items[${index}].itemIndex must be a non-negative integer.`);
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
      throw new ApiError(400, `items[${index}].quantity must be a positive integer.`);
    }
  });
};

module.exports = {
  validateCreateOrderPayload,
  validateStaffCreateOrderPayload,
  validateOrderStatusPayload,
  validatePaymentStatusPayload,
  validateSplitBillPayload,
};
