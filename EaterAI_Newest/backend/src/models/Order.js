const mongoose = require("mongoose");
const { PAYMENT_STATUSES, ORDER_SOURCES } = require("../utils/constants");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paidQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    sessionToken: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["NEW", "PREPARING", "READY", "SERVED"],
      default: "NEW",
    },
    source: {
      type: String,
      enum: Object.values(ORDER_SOURCES),
      default: ORDER_SOURCES.CUSTOMER,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.UNPAID,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD"],
      default: null,
    },
    cashReceived: {
      type: Number,
      min: 0,
      default: null,
    },
    changeDue: {
      type: Number,
      min: 0,
      default: null,
    },
    receiptDate: {
      type: String,
      trim: true,
      default: null,
    },
    receiptNumber: {
      type: Number,
      min: 1,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
      index: true,
    },
    dailyCheckoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyCheckout",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
