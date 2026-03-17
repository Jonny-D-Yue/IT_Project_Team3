const mongoose = require("mongoose");

const dailyReceiptCounterSchema = new mongoose.Schema(
  {
    businessDate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lastSequence: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DailyReceiptCounter", dailyReceiptCounterSchema);
