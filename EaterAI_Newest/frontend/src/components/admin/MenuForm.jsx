import { useRef, useState } from "react";

import { uploadMenuImageRequest } from "../../api/menuApi";
import { compressImageFile, fileToBase64, MAX_IMAGE_FILE_SIZE } from "../../utils/imageUpload";
import Button from "../common/Button";
import Input from "../common/Input";

export default function MenuForm({ form, categories, onChange, onSubmit, submitting, onCancel, showToast }) {
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      showToast?.({
        title: "Large image detected",
        message: "The image will be compressed before upload.",
        variant: "success",
      });
    }

    setUploadingImage(true);

    try {
      const uploadFile = await compressImageFile(file);
      const imageBase64 = await fileToBase64(uploadFile);
      const response = await uploadMenuImageRequest({
        imageBase64,
        mimeType: uploadFile.type,
      });
      onChange("imageUrl", response.imageUrl);
      showToast?.({
        title: "Image uploaded",
        message: "The menu image was uploaded successfully.",
        variant: "success",
      });
    } catch (error) {
      showToast?.({
        title: "Image upload failed",
        message: error?.response?.data?.message || error?.message || "Unable to upload that image right now.",
        variant: "error",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div className="min-w-0 space-y-4">
          <Input label="Name" value={form.name} onChange={(event) => onChange("name", event.target.value)} />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Description</span>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Price" type="number" step="0.01" value={form.price} onChange={(event) => onChange("price", event.target.value)} />
            <Input label="Calories" type="number" value={form.calories} onChange={(event) => onChange("calories", event.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Category</span>
              <select
                className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
                value={form.category}
                onChange={(event) => onChange("category", event.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Spicy level" value={form.spicyLevel} onChange={(event) => onChange("spicyLevel", event.target.value)} />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3">
            <input type="checkbox" checked={form.isAvailable} onChange={(event) => onChange("isAvailable", event.target.checked)} />
            <span className="font-semibold text-slate-700">Available</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3">
            <input type="checkbox" checked={form.isOwnerPick} onChange={(event) => onChange("isOwnerPick", event.target.checked)} />
            <span className="font-semibold text-slate-700">Owner recommendation</span>
          </label>
          <Input label="Allergens" placeholder="Comma-separated values" value={form.allergens} onChange={(event) => onChange("allergens", event.target.value)} />
          <Input label="Tags" placeholder="Comma-separated values" value={form.tags} onChange={(event) => onChange("tags", event.target.value)} />
        </div>

        <div className="min-w-0 space-y-4 rounded-[24px] bg-slate-50 p-4">
          <Input label="Image URL" value={form.imageUrl} onChange={(event) => onChange("imageUrl", event.target.value)} />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Upload image from your computer</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageUpload}
              className="block w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-slate-600"
            />
          </label>
          {uploadingImage ? <p className="text-sm text-slate-500">Uploading image...</p> : null}
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="Menu preview" className="h-56 w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
              Image preview will appear here
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-slate-200 bg-white/95 pt-4 backdrop-blur">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Menu Item"}
        </Button>
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
