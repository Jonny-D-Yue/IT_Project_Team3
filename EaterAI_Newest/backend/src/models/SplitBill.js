const mongoose = require("mongoose");

const splitBillItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    itemIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const splitBillSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["OPEN", "PAID", "VOID"],
      default: "OPEN",
    },
    items: {
      type: [splitBillItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
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

module.exports = mongoose.model("SplitBill", splitBillSchema);
