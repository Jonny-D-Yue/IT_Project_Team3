const mongoose = require("mongoose");

const historyItemSchema = new mongoose.Schema(
  {
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

const historyEntrySchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ["ORDER", "SPLIT_BILL"],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    dailyCheckoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyCheckout",
      required: true,
      index: true,
    },
    businessDate: {
      type: String,
      required: true,
      index: true,
    },
    businessMonth: {
      type: String,
      required: true,
      index: true,
    },
    businessYear: {
      type: String,
      required: true,
      index: true,
    },
    tableNumber: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD", null],
      default: null,
    },
    paidAt: {
      type: Date,
      required: true,
      index: true,
    },
    receiptNumber: {
      type: Number,
      min: 1,
      default: null,
    },
    receiptDate: {
      type: String,
      trim: true,
      default: null,
    },
    itemCount: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: [historyItemSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

historyEntrySchema.index({ businessDate: -1, paidAt: -1 });
historyEntrySchema.index({ businessMonth: -1, paidAt: -1 });
historyEntrySchema.index({ businessYear: -1, paidAt: -1 });

module.exports = mongoose.model("HistoryEntry", historyEntrySchema);
