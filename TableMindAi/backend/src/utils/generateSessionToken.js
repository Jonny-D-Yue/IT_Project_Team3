const crypto = require("crypto");

const generateSessionToken = () => crypto.randomBytes(24).toString("hex");

module.exports = {
  generateSessionToken,
};
