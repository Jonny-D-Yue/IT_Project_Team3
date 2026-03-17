const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  sessionToken: {
    type: String,
    trim: true,
    required: true,
  },
  tableNumber: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  recommendedItems: {
    type: [
      {
        _id: false,
        itemId: {
          type: String,
          default: null,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: "",
          trim: true,
        },
        imageUrl: {
          type: String,
          default: "",
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        calories: {
          type: Number,
          default: null,
        },
        category: {
          type: String,
          default: "",
          trim: true,
        },
        isBestSeller: {
          type: Boolean,
          default: false,
        },
        isOwnerPick: {
          type: Boolean,
          default: false,
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
