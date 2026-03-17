const Order = require("../models/Order");
const SplitBill = require("../models/SplitBill");
const DailyCheckout = require("../models/DailyCheckout");
const HistoryEntry = require("../models/HistoryEntry");
const { PAYMENT_STATUSES, ORDER_STATUSES } = require("../utils/constants");
const ApiError = require("../utils/ApiError");

const HISTORY_GRANULARITIES = {
  DAY: "day",
  MONTH: "month",
  YEAR: "year",
};

const getBusinessDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthKey = (date) => getBusinessDateKey(date).slice(0, 7);
const getYearKey = (date) => String(date.getFullYear());

const getDayRange = (businessDate) => {
  const baseDate = businessDate ? new Date(`${businessDate}T00:00:00`) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    throw new ApiError(400, "businessDate must be a valid date in YYYY-MM-DD format.");
  }

  const periodStart = new Date(baseDate);
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(baseDate);
  periodEnd.setHours(23, 59, 59, 999);

  return {
    businessDate: getBusinessDateKey(periodStart),
    periodStart,
    periodEnd,
  };
};

const getPeriodDateRange = (granularity, period) => {
  if (granularity === HISTORY_GRANULARITIES.DAY) {
    return getDayRange(period);
  }

  if (granularity === HISTORY_GRANULARITIES.MONTH) {
    const baseDate = new Date(`${period}-01T00:00:00`);

    if (Number.isNaN(baseDate.getTime())) {
      throw new ApiError(400, "period is invalid for month granularity.");
    }

    const periodStart = new Date(baseDate);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      businessDate: getBusinessDateKey(periodStart),
      periodStart,
      periodEnd,
    };
  }

  const baseDate = new Date(`${period}-01-01T00:00:00`);

  if (Number.isNaN(baseDate.getTime())) {
    throw new ApiError(400, "period is invalid for year granularity.");
  }

  const periodStart = new Date(baseDate);
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999);

  return {
    businessDate: getBusinessDateKey(periodStart),
    periodStart,
    periodEnd,
  };
};

const validatePeriodFormat = (granularity, period) => {
  if (!period) {
    return;
  }

  const patterns = {
    [HISTORY_GRANULARITIES.DAY]: /^\d{4}-\d{2}-\d{2}$/,
    [HISTORY_GRANULARITIES.MONTH]: /^\d{4}-\d{2}$/,
    [HISTORY_GRANULARITIES.YEAR]: /^\d{4}$/,
  };

  if (!patterns[granularity]?.test(period)) {
    throw new ApiError(400, `period is invalid for granularity ${granularity}.`);
  }
};

const normalizeHistoryQuery = (query = {}) => {
  const granularity = String(query.granularity || HISTORY_GRANULARITIES.DAY).toLowerCase();

  if (!Object.values(HISTORY_GRANULARITIES).includes(granularity)) {
    throw new ApiError(400, "granularity must be day, month, or year.");
  }

  const now = new Date();
  const fallbackPeriod =
    granularity === HISTORY_GRANULARITIES.YEAR
      ? getYearKey(now)
      : granularity === HISTORY_GRANULARITIES.MONTH
        ? getMonthKey(now)
        : getBusinessDateKey(now);
  const period = String(query.period || fallbackPeriod).trim();

  validatePeriodFormat(granularity, period);

  return {
    granularity,
    period,
    page: Math.max(Number(query.page) || 1, 1),
    limit: Math.min(Math.max(Number(query.limit) || 20, 1), 100),
    paymentMethod: query.paymentMethod ? String(query.paymentMethod).trim().toUpperCase() : "",
    tableNumber: query.tableNumber ? Number(query.tableNumber) : null,
    receiptNumber: query.receiptNumber ? Number(query.receiptNumber) : null,
    itemKeyword: query.itemKeyword ? String(query.itemKeyword).trim() : "",
    amountMin: query.amountMin != null && query.amountMin !== "" ? Number(query.amountMin) : null,
    amountMax: query.amountMax != null && query.amountMax !== "" ? Number(query.amountMax) : null,
  };
};

const buildHistoryField = (granularity) =>
  granularity === HISTORY_GRANULARITIES.YEAR
    ? "$businessYear"
    : granularity === HISTORY_GRANULARITIES.MONTH
      ? "$businessMonth"
      : "$businessDate";

const getHoursSince = (value) => {
  if (!value) {
    return 0;
  }

  const diffMs = Date.now() - new Date(value).getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
};

const getBillingControlSummary = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [openOrders, paidTodayByMethod] = await Promise.all([
    Order.find({
      archivedAt: null,
      paymentStatus: {
        $in: [PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PARTIALLY_PAID],
      },
    })
      .sort({ createdAt: -1 })
      .lean(),
    Order.aggregate([
      {
        $match: {
          paidAt: { $gte: startOfToday },
          paymentStatus: PAYMENT_STATUSES.PAID,
          archivedAt: null,
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const tablesMap = openOrders.reduce((accumulator, order) => {
    const key = String(order.tableNumber);
    const outstandingAmount = Number(order.total || 0) - (order.paymentStatus === PAYMENT_STATUSES.PAID ? Number(order.total || 0) : 0);
    const effectiveOutstanding =
      order.paymentStatus === PAYMENT_STATUSES.PARTIALLY_PAID
        ? (order.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Math.max(0, Number(item.quantity || 0) - Number(item.paidQuantity || 0)), 0)
        : Number(order.total || 0);

    if (!accumulator[key]) {
      accumulator[key] = {
        tableNumber: order.tableNumber,
        unpaidTotal: 0,
        unpaidOrdersCount: 0,
        latestOrderAt: order.createdAt,
        statuses: new Set(),
      };
    }

    accumulator[key].unpaidTotal += effectiveOutstanding;
    accumulator[key].unpaidOrdersCount += 1;
    accumulator[key].statuses.add(order.status);
    if (new Date(order.createdAt) > new Date(accumulator[key].latestOrderAt)) {
      accumulator[key].latestOrderAt = order.createdAt;
    }
    return accumulator;
  }, {});

  const allPendingTables = Object.values(tablesMap).map((table) => ({
    ...table,
    statuses: Array.from(table.statuses),
    oldestOpenOrderHours: Number(getHoursSince(table.latestOrderAt).toFixed(1)),
    urgencyScore: Number((Number(table.unpaidTotal || 0) + getHoursSince(table.latestOrderAt) * 12).toFixed(2)),
  }));

  const pendingTables = allPendingTables
    .map((table) => ({
      ...table,
      statuses: table.statuses,
    }))
    .sort((left, right) => right.urgencyScore - left.urgencyScore)
    .slice(0, 8);

  return {
    openBillsCount: openOrders.length,
    openTablesCount: allPendingTables.length,
    outstandingAmount: allPendingTables.reduce((sum, table) => sum + Number(table.unpaidTotal || 0), 0),
    unpaidOrdersCount: openOrders.length,
    paidTodayCash: paidTodayByMethod.find((item) => item._id === "CASH")?.total || 0,
    paidTodayCard: paidTodayByMethod.find((item) => item._id === "CARD")?.total || 0,
    paidTodayOtherCount: paidTodayByMethod.reduce((sum, item) => sum + Number(item.count || 0), 0),
    pendingTables,
  };
};

const buildDailyCheckoutSummary = async ({ periodStart, periodEnd, businessDate }) => {
  const [paidOrders, paidSplitBills, unpaidOrdersCount, servedOrdersCount, settledTablesData, existingCheckout] =
    await Promise.all([
      Order.find({
        paidAt: {
          $gte: periodStart,
          $lte: periodEnd,
        },
        paymentStatus: PAYMENT_STATUSES.PAID,
      }).lean(),
      SplitBill.find({
        paidAt: {
          $gte: periodStart,
          $lte: periodEnd,
        },
        status: "PAID",
      }).lean(),
      Order.countDocuments({
        createdAt: {
          $gte: periodStart,
          $lte: periodEnd,
        },
        archivedAt: null,
        paymentStatus: {
          $ne: PAYMENT_STATUSES.PAID,
        },
      }),
      Order.countDocuments({
        createdAt: {
          $gte: periodStart,
          $lte: periodEnd,
        },
        archivedAt: null,
        status: ORDER_STATUSES.SERVED,
      }),
      Order.aggregate([
        {
          $match: {
            paidAt: {
              $gte: periodStart,
              $lte: periodEnd,
            },
            paymentStatus: PAYMENT_STATUSES.PAID,
          },
        },
        {
          $group: {
            _id: "$tableNumber",
          },
        },
        {
          $count: "count",
        },
      ]),
      DailyCheckout.findOne({ businessDate }).populate("closedBy", "name email"),
    ]);

  const billsIssuedCount =
    paidOrders.filter((order) => order.receiptNumber != null).length +
    paidSplitBills.filter((splitBill) => splitBill.receiptNumber != null).length;

  return {
    businessDate,
    periodStart,
    periodEnd,
    paidRevenue: paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    cashReceivedTotal: paidOrders.reduce((sum, order) => sum + Number(order.cashReceived || 0), 0),
    changeGivenTotal: paidOrders.reduce((sum, order) => sum + Number(order.changeDue || 0), 0),
    paidOrdersCount: paidOrders.length,
    unpaidOrdersCount,
    servedOrdersCount,
    settledTablesCount: settledTablesData[0]?.count || 0,
    splitBillsPaidCount: paidSplitBills.length,
    billsIssuedCount,
    alreadyClosed: Boolean(existingCheckout),
    closedCheckout: existingCheckout,
  };
};

const getAnalytics = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalOrders, ordersToday, revenueData, ordersByStatus, mostOrderedItems, billingControl] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          archivedAt: null,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
    Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItemId",
          name: { $first: "$items.name" },
          orderedQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { orderedQuantity: -1 } },
      { $limit: 5 },
    ]),
    getBillingControlSummary(),
  ]);

  const todayRange = getDayRange();
  const dailyCheckoutPreview = await buildDailyCheckoutSummary(todayRange);
  const recentDailyCheckouts = await DailyCheckout.find()
    .populate("closedBy", "name email")
    .sort({ businessDate: -1 })
    .limit(7)
    .lean();

  return {
    totalOrders,
    ordersToday,
    revenueEstimate: revenueData[0]?.totalRevenue || 0,
    mostOrderedItems,
    ordersByStatus,
    dailyCheckoutPreview,
    recentDailyCheckouts,
    billingControl,
  };
};

const buildHistoryEntriesFromOrders = (orders, checkout) =>
  orders.map((order) => ({
    sourceType: "ORDER",
    sourceId: order._id,
    dailyCheckoutId: checkout._id,
    businessDate: checkout.businessDate,
    businessMonth: checkout.businessDate.slice(0, 7),
    businessYear: checkout.businessDate.slice(0, 4),
    tableNumber: order.tableNumber,
    total: order.total,
    paymentMethod: order.paymentMethod || null,
    paidAt: order.paidAt,
    receiptNumber: order.receiptNumber || null,
    receiptDate: order.receiptDate || null,
    itemCount: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    items: (order.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      note: item.note || "",
    })),
    notes: order.notes || "",
    status: order.status || "",
  }));

const buildHistoryEntriesFromSplitBills = (splitBills, checkout) =>
  splitBills.map((splitBill) => ({
    sourceType: "SPLIT_BILL",
    sourceId: splitBill._id,
    dailyCheckoutId: checkout._id,
    businessDate: checkout.businessDate,
    businessMonth: checkout.businessDate.slice(0, 7),
    businessYear: checkout.businessDate.slice(0, 4),
    tableNumber: splitBill.tableNumber,
    total: splitBill.total,
    paymentMethod: splitBill.paymentMethod || null,
    paidAt: splitBill.paidAt,
    receiptNumber: splitBill.receiptNumber || null,
    receiptDate: splitBill.receiptDate || null,
    itemCount: (splitBill.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    items: (splitBill.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      note: item.note || "",
    })),
    notes: "",
    status: splitBill.status || "",
  }));

const mapLiveOrderToHistoryEntry = (order) => ({
  _id: order._id,
  sourceType: "ORDER",
  sourceBucket: "LIVE",
  sourceId: order._id,
  dailyCheckoutId: order.dailyCheckoutId || null,
  businessDate: order.receiptDate || getBusinessDateKey(new Date(order.paidAt)),
  businessMonth: getMonthKey(new Date(order.paidAt)),
  businessYear: getYearKey(new Date(order.paidAt)),
  tableNumber: order.tableNumber,
  total: order.total,
  paymentMethod: order.paymentMethod || null,
  paidAt: order.paidAt,
  receiptNumber: order.receiptNumber || null,
  receiptDate: order.receiptDate || null,
  itemCount: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  items: (order.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    note: item.note || "",
  })),
  notes: order.notes || "",
  status: order.status || "",
});

const mapLiveSplitBillToHistoryEntry = (splitBill) => ({
  _id: splitBill._id,
  sourceType: "SPLIT_BILL",
  sourceBucket: "LIVE",
  sourceId: splitBill._id,
  dailyCheckoutId: splitBill.dailyCheckoutId || null,
  businessDate: splitBill.receiptDate || getBusinessDateKey(new Date(splitBill.paidAt)),
  businessMonth: getMonthKey(new Date(splitBill.paidAt)),
  businessYear: getYearKey(new Date(splitBill.paidAt)),
  tableNumber: splitBill.tableNumber,
  total: splitBill.total,
  paymentMethod: splitBill.paymentMethod || null,
  paidAt: splitBill.paidAt,
  receiptNumber: splitBill.receiptNumber || null,
  receiptDate: splitBill.receiptDate || null,
  itemCount: (splitBill.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  items: (splitBill.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    note: item.note || "",
  })),
  notes: "",
  status: splitBill.status || "",
});

const closeBusinessDay = async ({ businessDate, notes, closedBy }) => {
  const dayRange = getDayRange(businessDate);
  const summary = await buildDailyCheckoutSummary(dayRange);

  if (summary.alreadyClosed) {
    throw new ApiError(400, `Business day ${summary.businessDate} has already been closed.`);
  }

  const [paidOrdersToArchive, paidSplitBillsToArchive] = await Promise.all([
    Order.find({
      paidAt: { $gte: summary.periodStart, $lte: summary.periodEnd },
      paymentStatus: PAYMENT_STATUSES.PAID,
      archivedAt: null,
    }),
    SplitBill.find({
      paidAt: { $gte: summary.periodStart, $lte: summary.periodEnd },
      status: "PAID",
      archivedAt: null,
    }),
  ]);

  const checkout = await DailyCheckout.create({
    businessDate: summary.businessDate,
    periodStart: summary.periodStart,
    periodEnd: summary.periodEnd,
    paidRevenue: summary.paidRevenue,
    cashReceivedTotal: summary.cashReceivedTotal,
    changeGivenTotal: summary.changeGivenTotal,
    billsIssuedCount: summary.billsIssuedCount,
    paidOrdersCount: summary.paidOrdersCount,
    unpaidOrdersCount: summary.unpaidOrdersCount,
    servedOrdersCount: summary.servedOrdersCount,
    settledTablesCount: summary.settledTablesCount,
    splitBillsPaidCount: summary.splitBillsPaidCount,
    notes: notes || "",
    closedBy,
    closedAt: new Date(),
  });

  const historyEntries = [
    ...buildHistoryEntriesFromOrders(paidOrdersToArchive, checkout),
    ...buildHistoryEntriesFromSplitBills(paidSplitBillsToArchive, checkout),
  ];

  if (historyEntries.length) {
    await HistoryEntry.insertMany(historyEntries);
  }

  const archivedAt = new Date();
  await Promise.all([
    Order.updateMany(
      { _id: { $in: paidOrdersToArchive.map((order) => order._id) } },
      { archivedAt, dailyCheckoutId: checkout._id }
    ),
    SplitBill.updateMany(
      { _id: { $in: paidSplitBillsToArchive.map((splitBill) => splitBill._id) } },
      { archivedAt, dailyCheckoutId: checkout._id }
    ),
  ]);

  return checkout;
};

const getDailyCheckouts = async () =>
  DailyCheckout.find()
    .populate("closedBy", "name email")
    .sort({ businessDate: -1 })
    .limit(30)
    .lean();

const getHistoryOverview = async (granularity) => {
  const groupField = buildHistoryField(granularity);
  const [buckets, totals] = await Promise.all([
    HistoryEntry.aggregate([
      {
        $group: {
          _id: groupField,
          entriesCount: { $sum: 1 },
          revenue: { $sum: "$total" },
          latestPaidAt: { $max: "$paidAt" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 24 },
    ]),
    HistoryEntry.aggregate([
      {
        $group: {
          _id: null,
          entriesCount: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]),
  ]);

  return {
    buckets: buckets.map((bucket) => ({
      period: bucket._id,
      entriesCount: bucket.entriesCount,
      revenue: bucket.revenue,
      latestPaidAt: bucket.latestPaidAt,
    })),
    totals: {
      entriesCount: totals[0]?.entriesCount || 0,
      revenue: totals[0]?.revenue || 0,
    },
  };
};

const getHistoryEntries = async (query = {}) => {
  const { granularity, period, page, limit, paymentMethod, tableNumber, receiptNumber, itemKeyword, amountMin, amountMax } =
    normalizeHistoryQuery(query);
  const skip = (page - 1) * limit;
  const { periodStart, periodEnd } = getPeriodDateRange(granularity, period);
  const periodField =
    granularity === HISTORY_GRANULARITIES.YEAR
      ? "businessYear"
      : granularity === HISTORY_GRANULARITIES.MONTH
        ? "businessMonth"
        : "businessDate";

  const filters = {
    [periodField]: period,
  };

  if (paymentMethod) {
    filters.paymentMethod = paymentMethod;
  }

  if (tableNumber) {
    filters.tableNumber = tableNumber;
  }

  if (receiptNumber) {
    filters.receiptNumber = receiptNumber;
  }

  if (itemKeyword) {
    filters["items.name"] = {
      $regex: itemKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  if (amountMin != null || amountMax != null) {
    filters.total = {};
    if (amountMin != null && !Number.isNaN(amountMin)) {
      filters.total.$gte = amountMin;
    }
    if (amountMax != null && !Number.isNaN(amountMax)) {
      filters.total.$lte = amountMax;
    }
  }

  const liveBaseFilters = {
    paidAt: {
      $gte: periodStart,
      $lte: periodEnd,
    },
    archivedAt: null,
  };

  const liveOrderFilters = {
    ...liveBaseFilters,
    paymentStatus: PAYMENT_STATUSES.PAID,
  };

  const liveSplitBillFilters = {
    ...liveBaseFilters,
    status: "PAID",
  };

  if (paymentMethod) {
    liveOrderFilters.paymentMethod = paymentMethod;
    liveSplitBillFilters.paymentMethod = paymentMethod;
  }

  if (tableNumber) {
    liveOrderFilters.tableNumber = tableNumber;
    liveSplitBillFilters.tableNumber = tableNumber;
  }

  if (receiptNumber) {
    liveOrderFilters.receiptNumber = receiptNumber;
    liveSplitBillFilters.receiptNumber = receiptNumber;
  }

  if (itemKeyword) {
    const regex = {
      $regex: itemKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    liveOrderFilters["items.name"] = regex;
    liveSplitBillFilters["items.name"] = regex;
  }

  if (amountMin != null || amountMax != null) {
    liveOrderFilters.total = {};
    liveSplitBillFilters.total = {};
    if (amountMin != null && !Number.isNaN(amountMin)) {
      liveOrderFilters.total.$gte = amountMin;
      liveSplitBillFilters.total.$gte = amountMin;
    }
    if (amountMax != null && !Number.isNaN(amountMax)) {
      liveOrderFilters.total.$lte = amountMax;
      liveSplitBillFilters.total.$lte = amountMax;
    }
  }

  const [archivedEntries, archivedTotalEntries, groupedOverview, archivedPeriodSummary, liveOrders, liveSplitBills] = await Promise.all([
    HistoryEntry.find(filters)
      .populate("dailyCheckoutId", "businessDate closedAt")
      .sort({ paidAt: -1, createdAt: -1 })
      .lean(),
    HistoryEntry.countDocuments(filters),
    getHistoryOverview(granularity),
    HistoryEntry.aggregate([
      {
        $match: filters,
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          entriesCount: { $sum: 1 },
          orderCount: {
            $sum: {
              $cond: [{ $eq: ["$sourceType", "ORDER"] }, 1, 0],
            },
          },
          splitBillCount: {
            $sum: {
              $cond: [{ $eq: ["$sourceType", "SPLIT_BILL"] }, 1, 0],
            },
          },
        },
      },
    ]),
    Order.find(liveOrderFilters).sort({ paidAt: -1, createdAt: -1 }).lean(),
    SplitBill.find(liveSplitBillFilters).sort({ paidAt: -1, createdAt: -1 }).lean(),
  ]);

  const liveEntries = [...liveOrders.map(mapLiveOrderToHistoryEntry), ...liveSplitBills.map(mapLiveSplitBillToHistoryEntry)];
  const combinedEntries = [...archivedEntries, ...liveEntries].sort(
    (left, right) => new Date(right.paidAt || 0) - new Date(left.paidAt || 0)
  );
  const entries = combinedEntries.slice(skip, skip + limit);
  const liveSummary = {
    revenue: liveEntries.reduce((sum, entry) => sum + Number(entry.total || 0), 0),
    entriesCount: liveEntries.length,
    orderCount: liveEntries.filter((entry) => entry.sourceType === "ORDER").length,
    splitBillCount: liveEntries.filter((entry) => entry.sourceType === "SPLIT_BILL").length,
  };
  const totalEntries = archivedTotalEntries + liveEntries.length;

  return {
    filters: {
      granularity,
      period,
      page,
      limit,
      paymentMethod,
      tableNumber,
      receiptNumber,
      itemKeyword,
      amountMin,
      amountMax,
    },
    overview: groupedOverview,
    pagination: {
      totalEntries,
      page,
      limit,
      hasMore: skip + entries.length < totalEntries,
    },
    summary: {
      revenue: (archivedPeriodSummary[0]?.revenue || 0) + liveSummary.revenue,
      entriesCount: (archivedPeriodSummary[0]?.entriesCount || 0) + liveSummary.entriesCount,
      orderCount: (archivedPeriodSummary[0]?.orderCount || 0) + liveSummary.orderCount,
      splitBillCount: (archivedPeriodSummary[0]?.splitBillCount || 0) + liveSummary.splitBillCount,
    },
    entries,
  };
};

module.exports = {
  getAnalytics,
  closeBusinessDay,
  getDailyCheckouts,
  getHistoryEntries,
};
