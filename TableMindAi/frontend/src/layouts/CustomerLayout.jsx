import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import { getRestaurantRequest } from "../api/restaurantApi";
import { useCart } from "../hooks/useCart";
import { useTable } from "../hooks/useTable";

export default function CustomerLayout() {
  const [restaurantName, setRestaurantName] = useState("TableMind AI");
  const { itemCount } = useCart();
  const { tableNumber } = useTable();

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const restaurant = await getRestaurantRequest();
        setRestaurantName(restaurant.name);
      } catch (error) {
        setRestaurantName("TableMind AI");
      }
    };

    loadRestaurant();
  }, []);

  return (
    <div className="customer-shell min-h-screen">
      <header className="sticky top-0 z-30 border-b border-amber-100 bg-white/82 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <Link to="/" className="block truncate text-base font-bold text-slate-900 sm:text-lg">
              {restaurantName}
            </Link>
            <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Mobile table ordering</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {tableNumber ? (
              <span className="hidden rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800 sm:inline-flex">
                Table {tableNumber}
              </span>
            ) : null}
            <Link to="/cart" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Cart {itemCount ? `(${itemCount})` : ""}
            </Link>
          </div>
        </div>
        {tableNumber ? (
          <div className="border-t border-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 sm:hidden">
            Table {tableNumber}
          </div>
        ) : null}
      </header>
      <main className="customer-main mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
