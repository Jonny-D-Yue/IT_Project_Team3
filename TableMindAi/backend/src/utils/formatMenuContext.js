const buildMenuContext = (menuItems) =>
  menuItems
    .map((item) => {
      const categoryName = item.category?.name || "Uncategorized";
      const calories = typeof item.calories === "number" ? `${item.calories} cal` : "Calories unknown";
      const allergens = item.allergens?.length ? item.allergens.join(", ") : "None listed";
      const tags = item.tags?.length ? item.tags.join(", ") : "None";
      const popularity = item.orderCount ? `${item.orderCount} orders` : "No sales data yet";
      return [
        `Name: ${item.name}`,
        `Category: ${categoryName}`,
        `Price: ${item.price}`,
        `Description: ${item.description || "No description"}`,
        `Calories: ${calories}`,
        `Spicy Level: ${item.spicyLevel || "Unknown"}`,
        `Allergens: ${allergens}`,
        `Tags: ${tags}`,
        `Available: ${item.isAvailable ? "Yes" : "No"}`,
        `Best Seller: ${item.isBestSeller ? "Yes" : "No"}`,
        `Owner Recommendation: ${item.isOwnerPick ? "Yes" : "No"}`,
        `Sales: ${popularity}`,
      ].join(" | ");
    })
    .join("\n");

module.exports = {
  buildMenuContext,
};
