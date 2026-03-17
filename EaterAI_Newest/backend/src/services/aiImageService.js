const { GoogleGenerativeAI } = require("@google/generative-ai");

const { getGeminiModelName } = require("../config/gemini");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const { uploadMenuImage } = require("./imageUploadService");
const ApiError = require("../utils/ApiError");

const stripCodeFence = (value = "") => value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

const parseStructuredJson = (value) => {
  try {
    return JSON.parse(stripCodeFence(value));
  } catch (error) {
    throw new ApiError(502, "AI returned an invalid response while analyzing the dish image.");
  }
};

const normalizeSpicyLevel = (value = "") => {
  const normalized = value.toLowerCase();

  if (["none", "no spice"].includes(normalized)) {
    return "None";
  }

  if (["mild", "light"].includes(normalized)) {
    return "Mild";
  }

  if (["medium"].includes(normalized)) {
    return "Medium";
  }

  if (["spicy", "hot"].includes(normalized)) {
    return "Spicy";
  }

  return value || "Mild";
};

const cleanList = (items) =>
  Array.isArray(items)
    ? items.map((item) => String(item).trim()).filter(Boolean)
    : [];

const findMatchingCategory = (categories, categoryName) => {
  if (!categoryName) {
    return categories[0] || null;
  }

  const normalizedTarget = categoryName.trim().toLowerCase();
  return (
    categories.find((category) => category.name.toLowerCase() === normalizedTarget) ||
    categories.find((category) => category.name.toLowerCase().includes(normalizedTarget)) ||
    categories[0] ||
    null
  );
};

const buildPrompt = ({ restaurant, categories, notes }) => [
  "You are helping a restaurant owner convert a dish photo into a menu item draft and cooking guide.",
  "Infer only what is visually plausible from the photo. If unsure, say so briefly in the corresponding field.",
  "Return valid JSON only. No markdown, no explanation outside JSON.",
  "Use this exact JSON shape:",
  JSON.stringify(
    {
      name: "Dish name",
      description: "Short menu description",
      categoryName: "Best matching category from the provided list",
      price: 0,
      calories: 0,
      spicyLevel: "None | Mild | Medium | Spicy",
      allergens: ["allergen"],
      tags: ["tag"],
      imagePromptSummary: "One-sentence visual summary of the dish",
      cookingGuide: {
        overview: "Short chef-style summary",
        ingredients: ["ingredient"],
        prepNotes: ["prep note"],
        steps: ["step 1", "step 2"],
        platingTips: ["tip"],
      },
    },
    null,
    2
  ),
  `Restaurant name: ${restaurant?.name || "TableMind restaurant"}`,
  `Allowed categories: ${categories.map((category) => category.name).join(", ")}`,
  notes ? `Owner notes: ${notes}` : "Owner notes: none",
  "Keep the cooking guide practical for a restaurant kitchen and concise.",
].join("\n\n");

const uploadDishImage = async ({ imageBase64, mimeType }) => {
  try {
    const uploadResult = await uploadMenuImage({
      imageBase64,
      mimeType,
      folder: "tablemind/menu-items",
    });

    return {
      imageUrl: uploadResult.imageUrl,
      storage: "cloudinary",
    };
  } catch (error) {
    if (error.statusCode === 503) {
      return {
        imageUrl: "",
        storage: "temporary",
      };
    }

    throw error;
  }
};

const analyzeMenuImage = async ({ imageBase64, mimeType, notes }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(503, "GEMINI_API_KEY is required for dish image analysis.");
  }

  if (!imageBase64 || !mimeType) {
    throw new ApiError(400, "imageBase64 and mimeType are required.");
  }

  const [restaurant, categories] = await Promise.all([
    Restaurant.findOne().sort({ createdAt: 1 }).lean(),
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
  ]);

  if (!categories.length) {
    throw new ApiError(400, "Create at least one category before using AI dish import.");
  }

  const uploadedImage = await uploadDishImage({ imageBase64, mimeType });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
  let text = "";

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
      buildPrompt({ restaurant, categories, notes }),
    ]);
    text = result.response.text().trim();
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    throw new ApiError(502, `Gemini failed to analyze the dish image. ${error.message || ""}`.trim());
  }

  const parsed = parseStructuredJson(text);
  const matchedCategory = findMatchingCategory(categories, parsed.categoryName);

  if (!matchedCategory) {
    throw new ApiError(400, "No category is available to map the AI draft.");
  }

  return {
    draftMenuItem: {
      name: String(parsed.name || "").trim(),
      description: String(parsed.description || "").trim(),
      price: Number(parsed.price) || 0,
      calories: Number(parsed.calories) || "",
      imageUrl: uploadedImage.imageUrl,
      category: matchedCategory._id.toString(),
      categoryLabel: matchedCategory.name,
      isAvailable: true,
      spicyLevel: normalizeSpicyLevel(String(parsed.spicyLevel || "")),
      allergens: cleanList(parsed.allergens).join(", "),
      tags: cleanList(parsed.tags).join(", "),
    },
    cookingGuide: {
      overview: parsed.cookingGuide?.overview || "",
      ingredients: cleanList(parsed.cookingGuide?.ingredients),
      prepNotes: cleanList(parsed.cookingGuide?.prepNotes),
      steps: cleanList(parsed.cookingGuide?.steps),
      platingTips: cleanList(parsed.cookingGuide?.platingTips),
    },
    imagePromptSummary: String(parsed.imagePromptSummary || "").trim(),
    imageStorage: uploadedImage.storage,
    rawCategorySuggestion: String(parsed.categoryName || "").trim(),
  };
};

module.exports = {
  analyzeMenuImage,
};
