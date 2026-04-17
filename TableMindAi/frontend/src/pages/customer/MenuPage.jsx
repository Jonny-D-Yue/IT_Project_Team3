import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import CategoryFilter from "../../components/customer/CategoryFilter";
import SearchBar from "../../components/customer/SearchBar";
import MenuCard from "../../components/customer/MenuCard";
import CartSummary from "../../components/customer/CartSummary";
import Button from "../../components/common/Button";
import { getMenuRequest } from "../../api/menuApi";
import { getCategoriesRequest } from "../../api/categoryApi";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/formatters";

const MENU_PAGE_BATCH_SIZE = 9;

function TasteAiBubble() {
  return (
    <Link to="/assistant" className="block">
      <div className="relative overflow-hidden rounded-[32px] border border-amber-200 bg-white/90 p-5 shadow-[0_18px_38px_rgba(125,59,12,0.08)] transition hover:-translate-y-0.5">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/60 blur-2xl" />
        <div className="absolute -bottom-8 left-4 h-20 w-20 rounded-full bg-orange-200/60 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
            AI
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Need guidance?</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Ask TasteAI</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Tap here for quick dish suggestions, best sellers, and budget-friendly picks.
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MenuPage() {
  const { addItem, subtotal, itemCount } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const loadMoreRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryResponse = await getCategoriesRequest();
        setCategories(categoryResponse);
      } catch (requestError) {
        setError("Unable to load categories right now.");
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timeoutId = window.setTimeout(() => {
      const loadFirstPage = async () => {
        setLoading(true);
        setError("");

        try {
          const menuResponse = await getMenuRequest({
            page: 1,
            limit: MENU_PAGE_BATCH_SIZE,
            search: search || undefined,
            category: selectedCategory || undefined,
          });

          if (requestIdRef.current !== requestId) {
            return;
          }

          setMenuItems(menuResponse.items || []);
          setPage(menuResponse.pagination?.page || 1);
          setHasMore(Boolean(menuResponse.pagination?.hasMore));
        } catch (requestError) {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setMenuItems([]);
          setPage(1);
          setHasMore(false);
          setError("Unable to load the menu right now.");
        } finally {
          if (requestIdRef.current === requestId) {
            setLoading(false);
          }
        }
      };

      loadFirstPage();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search, selectedCategory]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading || loadingMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loadingMore) {
            setLoadingMore(true);
            setError("");
            getMenuRequest({
              page: page + 1,
              limit: MENU_PAGE_BATCH_SIZE,
              search: search || undefined,
              category: selectedCategory || undefined,
            })
              .then((menuResponse) => {
                setMenuItems((current) => [...current, ...(menuResponse.items || [])]);
                setPage(menuResponse.pagination?.page || page + 1);
                setHasMore(Boolean(menuResponse.pagination?.hasMore));
              })
              .catch(() => {
                setError("Unable to load more dishes right now.");
                setHasMore(false);
              })
              .finally(() => {
                setLoadingMore(false);
              });
          }
        });
      },
      {
        rootMargin: "240px 0px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, search, selectedCategory]);

  const hasActiveFilters = useMemo(() => Boolean(search || selectedCategory), [search, selectedCategory]);

  if (loading) {
    return <Loader label="Loading menu..." />;
  }

  return (
    <div className="space-y-6 pb-24 sm:space-y-8 sm:pb-0">
      <PageHeader
        eyebrow="Customer Menu"
        title="Browse dishes built for quick ordering"
        description="Use search, filter by category, add items to your cart, or ask the assistant what fits your mood."
        actions={
          <Link to="/cart">
            <Button className="w-full sm:w-auto">Go to Cart</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="panel rounded-[28px] p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <SearchBar value={search} onChange={setSearch} />
              </div>
              <div className="min-w-0 self-end">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <TasteAiBubble />
          </div>

          {error ? <EmptyState title="Menu unavailable" description={error} /> : null}

          {!error && !menuItems.length ? (
            <EmptyState
              title="No matching dishes"
              description="Try clearing the search or choosing another category."
              actionLabel="Show all items"
              onAction={() => {
                setSearch("");
                setSelectedCategory("");
              }}
            />
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {menuItems.map((item) => (
              <MenuCard key={item._id} item={item} onAdd={addItem} />
            ))}
          </div>

          {hasMore ? (
            <div ref={loadMoreRef} className="panel rounded-[24px] p-4 text-center text-sm text-slate-500">
              {loadingMore ? "Loading more dishes..." : "Scroll to load more dishes..."}
            </div>
          ) : menuItems.length > 0 ? (
            <div className="text-center text-sm text-slate-400">You have reached the end of the menu.</div>
          ) : null}

          {hasActiveFilters && menuItems.length > 0 ? (
            <div className="text-center text-xs uppercase tracking-[0.18em] text-slate-400">
              Showing filtered menu results from the server
            </div>
          ) : null}
        </div>

        <div className="hidden space-y-4 lg:flex lg:min-h-[calc(100vh-10rem)] lg:flex-col lg:justify-center">
          <CartSummary />
          <TasteAiBubble />
          <div className="panel rounded-[28px] p-5 text-sm leading-6 text-slate-600">
            Need help deciding? Ask the assistant for recommendations under a budget, lower calorie picks, or non-spicy options.
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-100 bg-white/92 p-4 shadow-[0_-16px_32px_rgba(125,59,12,0.08)] backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Cart</p>
            <p className="font-semibold text-slate-900">{itemCount} items | {formatCurrency(subtotal)}</p>
          </div>
          <Link to="/cart" className="min-w-36">
            <Button className="w-full">Open Cart</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
