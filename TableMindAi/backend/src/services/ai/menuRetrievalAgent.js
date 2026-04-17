const { normalizeText, tokenize } = require("./shared");

const spicyRank = {
  none: 0,
  mild: 1,
  medium: 2,
  spicy: 3,
  hot: 3,
};

const getSpicyRank = (value = "") => spicyRank[normalizeText(value)] ?? 1;

const isDrinkItem = (item) => {
  const category = normalizeText(item.category?.name || "");
  const tags = (item.tags || []).map((tag) => normalizeText(tag));
  return category.includes("drink") || category.includes("beverage") || category.includes("nuoc") || tags.includes("drink");
};

const collectReasons = (item, intent, queryTokens) => {
  const reasons = [];
  const { priorities } = intent;

  if (priorities.budgetMax && item.price <= priorities.budgetMax) {
    reasons.push(`fits the ${priorities.budgetMax} budget`);
  }

  if (priorities.calorieMax && typeof item.calories === "number" && item.calories <= priorities.calorieMax) {
    reasons.push(`keeps calories at ${item.calories}`);
  }

  if (priorities.avoidSpicy && getSpicyRank(item.spicyLevel) <= 1) {
    reasons.push(`stays on the mild side`);
  }

  if (priorities.requestedCategory && normalizeText(item.category?.name || "") === normalizeText(priorities.requestedCategory)) {
    reasons.push(`matches the ${item.category.name} category`);
  }

  if (priorities.wantsDrink && isDrinkItem(item)) {
    reasons.push(`is a drink option`);
  }

  if (priorities.asksPopularity && item.isBestSeller) {
    reasons.push(`is one of the current best sellers`);
  }

  if (item.isOwnerPick) {
    reasons.push(`is recommended by the owner`);
  }

  const searchable = normalizeText([item.name, item.description, ...(item.tags || [])].join(" "));
  const matchedTerms = queryTokens.filter((token) => searchable.includes(token));
  if (matchedTerms.length) {
    reasons.push(`matches ${matchedTerms.slice(0, 2).join(", ")}`);
  }

  return reasons;
};

const rankMenuItems = ({ menuItems, intent, message }) => {
  const queryTokens = tokenize(message);
  const { priorities } = intent;

  const ranked = menuItems
    .map((item) => {
      const reasons = collectReasons(item, intent, queryTokens);
      const normalizedAllergens = (item.allergens || []).map((allergen) => normalizeText(allergen));
      const hasAllergenConflict = priorities.requestedAllergens.some((allergen) =>
        normalizedAllergens.some((itemAllergen) => itemAllergen.includes(normalizeText(allergen)))
      );

      if (!item.isAvailable) {
        return null;
      }

      if (hasAllergenConflict) {
        return null;
      }

      if (priorities.budgetMax && item.price > priorities.budgetMax) {
        return null;
      }

      if (priorities.calorieMax && typeof item.calories === "number" && item.calories > priorities.calorieMax) {
        return null;
      }

      if (priorities.avoidSpicy && getSpicyRank(item.spicyLevel) > 1) {
        return null;
      }

      let score = 0;

      if (priorities.wantsDrink && isDrinkItem(item)) {
        score += 4;
      }

      if (item.isOwnerPick) {
        score += 2;
      }

      if (priorities.asksPopularity) {
        score += Number(item.orderCount || 0);
        if (item.isBestSeller) {
          score += 8;
        }
      }

      if (priorities.requestedCategory && normalizeText(item.category?.name || "") === normalizeText(priorities.requestedCategory)) {
        score += 4;
      }

      if (priorities.budgetMax) {
        score += Math.max(0, priorities.budgetMax - item.price);
      }

      if (priorities.calorieMax) {
        score += typeof item.calories === "number" ? Math.max(0, priorities.calorieMax - item.calories) / 100 : 0;
      }

      if (priorities.avoidSpicy) {
        score += 3 - getSpicyRank(item.spicyLevel);
      }

      const searchable = normalizeText([item.name, item.description, ...(item.tags || [])].join(" "));
      score += queryTokens.reduce((total, token) => total + (searchable.includes(token) ? 2 : 0), 0);
      score += reasons.length;

      return {
        item,
        score,
        reasons,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.item.price - right.item.price)
    .slice(0, 5);

  return {
    shortlisted: ranked.slice(0, 3),
    consideredCount: ranked.length,
  };
};

module.exports = {
  rankMenuItems,
};
