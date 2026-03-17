const { GoogleGenerativeAI } = require("@google/generative-ai");

const { getGeminiModelName } = require("../../config/gemini");
const { buildMenuContext } = require("../../utils/formatMenuContext");

const buildStructuredSummary = ({ restaurant, intent, shortlisted, safety }) => ({
  restaurant: restaurant.name,
  language: intent.language,
  intentType: intent.type,
  priorities: intent.priorities,
  picks: shortlisted.map(({ item, reasons }) => ({
    _id: item._id?.toString?.() || null,
    name: item.name,
    description: item.description || "",
    imageUrl: item.imageUrl || "",
    price: item.price,
    calories: item.calories ?? null,
    spicyLevel: item.spicyLevel || "Unknown",
    allergens: item.allergens || [],
    category: item.category?.name || "Uncategorized",
    isAvailable: item.isAvailable !== false,
    isBestSeller: Boolean(item.isBestSeller),
    isOwnerPick: Boolean(item.isOwnerPick),
    orderCount: Number(item.orderCount || 0),
    reasons,
  })),
  warnings: safety.warnings,
  notes: safety.notes,
});

const buildFallbackReply = ({ summary }) => {
  const isVietnamese = summary.language === "vi";

  if (!summary.picks.length) {
    return isVietnamese
      ? "Tôi chưa thấy món phù hợp hoàn toàn với yêu cầu này trong menu hiện tại. Nếu bạn muốn, tôi có thể nới điều kiện một chút và gợi ý phương án gần nhất."
      : "I could not find an exact match for that request in the current menu. If you want, I can loosen one constraint and suggest the closest options.";
  }

  const intro = isVietnamese
    ? "Đây là vài lựa chọn phù hợp nhất:"
    : "These are the best-fit options right now:";
  const picks = summary.picks
    .map((pick) => {
      const details = [
        `$${pick.price}`,
        typeof pick.calories === "number" ? `${pick.calories} cal` : null,
        pick.spicyLevel ? `${pick.spicyLevel} spice` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      const reasonText = pick.reasons.length
        ? isVietnamese
          ? `ly do: ${pick.reasons.join(", ")}`
          : `why: ${pick.reasons.join(", ")}`
        : "";

      return `- ${pick.name} (${details})${reasonText ? `, ${reasonText}` : ""}`;
    })
    .join("\n");

  const notes = [...summary.warnings, ...summary.notes]
    .map((note) => `- ${note}`)
    .join("\n");

  return [intro, picks, notes].filter(Boolean).join("\n");
};

const generateReplyWithGemini = async ({ restaurant, menuItems, message, recentMessages, summary }) => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });
  const historyBlock = recentMessages.length
    ? recentMessages.map((item) => `${item.role}: ${item.content}`).join("\n")
    : "No prior chat history.";
  const prompt = [
    "You are TableMind AI acting like a professional restaurant waiter.",
    "Respond in the same language as the customer message.",
    "Use only the validated facts below. Do not invent popularity, ingredients, or allergen safety.",
    "If data is missing, say that you do not see that information in the menu yet.",
    "Keep the answer concise, helpful, and menu-aware.",
    `Restaurant: ${restaurant.name}`,
    `Recent conversation:\n${historyBlock}`,
    `Customer message: ${message}`,
    `Validated agent summary:\n${JSON.stringify(summary, null, 2)}`,
    `Full menu context:\n${buildMenuContext(menuItems)}`,
  ].join("\n\n");

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || null;
  } catch (error) {
    return null;
  }
};

const synthesizeReply = async ({ restaurant, menuItems, message, recentMessages, intent, shortlisted, safety }) => {
  const summary = buildStructuredSummary({
    restaurant,
    intent,
    shortlisted,
    safety,
  });
  const geminiReply = await generateReplyWithGemini({
    restaurant,
    menuItems,
    message,
    recentMessages,
    summary,
  });

  return {
    reply: geminiReply || buildFallbackReply({ summary }),
    source: geminiReply ? "gemini" : "fallback",
    meta: {
      summary,
      agentTrace: [
        { agent: "intent", output: intent },
        {
          agent: "menu_retrieval",
          output: {
            picks: shortlisted.map(({ item }) => item.name),
          },
        },
        { agent: "safety", output: safety },
      ],
    },
  };
};

module.exports = {
  synthesizeReply,
};
