const { Server } = require("socket.io");

let ioInstance = null;

const initSocket = (server, options = {}) => {
  ioInstance = new Server(server, options);

  ioInstance.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => ioInstance;

module.exports = {
  initSocket,
  getIO,
};
