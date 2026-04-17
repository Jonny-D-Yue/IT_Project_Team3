const { v2: cloudinary } = require("cloudinary");

const hasRealValue = (value) => Boolean(value) && !String(value).startsWith("your_cloudinary_");

const isCloudinaryConfigured = () =>
  Boolean(
    hasRealValue(process.env.CLOUDINARY_CLOUD_NAME) &&
      hasRealValue(process.env.CLOUDINARY_API_KEY) &&
      hasRealValue(process.env.CLOUDINARY_API_SECRET)
  );

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
