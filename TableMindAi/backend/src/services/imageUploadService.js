const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

const uploadMenuImage = async ({ imageBase64, mimeType, folder = "tablemind/menu-items" }) => {
  if (!imageBase64 || !mimeType) {
    throw new ApiError(400, "imageBase64 and mimeType are required.");
  }

  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, "Cloudinary is not configured. Add CLOUDINARY_* env vars before uploading menu images.");
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(`data:${mimeType};base64,${imageBase64}`, {
      folder,
      resource_type: "image",
    });

    return {
      imageUrl: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      width: uploadResponse.width,
      height: uploadResponse.height,
      format: uploadResponse.format,
    };
  } catch (error) {
    console.error("Menu image upload error:", error);
    throw new ApiError(502, `Cloudinary upload failed while saving the menu image. ${error.message || ""}`.trim());
  }
};

module.exports = {
  uploadMenuImage,
};
