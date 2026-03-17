const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const SplitBill = require("../models/SplitBill");
const TableSession = require("../models/TableSession");
const DailyReceiptCounter = require("../models/DailyReceiptCounter");
const crypto = require("crypto");
const ApiError = require("../utils/ApiError");
const { ORDER_STATUSES, PAYMENT_STATUSES, TABLE_STATUSES, ORDER_SOURCES } = require("../utils/constants");
const { getIO } = require("../sockets/socket");

const roundCurrency = (value) => Number(value.toFixed(2));
const getRemainingQuantity = (item) => Math.max(0, Number(item.quantity) - Number(item.paidQuantity || 0));
const getItemOutstandingLineTotal = (item) => roundCurrency(Number(item.price) * getRemainingQuantity(item));
const getOrderOutstandingTotal = (order) =>
  roundCurrency((order.items || []).reduce((sum, item) => sum + getItemOutstandingLineTotal(item), 0));
const deriveOrderPaymentStatus = (order) => {
  const outstandingTotal = getOrderOutstandingTotal(order);

  if (outstandingTotal <= 0) {
    return PAYMENT_STATUSES.PAID;
  }

  if (outstandingTotal < Number(order.total || 0)) {
    return PAYMENT_STATUSES.PARTIALLY_PAID;
  }

  return PAYMENT_STATUSES.UNPAID;
};

const syncOrderPaymentState = async (order) => {
  order.paymentStatus = deriveOrderPaymentStatus(order);
  order.paidAt = order.paymentStatus === PAYMENT_STATUSES.PAID ? order.paidAt || new Date() : null;
  await order.save();
  return order;
};

const getRestaurantOrThrow = async () => {
  const restaurant = await Restaurant.findOne().sort({ createdAt: 1 });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant settings not found. Run the seed script first.");
  }

  return restaurant;
};

const validateTableNumberAgainstRestaurant = (tableNumber, totalTables) => {
  const parsed = Number(tableNumber);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= totalTables;
};

const buildOrderItems = (menuItems, requestedItems) =>
  requestedItems.map((requestedItem) => {
    const menuItem = menuItems.find((item) => item._id.toString() === requestedItem.menuItemId);

    if (!menuItem) {
      throw new ApiError(400, `Menu item not found for ID ${requestedItem.menuItemId}.`);
    }

    if (!menuItem.isAvailable) {
      throw new ApiError(400, `${menuItem.name} is currently unavailable.`);
    }

    const quantity = Number(requestedItem.quantity);
    const lineTotal = roundCurrency(menuItem.price * quantity);

    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      note: requestedItem.note || "",
      lineTotal,
      paidQuantity: 0,
    };
  });

const buildTableStatus = ({ unpaidTotal, activeSessionCount, servedUnpaidCount }) => {
  if (unpaidTotal > 0 && servedUnpaidCount > 0) {
    return TABLE_STATUSES.AWAITING_PAYMENT;
  }

  if (unpaidTotal > 0 || activeSessionCount > 0) {
    return TABLE_STATUSES.OCCUPIED;
  }

  return TABLE_STATUSES.EMPTY;
};

const emitTableOverviewUpdated = (payload = {}) => {
  const io = getIO();
  if (io) {
    io.emit("table_overview_updated", payload);
  }
};

const buildPaymentMetadata = ({ paymentStatus, paymentMethod, cashReceived, changeDue, amountDue }) => {
  if (paymentStatus !== PAYMENT_STATUSES.PAID) {
    return {
      paymentMethod: null,
      cashReceived: null,
      changeDue: null,
    };
  }

  const normalizedMethod = paymentMethod || "CARD";
  const normalizedCashReceived = cashReceived != null ? Number(cashReceived) : null;
  const normalizedChangeDue = changeDue != null ? Number(changeDue) : null;

  if (normalizedMethod === "CASH") {
    if (normalizedCashReceived == null || Number.isNaN(normalizedCashReceived)) {
      throw new ApiError(400, "cashReceived is required for cash payments.");
    }

    if (normalizedCashReceived < Number(amountDue || 0)) {
      throw new ApiError(400, "cashReceived must be greater than or equal to the amount due.");
    }

    return {
      paymentMethod: normalizedMethod,
      cashReceived: normalizedCashReceived,
      changeDue:
        normalizedChangeDue != null && !Number.isNaN(normalizedChangeDue)
          ? normalizedChangeDue
          : roundCurrency(normalizedCashReceived - Number(amountDue || 0)),
    };
  }

  return {
    paymentMethod: normalizedMethod,
    cashReceived: normalizedCashReceived,
    changeDue: normalizedChangeDue,
  };
};

const getReceiptDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const assignReceiptMetadata = async (document) => {
  if (document.receiptNumber && document.receiptDate) {
    return document;
  }

  const receiptDate = getReceiptDateKey();
  const counter = await DailyReceiptCounter.findOneAndUpdate(
    { businessDate: receiptDate },
    {
      $inc: { lastSequence: 1 },
      $setOnInsert: { businessDate: receiptDate },
    },
    {
      new: true,
      upsert: true,
    }
  );

  document.receiptDate = receiptDate;
  document.receiptNumber = counter.lastSequence;
  return document;
};

const closeTableSessionsIfFullyPaid = async (tableNumber, restaurantId) => {
  const orders = await Order.find({
    tableNumber: Number(tableNumber),
    restaurantId,
  });

  const hasOutstandingAmount = orders.some((order) => getOrderOutstandingTotal(order) > 0);

  if (!hasOutstandingAmount) {
    await TableSession.updateMany(
      {
        tableNumber: Number(tableNumber),
        restaurantId,
        isActive: true,
      },
      {
        isActive: false,
      }
    );
  }
};

const createOrderRecord = async ({ restaurant, tableNumber, sessionToken, items, notes, source = ORDER_SOURCES.CUSTOMER }) => {
  const menuItemIds = items.map((item) => item.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

  if (menuItems.length !== menuItemIds.length) {
    throw new ApiError(400, "One or more menu items could not be found.");
  }

  const orderItems = buildOrderItems(menuItems, items);
  const subtotal = roundCurrency(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const tax = roundCurrency(subtotal * restaurant.taxRate);
  const total = roundCurrency(subtotal + tax);

  const order = await Order.create({
    restaurantId: restaurant._id,
    tableNumber: Number(tableNumber),
    sessionToken,
    items: orderItems,
    subtotal,
    tax,
    total,
    notes: notes || "",
    status: ORDER_STATUSES.NEW,
    source,
    paymentStatus: PAYMENT_STATUSES.UNPAID,
    paidAt: null,
  });

  const io = getIO();
  if (io) {
    io.emit("new_order", order);
  }
  emitTableOverviewUpdated({ tableNumber: Number(tableNumber) });

  return order;
};

const ensureStaffTableSession = async (restaurantId, tableNumber) => {
  const activeSession = await TableSession.findOne({
    restaurantId,
    tableNumber: Number(tableNumber),
    isActive: true,
  }).sort({ startedAt: -1 });

  if (activeSession) {
    return activeSession;
  }

  return TableSession.create({
    restaurantId,
    tableNumber: Number(tableNumber),
    sessionToken: `staff-${tableNumber}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    isActive: true,
  });
};

const createOrder = async ({ restaurantId, tableNumber, sessionToken, items, notes }) => {
  const restaurant = await getRestaurantOrThrow();

  if (restaurantId !== restaurant._id.toString()) {
    throw new ApiError(400, "Invalid restaurant ID.");
  }

  if (!validateTableNumberAgainstRestaurant(tableNumber, restaurant.totalTables)) {
    throw new ApiError(
      400,
      `It looks like there is a mistake. This restaurant only has tables up to ${restaurant.totalTables}.`
    );
  }

  const session = await TableSession.findOne({
    sessionToken,
    tableNumber: Number(tableNumber),
    restaurantId: restaurant._id,
    isActive: true,
  });

  if (!session) {
    throw new ApiError(400, "Table session is invalid or has expired.");
  }

  return createOrderRecord({
    restaurant,
    tableNumber,
    sessionToken,
    items,
    notes,
    source: ORDER_SOURCES.CUSTOMER,
  });
};

const createStaffOrder = async ({ tableNumber, items, notes }) => {
  const restaurant = await getRestaurantOrThrow();

  if (!validateTableNumberAgainstRestaurant(tableNumber, restaurant.totalTables)) {
    throw new ApiError(
      400,
      `It looks like there is a mistake. This restaurant only has tables up to ${restaurant.totalTables}.`
    );
  }

  const session = await ensureStaffTableSession(restaurant._id, tableNumber);

  return createOrderRecord({
    restaurant,
    tableNumber,
    sessionToken: session.sessionToken,
    items,
    notes,
    source: ORDER_SOURCES.WAITER,
  });
};

const getOrders = async (query) => {
  const filters = {
    archivedAt: null,
  };

  if (query.status) {
    filters.status = query.status;
  }

  if (query.tableNumber) {
    filters.tableNumber = Number(query.tableNumber);
  }

  if (query.paymentStatus) {
    filters.paymentStatus = query.paymentStatus;
  }

  return Order.find(filters).sort({ createdAt: -1 });
};

const getOrderById = async (id) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  return order;
};

const updateOrderStatus = async (id, status) => {
  if (!Object.values(ORDER_STATUSES).includes(status)) {
    throw new ApiError(400, "Invalid order status.");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  order.status = status;
  await order.save();

  const io = getIO();
  if (io) {
    io.emit("order_updated", order);
  }
  emitTableOverviewUpdated({ tableNumber: order.tableNumber });

  return order;
};

const getOrdersByTable = async (tableNumber) =>
  Order.find({ tableNumber: Number(tableNumber), archivedAt: null }).sort({ createdAt: -1 });

const updateOrderPaymentStatus = async (id, paymentStatus, paymentPayload = {}) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  const paymentMetadata = buildPaymentMetadata({
    paymentStatus,
    paymentMethod: paymentPayload.paymentMethod,
    cashReceived: paymentPayload.cashReceived,
    changeDue: paymentPayload.changeDue,
    amountDue: order.total,
  });

  order.paymentStatus = paymentStatus;
  order.items.forEach((item) => {
    item.paidQuantity = paymentStatus === PAYMENT_STATUSES.PAID ? item.quantity : 0;
  });
  order.paymentMethod = paymentMetadata.paymentMethod;
  order.cashReceived = paymentMetadata.cashReceived;
  order.changeDue = paymentMetadata.changeDue;
  order.paidAt = paymentStatus === PAYMENT_STATUSES.PAID ? new Date() : null;
  if (paymentStatus === PAYMENT_STATUSES.PAID) {
    await assignReceiptMetadata(order);
  } else {
    order.receiptDate = null;
    order.receiptNumber = null;
  }
  await order.save();
  await SplitBill.updateMany(
    {
      tableNumber: order.tableNumber,
      restaurantId: order.restaurantId,
      status: "OPEN",
      "items.orderId": order._id,
    },
    {
      status: paymentStatus === PAYMENT_STATUSES.PAID ? "PAID" : "VOID",
      paidAt: paymentStatus === PAYMENT_STATUSES.PAID ? new Date() : null,
    }
  );
  await closeTableSessionsIfFullyPaid(order.tableNumber, order.restaurantId);

  const io = getIO();
  if (io) {
    io.emit("order_payment_updated", order);
  }
  emitTableOverviewUpdated({ tableNumber: order.tableNumber });

  return order;
};

const updateTablePaymentStatus = async (tableNumber, paymentStatus, paymentPayload = {}) => {
  const restaurant = await getRestaurantOrThrow();
  const filters = {
    restaurantId: restaurant._id,
    tableNumber: Number(tableNumber),
  };
  const orders = await Order.find(filters);

  if (!orders.length) {
    throw new ApiError(404, "No orders found for this table.");
  }

  const totalOutstanding = roundCurrency(orders.reduce((sum, order) => sum + getOrderOutstandingTotal(order), 0));
  const paymentMetadata = buildPaymentMetadata({
    paymentStatus,
    paymentMethod: paymentPayload.paymentMethod,
    cashReceived: paymentPayload.cashReceived,
    changeDue: paymentPayload.changeDue,
    amountDue: totalOutstanding,
  });
  const representativeOrderId =
    orders
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0]?._id?.toString() || null;
  const representativeOrder = orders.find((order) => order._id.toString() === representativeOrderId);

  if (paymentStatus === PAYMENT_STATUSES.PAID && representativeOrder) {
    await assignReceiptMetadata(representativeOrder);
  }

  orders.forEach((order) => {
    order.items.forEach((item) => {
      item.paidQuantity = paymentStatus === PAYMENT_STATUSES.PAID ? item.quantity : 0;
    });
    order.paymentStatus = paymentStatus;
    order.paymentMethod = paymentStatus === PAYMENT_STATUSES.PAID ? paymentMetadata.paymentMethod : null;
    order.cashReceived =
      paymentStatus === PAYMENT_STATUSES.PAID && order._id.toString() === representativeOrderId
        ? paymentMetadata.cashReceived
        : null;
    order.changeDue =
      paymentStatus === PAYMENT_STATUSES.PAID && order._id.toString() === representativeOrderId
        ? paymentMetadata.changeDue
        : null;
    order.paidAt = paymentStatus === PAYMENT_STATUSES.PAID ? new Date() : null;
    order.receiptDate =
      paymentStatus === PAYMENT_STATUSES.PAID && order._id.toString() === representativeOrderId
        ? order.receiptDate
        : null;
    order.receiptNumber =
      paymentStatus === PAYMENT_STATUSES.PAID && order._id.toString() === representativeOrderId
        ? order.receiptNumber
        : null;
  });
  await Promise.all(orders.map((order) => order.save()));

  await SplitBill.updateMany(
    {
      restaurantId: restaurant._id,
      tableNumber: Number(tableNumber),
      status: "OPEN",
    },
    {
      status: paymentStatus === PAYMENT_STATUSES.PAID ? "PAID" : "VOID",
      paidAt: paymentStatus === PAYMENT_STATUSES.PAID ? new Date() : null,
    }
  );

  if (paymentStatus === PAYMENT_STATUSES.PAID) {
    await TableSession.updateMany(
      {
        restaurantId: restaurant._id,
        tableNumber: Number(tableNumber),
        isActive: true,
      },
      { isActive: false }
    );
  }

  const updatedOrders = await Order.find(filters).sort({ createdAt: -1 });

  const io = getIO();
  if (io) {
    io.emit("table_payment_updated", {
      tableNumber: Number(tableNumber),
      paymentStatus,
      paymentMethod: paymentMetadata.paymentMethod,
      cashReceived: paymentMetadata.cashReceived,
      changeDue: paymentMetadata.changeDue,
    });
  }
  emitTableOverviewUpdated({ tableNumber: Number(tableNumber) });

  return {
    tableNumber: Number(tableNumber),
      paymentStatus,
      paymentMethod: paymentMetadata.paymentMethod,
      cashReceived: paymentMetadata.cashReceived,
      changeDue: paymentMetadata.changeDue,
      ordersUpdated: orders.length,
      orders: updatedOrders,
    };
};

const getTableOverview = async () => {
  const restaurant = await getRestaurantOrThrow();
  const [orders, sessions] = await Promise.all([
    Order.find({ restaurantId: restaurant._id, archivedAt: null }).sort({ createdAt: -1 }).lean(),
    TableSession.find({ restaurantId: restaurant._id, isActive: true }).lean(),
  ]);

  const sessionsByTable = sessions.reduce((accumulator, session) => {
    const key = session.tableNumber;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const ordersByTable = orders.reduce((accumulator, order) => {
    const key = order.tableNumber;
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(order);
    return accumulator;
  }, {});

  const tables = Array.from({ length: restaurant.totalTables }, (_, index) => {
    const tableNumber = index + 1;
    const tableOrders = ordersByTable[tableNumber] || [];
    const unpaidOrders = tableOrders.filter((order) => getOrderOutstandingTotal(order) > 0);
    const servedUnpaidOrders = unpaidOrders.filter((order) => order.status === ORDER_STATUSES.SERVED);
    const unpaidTotal = roundCurrency(unpaidOrders.reduce((sum, order) => sum + getOrderOutstandingTotal(order), 0));
    const fullBillTotal = roundCurrency(tableOrders.reduce((sum, order) => sum + Number(order.total || 0), 0));
    const activeSessionCount = sessionsByTable[tableNumber] || 0;
    const latestOrder = tableOrders[0] || null;
    const latestPaidAt = tableOrders
      .filter((order) => order.paidAt)
      .sort((left, right) => new Date(right.paidAt) - new Date(left.paidAt))[0]?.paidAt || null;

    return {
      tableNumber,
      activeSessionCount,
      totalOrders: tableOrders.length,
      unpaidOrdersCount: unpaidOrders.length,
      unpaidTotal,
      paidOrdersCount: tableOrders.filter((order) => getOrderOutstandingTotal(order) <= 0).length,
      latestOrderAt: latestOrder?.createdAt || null,
      latestPaidAt,
      currentOrderStatuses: [...new Set(unpaidOrders.map((order) => order.status))],
      paymentStatus: unpaidOrders.length
        ? unpaidTotal < fullBillTotal
          ? PAYMENT_STATUSES.PARTIALLY_PAID
          : PAYMENT_STATUSES.UNPAID
        : tableOrders.length
          ? PAYMENT_STATUSES.PAID
          : "NO_BILL",
      tableStatus: buildTableStatus({
        unpaidTotal,
        activeSessionCount,
        servedUnpaidCount: servedUnpaidOrders.length,
      }),
      recentOrders: tableOrders.slice(0, 3).map((order) => ({
        _id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: getOrderOutstandingTotal(order),
        createdAt: order.createdAt,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    };
  });

  return {
    restaurant: {
      _id: restaurant._id,
      name: restaurant.name,
      totalTables: restaurant.totalTables,
      currency: restaurant.currency,
    },
    summary: {
      occupiedTables: tables.filter((table) => table.tableStatus !== TABLE_STATUSES.EMPTY).length,
      awaitingPaymentTables: tables.filter((table) => table.tableStatus === TABLE_STATUSES.AWAITING_PAYMENT).length,
      openBills: tables.filter((table) => [PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PARTIALLY_PAID].includes(table.paymentStatus)).length,
    },
    tables,
  };
};

const moveTableOrders = async (sourceTableNumber, targetTableNumber) => {
  const restaurant = await getRestaurantOrThrow();
  const sourceTable = Number(sourceTableNumber);
  const targetTable = Number(targetTableNumber);

  if (!validateTableNumberAgainstRestaurant(targetTable, restaurant.totalTables)) {
    throw new ApiError(
      400,
      `Target table is invalid. This restaurant only has tables up to ${restaurant.totalTables}.`
    );
  }

  if (sourceTable === targetTable) {
    throw new ApiError(400, "Source table and target table must be different.");
  }

  const [sourceUnpaidOrders, targetUnpaidOrders, targetActiveSessions] = await Promise.all([
    Order.find({
      restaurantId: restaurant._id,
      tableNumber: sourceTable,
      archivedAt: null,
      paymentStatus: { $in: [PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PARTIALLY_PAID] },
    }),
    Order.countDocuments({
      restaurantId: restaurant._id,
      tableNumber: targetTable,
      archivedAt: null,
      paymentStatus: { $in: [PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PARTIALLY_PAID] },
    }),
    TableSession.countDocuments({
      restaurantId: restaurant._id,
      tableNumber: targetTable,
      isActive: true,
    }),
  ]);

  if (!sourceUnpaidOrders.length) {
    throw new ApiError(404, "There is no open bill to move from this table.");
  }

  if (targetUnpaidOrders > 0 || targetActiveSessions > 0) {
    throw new ApiError(400, "Target table is not empty. Move the bill only to an empty table.");
  }

  await Promise.all([
    Order.updateMany(
      {
        restaurantId: restaurant._id,
        tableNumber: sourceTable,
        archivedAt: null,
        paymentStatus: { $in: [PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PARTIALLY_PAID] },
      },
      {
        tableNumber: targetTable,
      }
    ),
    SplitBill.updateMany(
      {
        restaurantId: restaurant._id,
        tableNumber: sourceTable,
        archivedAt: null,
        status: "OPEN",
      },
      {
        tableNumber: targetTable,
      }
    ),
    TableSession.updateMany(
      {
        restaurantId: restaurant._id,
        tableNumber: sourceTable,
        isActive: true,
      },
      {
        tableNumber: targetTable,
      }
    ),
  ]);

  const movedOrders = await Order.find({
    restaurantId: restaurant._id,
    tableNumber: targetTable,
    archivedAt: null,
    paymentStatus: { $in: [PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PARTIALLY_PAID] },
  }).sort({ createdAt: -1 });

  const io = getIO();
  if (io) {
    io.emit("table_moved", {
      sourceTableNumber: sourceTable,
      targetTableNumber: targetTable,
    });
  }
  emitTableOverviewUpdated({ tableNumber: sourceTable });
  emitTableOverviewUpdated({ tableNumber: targetTable });

  return {
    sourceTableNumber: sourceTable,
    targetTableNumber: targetTable,
    ordersMoved: movedOrders.length,
    orders: movedOrders,
  };
};

const getSplitBillsByTable = async (tableNumber) => {
  const restaurant = await getRestaurantOrThrow();

  return SplitBill.find({
    restaurantId: restaurant._id,
    tableNumber: Number(tableNumber),
    archivedAt: null,
  }).sort({ createdAt: -1 });
};

const createSplitBill = async (tableNumber, requestedItems) => {
  const restaurant = await getRestaurantOrThrow();
  const orders = await Order.find({
    restaurantId: restaurant._id,
    tableNumber: Number(tableNumber),
    archivedAt: null,
  });

  if (!orders.length) {
    throw new ApiError(404, "No orders found for this table.");
  }

  const splitItems = requestedItems.map((requestedItem) => {
    const order = orders.find((item) => item._id.toString() === requestedItem.orderId);

    if (!order) {
      throw new ApiError(400, `Order ${requestedItem.orderId} is not available on this table.`);
    }

    const item = order.items[Number(requestedItem.itemIndex)];

    if (!item) {
      throw new ApiError(400, `Item index ${requestedItem.itemIndex} is invalid for order ${requestedItem.orderId}.`);
    }

    const remainingQuantity = getRemainingQuantity(item);
    const quantity = Number(requestedItem.quantity);

    if (quantity > remainingQuantity) {
      throw new ApiError(400, `Only ${remainingQuantity} quantity remains for ${item.name}.`);
    }

    return {
      orderId: order._id,
      itemIndex: Number(requestedItem.itemIndex),
      name: item.name,
      quantity,
      unitPrice: item.price,
      lineTotal: roundCurrency(Number(item.price) * quantity),
      note: item.note || "",
    };
  });

  const subtotal = roundCurrency(splitItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const splitBill = await SplitBill.create({
    restaurantId: restaurant._id,
    tableNumber: Number(tableNumber),
    status: "OPEN",
    items: splitItems,
    subtotal,
    total: subtotal,
  });

  const io = getIO();
  if (io) {
    io.emit("split_bill_updated", splitBill);
  }

  return splitBill;
};

const updateSplitBillStatus = async (id, status, paymentPayload = {}) => {
  if (!["PAID", "VOID"].includes(status)) {
    throw new ApiError(400, "Split bill status must be PAID or VOID.");
  }

  const splitBill = await SplitBill.findById(id);

  if (!splitBill) {
    throw new ApiError(404, "Split bill not found.");
  }

  if (splitBill.status !== "OPEN") {
    throw new ApiError(400, "Only open split bills can be updated.");
  }

  const paymentMetadata = buildPaymentMetadata({
    paymentStatus: status === "PAID" ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.UNPAID,
    paymentMethod: paymentPayload.paymentMethod,
    cashReceived: paymentPayload.cashReceived,
    changeDue: paymentPayload.changeDue,
    amountDue: splitBill.total,
  });

  if (status === "PAID") {
    for (const splitItem of splitBill.items) {
      const order = await Order.findById(splitItem.orderId);

      if (!order) {
        throw new ApiError(404, `Order ${splitItem.orderId} could not be found for this split bill.`);
      }

      const item = order.items[splitItem.itemIndex];

      if (!item) {
        throw new ApiError(400, `Split bill item index ${splitItem.itemIndex} is invalid.`);
      }

      const remainingQuantity = getRemainingQuantity(item);

      if (splitItem.quantity > remainingQuantity) {
        throw new ApiError(400, `Only ${remainingQuantity} quantity remains for ${item.name}.`);
      }

      item.paidQuantity = Number(item.paidQuantity || 0) + splitItem.quantity;
      await syncOrderPaymentState(order);
    }
  }

  splitBill.status = status;
  splitBill.paymentMethod = paymentMetadata.paymentMethod;
  splitBill.cashReceived = paymentMetadata.cashReceived;
  splitBill.changeDue = paymentMetadata.changeDue;
  splitBill.paidAt = status === "PAID" ? new Date() : null;
  if (status === "PAID") {
    await assignReceiptMetadata(splitBill);
  } else {
    splitBill.receiptDate = null;
    splitBill.receiptNumber = null;
  }
  await splitBill.save();
  await closeTableSessionsIfFullyPaid(splitBill.tableNumber, splitBill.restaurantId);

  const io = getIO();
  if (io) {
    io.emit("split_bill_updated", splitBill);
  }
  emitTableOverviewUpdated({ tableNumber: splitBill.tableNumber });

  return splitBill;
};

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
