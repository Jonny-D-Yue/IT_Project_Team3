const { containsAny, detectLanguage, normalizeText, normalizeVietnamese, parseBudget, parseCalories } = require("./shared");

const ALLERGEN_KEYWORDS = {
  peanuts: ["peanut", "peanuts", "lac", "dau phong"],
  shellfish: ["shellfish", "shrimp", "prawn", "crab", "tom hum", "hai san"],
  dairy: ["dairy", "milk", "cheese", "sua", "bo sua"],
  gluten: ["gluten", "wheat", "flour", "bot mi"],
  soy: ["soy", "soybean", "dau nanh"],
  egg: ["egg", "eggs", "trung"],
  tree_nuts: ["tree nut", "almond", "cashew", "hat dieu", "hat hanh nhan"],
};

const extractRequestedAllergens = (message, menuItems) => {
  const normalizedMessage = normalizeText(message);
  const normalizedVietnameseMessage = normalizeVietnamese(message);
  const menuAllergens = menuItems.flatMap((item) => item.allergens || []).map((allergen) => allergen.toLowerCase());
  const matched = Object.entries(ALLERGEN_KEYWORDS)
    .filter(([, keywords]) => containsAny(normalizedVietnameseMessage, keywords))
    .map(([allergen]) => allergen);

  const inferredFromMenu = menuAllergens.filter((allergen) =>
    normalizedVietnameseMessage.includes(normalizeVietnamese(allergen))
  );
  return [...new Set([...matched, ...inferredFromMenu])];
};

const inferRequestedCategory = (message, menuItems) => {
  const normalizedMessage = normalizeVietnamese(message);
  const categories = [...new Set(menuItems.map((item) => item.category?.name).filter(Boolean))];

  return categories.find((category) => normalizedMessage.includes(normalizeVietnamese(category))) || null;
};

const detectIntent = ({ message, mode, menuItems }) => {
  const normalizedMessage = normalizeVietnamese(message);
  const language = detectLanguage(message);
  const requestedAllergens = extractRequestedAllergens(message, menuItems);
  const requestedCategory = inferRequestedCategory(message, menuItems);
  const wantsRecommendation =
    mode === "recommend" ||
    containsAny(normalizedMessage, [
      "recommend",
      "suggest",
      "what should i eat",
      "goi y",
      "nen an gi",
      "chon gi",
    ]);

  const wantsBudget = Boolean(parseBudget(message));
  const calorieMax = parseCalories(message);
  const avoidSpicy = containsAny(normalizedMessage, [
    "not spicy",
    "non spicy",
    "dont want spicy",
    "do not want spicy",
    "no spicy",
    "mild",
    "khong cay",
    "it cay",
    "khong an cay",
    "khong muon cay",
    "khong muon an cay",
    "avoid spicy",
  ]);
  const wantsDrink = containsAny(normalizedMessage, ["drink", "drinks", "beverage", "uong", "nuoc"]);
  const asksPopularity = containsAny(normalizedMessage, ["popular", "best seller", "ban chay", "pho bien"]);
  const asksAvailability = containsAny(normalizedMessage, ["available", "sold out", "con mon", "het mon"]);

  return {
    language,
    type: wantsRecommendation ? "recommendation" : "menu_guidance",
    priorities: {
      budgetMax: parseBudget(message),
      calorieMax,
      avoidSpicy,
      requestedAllergens,
      requestedCategory,
      wantsDrink,
      asksPopularity,
      asksAvailability,
    },
  };
};

module.exports = {
  detectIntent,
};
