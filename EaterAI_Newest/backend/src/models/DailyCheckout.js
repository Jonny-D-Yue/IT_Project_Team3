const mongoose = require("mongoose");

const dailyCheckoutSchema = new mongoose.Schema(
  {
    businessDate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    paidRevenue: {
      type: Number,
      required: true,
      min: 0,
    },
    cashReceivedTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    changeGivenTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    billsIssuedCount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidOrdersCount: {
      type: Number,
      required: true,
      min: 0,
    },
    unpaidOrdersCount: {
      type: Number,
      required: true,
      min: 0,
    },
    servedOrdersCount: {
      type: Number,
      required: true,
      min: 0,
    },
    settledTablesCount: {
      type: Number,
      required: true,
      min: 0,
    },
    splitBillsPaidCount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    closedAt: {
      type: Date,
      default: Date.now,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DailyCheckout", dailyCheckoutSchema);
