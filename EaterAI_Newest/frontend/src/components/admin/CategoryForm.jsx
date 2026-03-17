import Button from "../common/Button";
import Input from "../common/Input";

export default function CategoryForm({ form, onChange, onSubmit, submitting, onCancel }) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Input label="Category name" value={form.name} onChange={(event) => onChange("name", event.target.value)} />
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-700">Description</span>
        <textarea
          className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3">
        <input type="checkbox" checked={form.isActive} onChange={(event) => onChange("isActive", event.target.checked)} />
        <span className="font-semibold text-slate-700">Active</span>
      </label>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Category"}
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
