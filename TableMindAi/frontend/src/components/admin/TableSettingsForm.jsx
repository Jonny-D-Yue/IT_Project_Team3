import Button from "../common/Button";
import Input from "../common/Input";

export default function TableSettingsForm({ form, onChange, onSubmit, submitting }) {
  return (
    <form
      className="panel max-w-3xl space-y-4 rounded-[28px] p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Restaurant name" value={form.name} onChange={(event) => onChange("name", event.target.value)} />
        <Input label="Address" value={form.address} onChange={(event) => onChange("address", event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Total tables" type="number" value={form.totalTables} onChange={(event) => onChange("totalTables", event.target.value)} />
        <Input label="Tax rate" type="number" step="0.01" value={form.taxRate} onChange={(event) => onChange("taxRate", event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Currency" value={form.currency} onChange={(event) => onChange("currency", event.target.value)} />
        <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3">
          <input type="checkbox" checked={form.isOpen} onChange={(event) => onChange("isOpen", event.target.checked)} />
          <span className="font-semibold text-slate-700">Restaurant open</span>
        </label>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Update Settings"}
      </Button>
    </form>
  );
}
