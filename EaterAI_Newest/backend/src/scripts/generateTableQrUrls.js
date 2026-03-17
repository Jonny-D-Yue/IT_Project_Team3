const path = require("path");
const fs = require("fs");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const connectDatabase = require("../config/db");
const Restaurant = require("../models/Restaurant");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--base-url") {
      options.baseUrl = args[index + 1];
      index += 1;
    } else if (arg === "--restaurant-id") {
      options.restaurantId = args[index + 1];
      index += 1;
    } else if (arg === "--csv") {
      options.csvPath = args[index + 1];
      index += 1;
    }
  }

  return options;
};

const normalizeBaseUrl = (baseUrl) => {
  const value = (baseUrl || process.env.CLIENT_URL || "http://localhost:5173").trim();
  return value.replace(/\/+$/, "");
};

const writeCsvFile = (csvPath, rows) => {
  const resolvedPath = path.resolve(process.cwd(), csvPath);
  const directory = path.dirname(resolvedPath);
  const csvContent = ["tableNumber,url", ...rows.map(({ tableNumber, url }) => `${tableNumber},${url}`)].join("\n");

  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(resolvedPath, csvContent, "utf8");

  return resolvedPath;
};

const main = async () => {
  const { baseUrl, restaurantId, csvPath } = parseArgs();

  await connectDatabase();

  const restaurant = restaurantId
    ? await Restaurant.findById(restaurantId).lean()
    : await Restaurant.findOne().sort({ createdAt: 1 }).lean();

  if (!restaurant) {
    throw new Error("Restaurant not found. Seed the database first or pass --restaurant-id.");
  }

  const frontendBaseUrl = normalizeBaseUrl(baseUrl);
  const urls = Array.from({ length: restaurant.totalTables }, (_, index) => {
    const tableNumber = index + 1;
    return {
      tableNumber,
      url: `${frontendBaseUrl}/scan/${restaurant._id}/${tableNumber}`,
    };
  });

  console.log(`Restaurant: ${restaurant.name}`);
  console.log(`Restaurant ID: ${restaurant._id}`);
  console.log(`Frontend Base URL: ${frontendBaseUrl}`);
  console.log(`Total Tables: ${restaurant.totalTables}`);
  console.log("");

  urls.forEach(({ tableNumber, url }) => {
    console.log(`Table ${tableNumber}: ${url}`);
  });

  if (csvPath) {
    const resolvedCsvPath = writeCsvFile(csvPath, urls);
    console.log("");
    console.log(`CSV exported: ${resolvedCsvPath}`);
  }

  process.exit(0);
};

main().catch((error) => {
  console.error("Failed to generate QR URLs:", error.message);
  process.exit(1);
});
