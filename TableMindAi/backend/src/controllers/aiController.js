const asyncHandler = require("express-async-handler");

const aiService = require("../services/aiService");
const aiImageService = require("../services/aiImageService");
const { validateAiChatPayload, validateMenuImagePayload } = require("../validators/aiValidator");
const { sendSuccess } = require("../utils/apiResponse");

const chat = asyncHandler(async (req, res) => {
  validateAiChatPayload(req.body);
  const data = await aiService.chat(req.body);
  sendSuccess(res, "AI response generated successfully.", data);
});

const recommend = asyncHandler(async (req, res) => {
  validateAiChatPayload(req.body);
  const data = await aiService.recommend(req.body);
  sendSuccess(res, "AI recommendation generated successfully.", data);
});

const analyzeMenuImage = asyncHandler(async (req, res) => {
  validateMenuImagePayload(req.body);
  const data = await aiImageService.analyzeMenuImage(req.body);
  sendSuccess(res, "Dish image analyzed successfully.", data);
});

const getChatHistory = asyncHandler(async (req, res) => {
  const data = await aiService.getChatHistory(req.query);
  sendSuccess(res, "Chat history fetched successfully.", data);
});

module.exports = {
  chat,
  recommend,
  analyzeMenuImage,
  getChatHistory,
};
