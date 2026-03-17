const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const tableRoutes = require("./routes/tableRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { notFoundMiddleware, errorMiddleware } = require("./middlewares/errorMiddleware");
const { createCorsOriginHandler } = require("./utils/cors");

const app = express();
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "15mb";

app.use(
  cors({
    origin: createCorsOriginHandler(),
    credentials: true,
  })
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TableMind AI backend is running.",
    data: {
      uptime: process.uptime(),
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", analyticsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
