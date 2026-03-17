import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AiMenuImportPanel from "../../components/admin/AiMenuImportPanel";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import StatsCard from "../../components/admin/StatsCard";
import { getAnalyticsRequest } from "../../api/adminApi";
import { getCategoriesRequest } from "../../api/categoryApi";
import { getOrdersRequest, getTableOverviewRequest } from "../../api/orderApi";
import { useSocket } from "../../hooks/useSocket";
import { useToast } from "../../hooks/useToast";
import { formatCurrency } from "../../utils/formatters";

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tableOverview, setTableOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    const [analyticsResponse, ordersResponse, categoryResponse, tableOverviewResponse] = await Promise.all([
      getAnalyticsRequest(),
      getOrdersRequest(),
      getCategoriesRequest(),
      getTableOverviewRequest(),
    ]);
    setAnalytics(analyticsResponse);
    setRecentOrders(ordersResponse.slice(0, 5));
    setCategories(categoryResponse);
    setTableOverview(tableOverviewResponse);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadDashboard();
      } catch (error) {
        showToast({
          title: "Dashboard unavailable",
          message: "Unable to load dashboard data right now.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useSocket({
    enabled: true,
    events: {
      new_order: () => loadDashboard(),
      order_updated: () => loadDashboard(),
      order_payment_updated: () => loadDashboard(),
      table_payment_updated: () => loadDashboard(),
      table_overview_updated: () => loadDashboard(),
      table_moved: () => loadDashboard(),
      split_bill_updated: () => loadDashboard(),
    },
  });

  if (loading) {
    return <Loader label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Restaurant control at a glance"
        description="Track business metrics and stay tied into the live floor, kitchen, and table state."
        actions={
          <>
            <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" to="/admin/menu">
              Manage Menu
            </Link>
            <Link className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white" to="/staff/dashboard">
              Open Live Floor
            </Link>
            <Link className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700" to="/admin/analytics">
              View Analytics
            </Link>
            <Link className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" to="/admin/analytics">
              Checkout Entire Day
            </Link>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Orders" value={analytics?.totalOrders || 0} />
        <StatsCard label="Orders Today" value={analytics?.ordersToday || 0} />
        <StatsCard label="Revenue" value={formatCurrency(analytics?.revenueEstimate || 0)} />
        <StatsCard label="Top Items" value={analytics?.mostOrderedItems?.length || 0} hint="Current top-selling menu items" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Open Tables" value={analytics?.billingControl?.openTablesCount || 0} />
        <StatsCard label="Open Bills" value={analytics?.billingControl?.openBillsCount || 0} />
        <StatsCard label="Outstanding" value={formatCurrency(analytics?.billingControl?.outstandingAmount || 0)} />
        <StatsCard
          label="Paid Today"
          value={formatCurrency((analytics?.billingControl?.paidTodayCash || 0) + (analytics?.billingControl?.paidTodayCard || 0))}
        />
      </div>
      <div className="rounded-[28px] border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">Recent Orders</h2>
        <div className="mt-4 space-y-3">
          {recentOrders.map((order) => (
            <div
              key={order._id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                order.source === "WAITER" ? "border border-orange-200 bg-orange-50" : "bg-slate-50"
              }`}
            >
              <div>
                <p className="font-semibold text-slate-900">Table {order.tableNumber}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <StatusBadge status={order.source || "CUSTOMER"} />
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <span className="font-semibold text-slate-900">{formatCurrency(order.total)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Live Operations</h2>
              <p className="mt-1 text-sm text-slate-500">The same table state that staff sees, available directly in admin.</p>
            </div>
            <div className="flex gap-3">
              <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" to="/staff/dashboard">
                Staff Console
              </Link>
              <Link className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700" to="/staff/kitchen">
                Kitchen
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Occupied tables</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{tableOverview?.summary?.occupiedTables || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Awaiting payment</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{tableOverview?.summary?.awaitingPaymentTables || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Open bills</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{tableOverview?.summary?.openBills || 0}</p>
            </div>
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Critical Tables</h2>
              <p className="mt-1 text-sm text-slate-500">Jump into the tables that still have active bills.</p>
            </div>
            <Link className="text-sm font-semibold text-amber-700" to="/staff/dashboard">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(tableOverview?.tables || [])
              .filter((table) => table.tableStatus !== "EMPTY")
              .slice(0, 5)
              .map((table) => (
                <Link
                  key={table.tableNumber}
                  to={`/staff/tables/${table.tableNumber}`}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                    table.paymentStatus === "UNPAID" ? "border border-amber-200 bg-amber-50" : "bg-slate-50"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">Table {table.tableNumber}</p>
                    <p className="text-sm text-slate-500">
                      {table.tableStatus} · {table.paymentStatus}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(table.unpaidTotal || 0)}</span>
                </Link>
              ))}
          </div>
        </section>
      </div>
      <AiMenuImportPanel categories={categories} onCreated={loadDashboard} showToast={showToast} />
    </div>
  );
}
