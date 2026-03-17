export default function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block min-w-0 space-y-2">
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <input
        className={`w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500 focus:bg-amber-50/30 ${className}`}
        {...props}
      />
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
