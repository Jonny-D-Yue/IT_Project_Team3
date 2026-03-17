import { formatCurrency } from "../../utils/formatters";

export default function OrderSummary({ items, subtotal, taxRate = 0.05 }) {
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className="panel rounded-[28px] p-6 sm:sticky sm:top-24">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Kitchen summary</p>
      <h3 className="mt-2 text-xl font-bold text-slate-900">Order Summary</h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">
              {item.name} x {item.quantity}
            </span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 border-t border-amber-100 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Estimated tax</span>
          <span className="font-semibold">{formatCurrency(tax)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-bold text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
