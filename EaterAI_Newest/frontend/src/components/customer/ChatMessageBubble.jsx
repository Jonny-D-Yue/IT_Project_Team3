import { Link } from "react-router-dom";
import { useState } from "react";

import Button from "../common/Button";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/formatters";

export default function ChatMessageBubble({ message, onAddToCart }) {
  const isAssistant = message.role === "assistant";
  const { items: cartItems } = useCart();
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState({});

  const getQuantity = (itemKey) => quantities[itemKey] || 1;
  const getNote = (itemKey) => notes[itemKey] || "";
  const isInCart = (itemId) => cartItems.some((cartItem) => cartItem._id === itemId);
  const updateQuantity = (itemKey, delta) =>
    setQuantities((current) => ({
      ...current,
      [itemKey]: Math.max(1, (current[itemKey] || 1) + delta),
    }));
  const updateNote = (itemKey, value) =>
    setNotes((current) => ({
      ...current,
      [itemKey]: value,
    }));
  const handleAddOne = (item) => {
    onAddToCart?.(item, getQuantity(item._id || item.name), getNote(item._id || item.name));
  };
  const handleAddAll = () => {
    message.recommendedItems.slice(0, 3).forEach((item) => {
      const itemKey = item._id || item.name;
      onAddToCart?.(item, getQuantity(itemKey), getNote(itemKey));
    });
  };

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-[24px] px-4 py-3 text-sm leading-6 ${
          isAssistant ? "bg-white text-slate-800" : "bg-slate-900 text-white"
        }`}
      >
        {message.content}
        {isAssistant && message.recommendedItems?.length ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recommended for you</p>
              <button
                type="button"
                className="text-xs font-semibold text-amber-700"
                onClick={handleAddAll}
              >
                Add all
              </button>
            </div>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {message.recommendedItems.slice(0, 3).map((item) => (
                <div
                  key={item._id || item.name}
                  className="w-[280px] shrink-0 overflow-hidden rounded-[24px] border border-amber-200 bg-white"
                >
                <div className="flex items-stretch gap-0">
                  <div className="flex min-w-0 gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-24 object-cover"
                      />
                    ) : (
                      <div className="flex w-24 items-center justify-center bg-amber-100 text-2xl font-bold text-amber-700">
                        {item.name?.charAt(0) || "M"}
                      </div>
                    )}
                    <div className="min-w-0 p-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.category || "Menu item"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.isBestSeller ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                            Best Seller
                          </span>
                        ) : null}
                        {item.isOwnerPick ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                            Owner Pick
                          </span>
                        ) : null}
                      </div>
                      {item.description ? <p className="mt-2 text-xs text-slate-500">{item.description}</p> : null}
                      <div className="mt-3 flex items-center gap-2">
                        <p className="text-sm font-semibold text-amber-700">{formatCurrency(item.price)}</p>
                        {item.calories ? <span className="text-xs text-slate-400">{item.calories} cal</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto flex w-40 shrink-0 flex-col items-end gap-2 p-3">
                    <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1">
                      <button
                        type="button"
                        className="h-7 w-7 rounded-full bg-slate-100 font-bold text-slate-700"
                        onClick={() => updateQuantity(item._id || item.name, -1)}
                      >
                        -
                      </button>
                      <span className="min-w-5 text-center text-xs font-semibold text-slate-900">
                        {getQuantity(item._id || item.name)}
                      </span>
                      <button
                        type="button"
                        className="h-7 w-7 rounded-full bg-slate-900 font-bold text-white"
                        onClick={() => updateQuantity(item._id || item.name, 1)}
                      >
                        +
                      </button>
                    </div>
                    <Button
                      className="shrink-0"
                      onClick={() => handleAddOne(item)}
                      disabled={!item._id || item.isAvailable === false}
                    >
                      {isInCart(item._id) ? "Added" : "Add to cart"}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-amber-100 bg-amber-50/60 p-3">
                  <input
                    type="text"
                    value={getNote(item._id || item.name)}
                    onChange={(event) => updateNote(item._id || item.name, event.target.value)}
                    className="w-full rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs outline-none"
                    placeholder="Optional note, e.g. less spicy"
                  />
                </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Link to="/cart" className="text-xs font-semibold text-amber-700">
                View cart
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
