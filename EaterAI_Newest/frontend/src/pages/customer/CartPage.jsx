import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/formatters";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, updateNote, subtotal } = useCart();

  if (!items.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add a few dishes from the menu before checking out."
        actionLabel="Browse Menu"
        onAction={() => navigate("/menu")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cart"
        title="Review your order before checkout"
        description="Adjust quantities, add item notes, and keep the kitchen instructions clear."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="panel rounded-[28px] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="rounded-full bg-amber-100 px-3 py-2 font-bold" onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                    -
                  </button>
                  <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                  <button className="rounded-full bg-amber-100 px-3 py-2 font-bold" onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
              <textarea
                className="mt-4 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 outline-none"
                placeholder="Optional note for this item"
                value={item.note}
                onChange={(event) => updateNote(item._id, event.target.value)}
              />
              <div className="mt-4 flex items-center justify-between">
                <button className="text-sm font-semibold text-red-600" onClick={() => removeItem(item._id)}>
                  Remove
                </button>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel rounded-[28px] p-6 sm:sticky sm:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Checkout lane</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{formatCurrency(subtotal)}</p>
          <p className="mt-2 text-sm text-slate-500">Tax will be calculated at checkout.</p>
          <div className="mt-6 space-y-3">
            <Link to="/checkout" className="block">
              <Button className="w-full">Continue to Checkout</Button>
            </Link>
            <Link to="/menu" className="block">
              <Button variant="secondary" className="w-full">
                Add More Items
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-100 bg-white/95 p-4 shadow-[0_-14px_28px_rgba(125,59,12,0.08)] backdrop-blur sm:hidden">
        <Link to="/checkout">
          <Button className="w-full">Continue to Checkout · {formatCurrency(subtotal)}</Button>
        </Link>
      </div>
    </div>
  );
}
