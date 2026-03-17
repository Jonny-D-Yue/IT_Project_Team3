const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const bcrypt = require("bcryptjs");

const connectDatabase = require("../config/db");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Category = require("../models/Category");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const TableSession = require("../models/TableSession");
const ChatMessage = require("../models/ChatMessage");

const restaurantSeed = {
  name: "TableMind AI Bistro",
  address: "123 Demo Street, Vancouver, BC",
  totalTables: 20,
  currency: "CAD",
  taxRate: 0.05,
  isOpen: true,
};

const categoriesSeed = [
  {
    name: "Appetizers",
    description: "Light starters and shareable plates.",
  },
  {
    name: "Main Course",
    description: "Hearty signature dishes.",
  },
  {
    name: "Drinks",
    description: "Coffee, smoothies, and refreshing beverages.",
  },
  {
    name: "Desserts",
    description: "Sweet finishes to the meal.",
  },
];

const menuItemSeedFactory = (categoryMap) => [
  {
    name: "Pho Beef",
    description: "Slow-simmered beef broth with rice noodles and herbs.",
    price: 18.5,
    calories: 620,
    imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43",
    category: categoryMap["Main Course"],
    isAvailable: true,
    spicyLevel: "Mild",
    allergens: ["Soy"],
    tags: ["Popular", "Soup"],
  },
  {
    name: "Grilled Chicken Rice",
    description: "Char-grilled chicken over jasmine rice with pickled vegetables.",
    price: 16.75,
    calories: 540,
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19",
    category: categoryMap["Main Course"],
    isAvailable: true,
    spicyLevel: "Mild",
    allergens: [],
    tags: ["Balanced", "Protein"],
  },
  {
    name: "Steak Medium Rare",
    description: "Pan-seared steak with pepper sauce and roasted potatoes.",
    price: 29.95,
    calories: 780,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947",
    category: categoryMap["Main Course"],
    isAvailable: true,
    spicyLevel: "Medium",
    allergens: ["Dairy"],
    tags: ["Dinner", "Premium"],
  },
  {
    name: "Vietnamese Iced Coffee",
    description: "Strong drip coffee with condensed milk served over ice.",
    price: 6.5,
    calories: 180,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    category: categoryMap["Drinks"],
    isAvailable: true,
    spicyLevel: "None",
    allergens: ["Dairy"],
    tags: ["Coffee", "Popular"],
  },
  {
    name: "Mango Smoothie",
    description: "Fresh mango blended with yogurt and ice.",
    price: 7.25,
    calories: 210,
    imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4",
    category: categoryMap["Drinks"],
    isAvailable: true,
    spicyLevel: "None",
    allergens: ["Dairy"],
    tags: ["Cold", "Fruit"],
  },
];

const seed = async () => {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    TableSession.deleteMany({}),
    ChatMessage.deleteMany({}),
  ]);

  const restaurant = await Restaurant.create(restaurantSeed);
  const categories = await Category.insertMany(categoriesSeed);
  const categoryMap = categories.reduce((acc, category) => {
    acc[category.name] = category._id;
    return acc;
  }, {});

  await MenuItem.insertMany(menuItemSeedFactory(categoryMap));

  const [adminPasswordHash, staffPasswordHash] = await Promise.all([
    bcrypt.hash("Admin123!", 10),
    bcrypt.hash("Staff123!", 10),
  ]);

  await User.insertMany([
    {
      name: "TableMind Admin",
      email: "admin@tablemind.ai",
      passwordHash: adminPasswordHash,
      role: "admin",
      isActive: true,
    },
    {
      name: "TableMind Staff",
      email: "staff@tablemind.ai",
      passwordHash: staffPasswordHash,
      role: "staff",
      isActive: true,
    },
  ]);

  console.log("Seed completed successfully.");
  console.log(`Restaurant ID: ${restaurant._id}`);
  console.log("Admin: admin@tablemind.ai / Admin123!");
  console.log("Staff: staff@tablemind.ai / Staff123!");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
