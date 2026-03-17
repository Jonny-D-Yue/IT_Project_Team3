const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "TableMind AI Restaurant",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    totalTables: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "CAD",
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 0.05,
      min: 0,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
