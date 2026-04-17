const { normalizeText } = require("./shared");

const evaluateSafety = ({ menuItems, shortlisted, intent }) => {
  const warnings = [];
  const notes = [];
  const { priorities } = intent;

  if (priorities.requestedAllergens.length) {
    const hasAllergenData = menuItems.some((item) => (item.allergens || []).length);

    if (!hasAllergenData) {
      warnings.push("I do not see enough allergen data in the menu to confirm a safe option.");
    } else if (!shortlisted.length) {
      warnings.push("I could not find an available menu item that clearly avoids the requested allergen.");
    } else {
      notes.push(`avoiding ${priorities.requestedAllergens.join(", ")}`);
    }
  }

  if (priorities.asksPopularity) {
    notes.push("The menu does not include sales or popularity data, so I am not claiming a bestseller.");
  }

  if (priorities.calorieMax && shortlisted.some(({ item }) => typeof item.calories !== "number")) {
    notes.push("Some menu items do not list calories, so I only trusted the ones with explicit calorie data.");
  }

  if (priorities.asksAvailability) {
    const unavailableCount = menuItems.filter((item) => !item.isAvailable).length;
    if (unavailableCount) {
      notes.push("I only considered items currently marked available.");
    }
  }

  return {
    warnings,
    notes,
  };
};

module.exports = {
  evaluateSafety,
};
