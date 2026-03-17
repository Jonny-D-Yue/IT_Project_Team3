const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const http = require("http");

const app = require("./app");
const connectDatabase = require("./config/db");
const { initSocket } = require("./sockets/socket");
const { createCorsOriginHandler } = require("./utils/cors");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  const server = http.createServer(app);
  initSocket(server, {
    cors: {
      origin: createCorsOriginHandler(),
      credentials: true,
    },
  });

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
