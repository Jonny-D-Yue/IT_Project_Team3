import { useRef, useState } from "react";

import { analyzeMenuImageRequest } from "../../api/aiAdminApi";
import { createMenuItemRequest } from "../../api/menuApi";
import { getApiErrorMessage } from "../../utils/errors";
import { compressImageFile, fileToBase64, MAX_IMAGE_FILE_SIZE } from "../../utils/imageUpload";
import Button from "../common/Button";
import Input from "../common/Input";

const emptyGuide = {
  overview: "",
  ingredients: [],
  prepNotes: [],
  steps: [],
  platingTips: [],
};


export default function AiMenuImportPanel({ categories, onCreated, showToast }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const [guide, setGuide] = useState(emptyGuide);
  const [summary, setSummary] = useState("");
  const [imageStorage, setImageStorage] = useState("");
  const [selectedFileSize, setSelectedFileSize] = useState(0);

  const updateDraftField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setNotes("");
    setDraft(null);
    setGuide(emptyGuide);
    setSummary("");
    setImageStorage("");
    setSelectedFileSize(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      showToast({
        title: "Large image detected",
        message: "The app will compress this image before sending it to AI.",
        variant: "success",
      });
    }

    setSelectedFile(file);
    setSelectedFileSize(file.size);
    setPreviewUrl(URL.createObjectURL(file));
    setDraft(null);
    setGuide(emptyGuide);
    setSummary("");
    setImageStorage("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      showToast({
        title: "Image required",
        message: "Choose a dish photo before asking AI to create a draft.",
        variant: "error",
      });
      return;
    }

    setAnalyzing(true);

    try {
      const uploadFile = await compressImageFile(selectedFile);
      const imageBase64 = await fileToBase64(uploadFile);
      const response = await analyzeMenuImageRequest({
        imageBase64,
        mimeType: uploadFile.type,
        notes,
      });

      setDraft(response.draftMenuItem);
      setGuide(response.cookingGuide || emptyGuide);
      setSummary(response.imagePromptSummary || "");
      setImageStorage(response.imageStorage || "");
      showToast({
        title: "AI draft ready",
        message:
          response.imageStorage === "cloudinary"
            ? "Image uploaded to Cloudinary. Review the draft and save when ready."
            : "Review the menu draft and cooking guide, then save if it looks right.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "AI analysis failed",
        message: getApiErrorMessage(error, "Unable to analyze that image right now."),
        variant: "error",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!draft?.name || !draft?.category) {
      showToast({
        title: "Draft incomplete",
        message: "Name and category are required before adding the item to the menu.",
        variant: "error",
      });
      return;
    }

    setSaving(true);

    try {
      await createMenuItemRequest({
        ...draft,
        price: Number(draft.price),
        calories: draft.calories ? Number(draft.calories) : undefined,
        allergens: draft.allergens
          ? draft.allergens.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        tags: draft.tags
          ? draft.tags.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
      });
      showToast({
        title: "Menu item created",
        message: "The AI draft has been added to your menu.",
        variant: "success",
      });
      resetAll();
      await onCreated?.();
    } catch (error) {
      showToast({
        title: "Save failed",
        message: getApiErrorMessage(error, "Unable to create the menu item from this draft."),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">AI Menu Import</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Upload a dish photo, get recipe guidance, then add it to the menu</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            The AI drafts a menu item and gives the owner a practical cooking guide. Review everything before saving.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={resetAll}>
            Reset
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Analyze Dish Photo"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Dish photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="block w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-5 text-sm text-slate-600"
            />
          </label>
          {selectedFile ? (
            <p className="text-xs text-slate-500">
              Selected file size: {(selectedFileSize / (1024 * 1024)).toFixed(2)} MB. Large images are compressed automatically before upload.
            </p>
          ) : null}
          {previewUrl ? (
            <img src={previewUrl} alt="Dish preview" className="h-72 w-full rounded-[24px] object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
              Choose a food image to start
            </div>
          )}
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Owner notes for AI</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
              placeholder="Optional: cuisine style, target price band, ingredients you want emphasized..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          {summary ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">AI visual summary:</span> {summary}
            </div>
          ) : null}
          {imageStorage ? (
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">Image storage:</span>{" "}
              {imageStorage === "cloudinary" ? "Saved to Cloudinary and will be reused as menu image." : "Temporary only. Configure Cloudinary to persist menu images."}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Menu draft</h3>
              {draft ? (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Adding..." : "Add To Menu"}
                </Button>
              ) : null}
            </div>
            {draft ? (
              <div className="mt-4 space-y-4">
                <Input label="Name" value={draft.name} onChange={(event) => updateDraftField("name", event.target.value)} />
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">Description</span>
                  <textarea
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
                    value={draft.description}
                    onChange={(event) => updateDraftField("description", event.target.value)}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    value={draft.price}
                    onChange={(event) => updateDraftField("price", event.target.value)}
                  />
                  <Input
                    label="Calories"
                    type="number"
                    value={draft.calories}
                    onChange={(event) => updateDraftField("calories", event.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Category</span>
                    <select
                      className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
                      value={draft.category}
                      onChange={(event) => updateDraftField("category", event.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Spicy level"
                    value={draft.spicyLevel}
                    onChange={(event) => updateDraftField("spicyLevel", event.target.value)}
                  />
                </div>
                <Input
                  label="Image URL"
                  placeholder="Optional hosted image URL"
                  value={draft.imageUrl}
                  onChange={(event) => updateDraftField("imageUrl", event.target.value)}
                />
                <Input
                  label="Allergens"
                  placeholder="Comma-separated values"
                  value={draft.allergens}
                  onChange={(event) => updateDraftField("allergens", event.target.value)}
                />
                <Input
                  label="Tags"
                  placeholder="Comma-separated values"
                  value={draft.tags}
                  onChange={(event) => updateDraftField("tags", event.target.value)}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Upload a dish photo and ask AI to draft the menu item first.</p>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Cooking guide for the owner</h3>
            {guide.overview ? (
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">Overview</p>
                  <p className="mt-1">{guide.overview}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Ingredients</p>
                  <ul className="mt-2 space-y-1">
                    {guide.ingredients.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Prep notes</p>
                  <ul className="mt-2 space-y-1">
                    {guide.prepNotes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Steps</p>
                  <ol className="mt-2 space-y-2">
                    {guide.steps.map((item, index) => (
                      <li key={`${index}-${item}`}>{index + 1}. {item}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Plating tips</p>
                  <ul className="mt-2 space-y-1">
                    {guide.platingTips.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">The cooking guide appears here after AI analyzes the image.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
