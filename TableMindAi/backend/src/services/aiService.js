const ChatMessage = require("../models/ChatMessage");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const TableSession = require("../models/TableSession");
const ApiError = require("../utils/ApiError");
const { runWaiterConversation } = require("./ai/conversationOrchestrator");

const getRestaurantWithMenu = async (restaurantId) => {
  const restaurant = restaurantId
    ? await Restaurant.findById(restaurantId)
    : await Restaurant.findOne().sort({ createdAt: 1 });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant settings not found.");
  }

  const [menuItems, orderCounts] = await Promise.all([
    MenuItem.find().populate("category").sort({ name: 1 }),
    Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItemId",
          orderedQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { orderedQuantity: -1 } },
    ]),
  ]);

  const countsByItemId = orderCounts.reduce((accumulator, item) => {
    accumulator[item._id.toString()] = item.orderedQuantity;
    return accumulator;
  }, {});
  const bestSellerIds = new Set(orderCounts.slice(0, 3).map((item) => item._id.toString()));
  const enrichedMenuItems = menuItems.map((item) => {
    const plainItem = item.toObject ? item.toObject() : item;
    return {
      ...plainItem,
      orderCount: countsByItemId[item._id.toString()] || 0,
      isBestSeller: bestSellerIds.has(item._id.toString()),
    };
  });

  return { restaurant, menuItems: enrichedMenuItems };
};

const ensureSession = async (restaurantId, sessionToken, tableNumber) => {
  const session = await TableSession.findOne({
    restaurantId,
    sessionToken,
    tableNumber: Number(tableNumber),
    isActive: true,
  });

  if (!session) {
    throw new ApiError(400, "Table session is invalid or has expired.");
  }
};

const storeMessages = async ({ sessionToken, tableNumber, userMessage, assistantMessage, recommendedItems = [] }) => {
  await ChatMessage.insertMany([
    {
      sessionToken,
      tableNumber: Number(tableNumber),
      role: "user",
      content: userMessage,
    },
    {
      sessionToken,
      tableNumber: Number(tableNumber),
      role: "assistant",
      content: assistantMessage,
      recommendedItems: recommendedItems.map((item) => ({
        itemId: item._id || null,
        name: item.name,
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        price: item.price,
        calories: item.calories ?? null,
        category: item.category || "",
        isBestSeller: Boolean(item.isBestSeller),
        isOwnerPick: Boolean(item.isOwnerPick),
        isAvailable: item.isAvailable !== false,
      })),
    },
  ]);
};

const getRecentMessages = async ({ sessionToken, tableNumber, limit = 6 }) => {
  const messages = await ChatMessage.find({
    sessionToken,
    tableNumber: Number(tableNumber),
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse();
};

const chat = async ({ restaurantId, sessionToken, tableNumber, message }) => {
  await ensureSession(restaurantId, sessionToken, tableNumber);
  const { restaurant, menuItems } = await getRestaurantWithMenu(restaurantId);
  const recentMessages = await getRecentMessages({ sessionToken, tableNumber });
  const result = await runWaiterConversation({
    restaurant,
    menuItems,
    message,
    recentMessages,
    mode: "chat",
  });

  await storeMessages({
    sessionToken,
    tableNumber,
    userMessage: message,
    assistantMessage: result.reply,
    recommendedItems: result.meta?.summary?.picks || [],
  });

  return {
    reply: result.reply,
    source: result.source,
    meta: result.meta,
    recommendedItems: result.meta?.summary?.picks || [],
  };
};

const recommend = async ({ restaurantId, sessionToken, tableNumber, message }) => {
  await ensureSession(restaurantId, sessionToken, tableNumber);
  const { restaurant, menuItems } = await getRestaurantWithMenu(restaurantId);
  const recentMessages = await getRecentMessages({ sessionToken, tableNumber });
  const recommendationPrompt = message || "Recommend a few dishes from the menu.";
  const result = await runWaiterConversation({
    restaurant,
    menuItems,
    message: recommendationPrompt,
    recentMessages,
    mode: "recommend",
  });

  await storeMessages({
    sessionToken,
    tableNumber,
    userMessage: recommendationPrompt,
    assistantMessage: result.reply,
    recommendedItems: result.meta?.summary?.picks || [],
  });

  return {
    reply: result.reply,
    source: result.source,
    meta: result.meta,
    recommendedItems: result.meta?.summary?.picks || [],
  };
};

const getChatHistory = async ({ restaurantId, sessionToken, tableNumber }) => {
  await ensureSession(restaurantId, sessionToken, tableNumber);
  const messages = await ChatMessage.find({
    sessionToken,
    tableNumber: Number(tableNumber),
  })
    .sort({ createdAt: 1 })
    .lean();

  return messages.map((message) => ({
    id: message._id.toString(),
    role: message.role,
    content: message.content,
    recommendedItems: (message.recommendedItems || []).map((item) => ({
      _id: item.itemId,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: item.price,
      calories: item.calories,
      category: item.category,
      isBestSeller: Boolean(item.isBestSeller),
      isOwnerPick: Boolean(item.isOwnerPick),
      isAvailable: item.isAvailable,
    })),
    createdAt: message.createdAt,
  }));
};

module.exports = {
  chat,
  recommend,
  getChatHistory,
};
