const mongoose = require("mongoose");

const tableSessionSchema = new mongoose.Schema({
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
    unique: true,
    trim: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("TableSession", tableSessionSchema);
