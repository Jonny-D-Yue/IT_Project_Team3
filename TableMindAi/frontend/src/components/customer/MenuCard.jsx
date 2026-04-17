import Button from "../common/Button";
import { formatCurrency } from "../../utils/formatters";

export default function MenuCard({ item, onAdd }) {
  return (
    <article className="panel overflow-hidden rounded-[28px]">
      <img
        src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
        alt={item.name}
        className="h-44 w-full object-cover sm:h-48"
      />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.category?.name || "Menu item"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.isBestSeller ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Best Seller
                </span>
              ) : null}
              {item.isOwnerPick ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                  Owner Pick
                </span>
              ) : null}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
            {item.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{item.description}</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(item.price)}</p>
            <p className="text-xs text-slate-500">{item.calories ? `${item.calories} cal` : "Calories not listed"}</p>
          </div>
          <Button onClick={() => onAdd(item)} disabled={!item.isAvailable} className="shrink-0">
            Add to Cart
          </Button>
        </div>
      </div>
    </article>
  );
}
