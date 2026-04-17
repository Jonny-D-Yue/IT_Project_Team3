import { Link } from "react-router-dom";

import Button from "../common/Button";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/formatters";

export default function CartSummary() {
  const { itemCount, subtotal } = useCart();

  return (
    <div className="panel rounded-[28px] p-5 sm:sticky sm:top-24">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Current cart</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{itemCount} items</p>
      <p className="mt-1 text-slate-600">Subtotal {formatCurrency(subtotal)}</p>
      <Link to="/cart" className="mt-4 block">
        <Button className="w-full">Review Cart</Button>
      </Link>
    </div>
  );
}
