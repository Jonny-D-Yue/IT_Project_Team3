export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
export const JPEG_QUALITY = 0.82;

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64] = result.split(",");
      resolve(base64 || "");
    };
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });

const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to process the selected image."));
    };
    image.src = objectUrl;
  });

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to compress the image."));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });

export const compressImageFile = async (file) => {
  if (file.size <= MAX_IMAGE_FILE_SIZE) {
    return file;
  }

  const image = await loadImageElement(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to compress the image on this browser.");
  }

  context.drawImage(image, 0, 0, width, height);
  const outputMimeType = file.type === "image/png" ? "image/jpeg" : file.type || "image/jpeg";
  const blob = await canvasToBlob(canvas, outputMimeType, JPEG_QUALITY);

  return new File([blob], file.name.replace(/\.\w+$/, outputMimeType === "image/jpeg" ? ".jpg" : ".webp"), {
    type: outputMimeType,
    lastModified: Date.now(),
  });
};
