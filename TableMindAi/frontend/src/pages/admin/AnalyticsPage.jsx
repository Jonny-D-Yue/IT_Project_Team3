import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StatsCard from "../../components/admin/StatsCard";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import {
  closeBusinessDayRequest,
  getAnalyticsRequest,
  getDailyCheckoutsRequest,
  getHistoryEntriesRequest,
} from "../../api/adminApi";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";
import { exportHistoryEntriesToCsv, printHistoryReport } from "../../utils/historyExport";
import { printReceipt } from "../../utils/receiptPrinter";

const HISTORY_FILTERS = [
  { value: "day", label: "By day" },
  { value: "month", label: "By month" },
  { value: "year", label: "By year" },
];

const getDefaultPeriod = (granularity) => {
  const now = new Date();

  if (granularity === "year") {
    return String(now.getFullYear());
  }

  if (granularity === "month") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  return now.toISOString().slice(0, 10);
};

const buildPeriodLabel = (granularity, period) => {
  if (!period) {
    return "Selected period";
  }

  if (granularity === "year") {
    return `Year ${period}`;
  }

  if (granularity === "month") {
    return `Month ${period}`;
  }

  return `Day ${period}`;
};

const getPeriodPlaceholder = (granularity) => {
  if (granularity === "year") {
    return "YYYY";
  }

  if (granularity === "month") {
    return "YYYY-MM";
  }

  return "YYYY-MM-DD";
};

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [dailyCheckouts, setDailyCheckouts] = useState([]);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closingDay, setClosingDay] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [historyFilter, setHistoryFilter] = useState("day");
  const [historyPeriodInput, setHistoryPeriodInput] = useState(getDefaultPeriod("day"));
  const [historyPaymentMethod, setHistoryPaymentMethod] = useState("");
  const [historyTableNumber, setHistoryTableNumber] = useState("");
  const [historyReceiptNumber, setHistoryReceiptNumber] = useState("");
  const [historyItemKeyword, setHistoryItemKeyword] = useState("");
  const [historyAmountMin, setHistoryAmountMin] = useState("");
  const [historyAmountMax, setHistoryAmountMax] = useState("");
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null);

  const loadAnalytics = async () => {
    const [analyticsResponse, dailyCheckoutsResponse] = await Promise.all([
      getAnalyticsRequest(),
      getDailyCheckoutsRequest(),
    ]);
    setAnalytics(analyticsResponse);
    setDailyCheckouts(dailyCheckoutsResponse);
  };

  const loadHistory = async ({ append = false, period = historyPeriodInput, granularity = historyFilter, page = 1 } = {}) => {
    setLoadingHistory(true);

    try {
      const response = await getHistoryEntriesRequest({
        granularity,
        period,
        page,
        limit: 12,
        paymentMethod: historyPaymentMethod || undefined,
        tableNumber: historyTableNumber || undefined,
        receiptNumber: historyReceiptNumber || undefined,
        itemKeyword: historyItemKeyword || undefined,
        amountMin: historyAmountMin || undefined,
        amountMax: historyAmountMax || undefined,
      });

      setHistoryData((current) => {
        if (!append || !current) {
          return response;
        }

        return {
          ...response,
          entries: [...current.entries, ...response.entries],
        };
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([loadAnalytics(), loadHistory({ period: getDefaultPeriod("day"), granularity: "day" })]);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleCloseDay = async () => {
    setClosingDay(true);

    try {
      await closeBusinessDayRequest({
        businessDate: analytics?.dailyCheckoutPreview?.businessDate,
        notes: checkoutNotes,
      });
      setCheckoutNotes("");
      await Promise.all([loadAnalytics(), loadHistory({ period: historyPeriodInput, granularity: historyFilter })]);
      showToast({
        title: "Business day closed",
        message: `Checkout for ${analytics?.dailyCheckoutPreview?.businessDate} has been archived into history.`,
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Close day failed",
        message: getApiErrorMessage(error, "Unable to close this business day."),
        variant: "error",
      });
    } finally {
      setClosingDay(false);
    }
  };

  const handleApplyHistoryFilter = async () => {
    try {
      await loadHistory({ period: historyPeriodInput, granularity: historyFilter, page: 1 });
    } catch (error) {
      showToast({
        title: "History load failed",
        message: getApiErrorMessage(error, "Unable to load archived history."),
        variant: "error",
      });
    }
  };

  const handleLoadMoreHistory = async () => {
    if (!historyData?.pagination?.hasMore || loadingHistory) {
      return;
    }

    try {
      await loadHistory({
        append: true,
        period: historyData.filters.period,
        granularity: historyData.filters.granularity,
        page: historyData.pagination.page + 1,
      });
    } catch (error) {
      showToast({
        title: "Load more failed",
        message: getApiErrorMessage(error, "Unable to load more history."),
        variant: "error",
      });
    }
  };

  const handleExportHistory = () => {
    exportHistoryEntriesToCsv({
      periodLabel: buildPeriodLabel(historyFilter, historyData?.filters?.period),
      entries: historyData?.entries || [],
    });
  };

  const handlePrintHistory = () => {
    const printed = printHistoryReport({
      periodLabel: buildPeriodLabel(historyFilter, historyData?.filters?.period),
      summary: historyData?.summary,
      entries: historyData?.entries || [],
    });

    if (!printed) {
      showToast({
        title: "Print blocked",
        message: "Allow popups in the browser to print the billing report.",
        variant: "error",
      });
    }
  };

  const handleReprintBill = () => {
    if (!selectedHistoryEntry) {
      return;
    }

    const printed = printReceipt({
      title: `Table ${selectedHistoryEntry.tableNumber} Bill`,
      subtitle: `Reprinted ${formatDateTime(new Date())}`,
      items: (selectedHistoryEntry.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        total: item.lineTotal || 0,
        note: item.note || "",
      })),
      total: selectedHistoryEntry.total,
      receiptNumber: selectedHistoryEntry.receiptNumber,
      receiptDate: selectedHistoryEntry.receiptDate,
      paymentMethod: selectedHistoryEntry.paymentMethod,
      footerNote: "History reprint",
    });

    if (!printed) {
      showToast({
        title: "Print blocked",
        message: "Allow popups in the browser to print this bill.",
        variant: "error",
      });
    }
  };

  if (loading) {
    return <Loader label="Loading analytics..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Operations, archive, and day-end history"
        description="Daily checkout archives old paid data. Dashboard stays light, while detailed bills remain searchable here by day, month, and year."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Orders" value={analytics?.totalOrders || 0} />
        <StatsCard label="Orders Today" value={analytics?.ordersToday || 0} />
        <StatsCard label="Revenue Estimate" value={formatCurrency(analytics?.revenueEstimate || 0)} />
        <StatsCard label="Statuses" value={analytics?.ordersByStatus?.length || 0} hint="Active status buckets" />
      </div>
      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Billing control</h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep live bills small and actionable. Use this section to see what still needs collection before running day-end checkout.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" to="/staff/dashboard">
              Open Live Bills
            </Link>
            <Button onClick={handleCloseDay} disabled={closingDay || analytics?.dailyCheckoutPreview?.alreadyClosed}>
              {closingDay ? "Checking out..." : "Checkout Entire Day"}
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Open tables</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.billingControl?.openTablesCount || 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Open bills</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.billingControl?.openBillsCount || 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Outstanding amount</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(analytics?.billingControl?.outstandingAmount || 0)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Paid today</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatCurrency((analytics?.billingControl?.paidTodayCash || 0) + (analytics?.billingControl?.paidTodayCard || 0))}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl bg-slate-50 p-5">
            <h3 className="text-lg font-bold text-slate-900">Payment mix today</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <span className="font-semibold text-slate-900">Cash</span>
                <span className="text-slate-700">{formatCurrency(analytics?.billingControl?.paidTodayCash || 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <span className="font-semibold text-slate-900">Card</span>
                <span className="text-slate-700">{formatCurrency(analytics?.billingControl?.paidTodayCard || 0)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tables needing checkout</h3>
                <p className="mt-1 text-sm text-slate-500">Highest unpaid tables first so staff can clear the floor faster.</p>
              </div>
              <Link className="text-sm font-semibold text-amber-700" to="/staff/dashboard">
                Open floor
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {(analytics?.billingControl?.pendingTables || []).map((table) => (
                <Link key={table.tableNumber} to={`/staff/tables/${table.tableNumber}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">Table {table.tableNumber}</p>
                    <p className="text-sm text-slate-500">
                      {table.unpaidOrdersCount} open orders | {table.oldestOpenOrderHours}h waiting
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900">{formatCurrency(table.unpaidTotal || 0)}</span>
                    <p className="text-xs text-amber-700">Priority {table.urgencyScore}</p>
                  </div>
                </Link>
              ))}
              {!(analytics?.billingControl?.pendingTables || []).length ? <p className="text-sm text-slate-500">No live unpaid table right now.</p> : null}
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daily checkout</h2>
              <p className="mt-1 text-sm text-slate-500">
                When you close the day, all paid bills for that day are archived into history so the active dashboard stays clean.
              </p>
            </div>
            <StatusBadge status={analytics?.dailyCheckoutPreview?.alreadyClosed ? "PAID" : "UNPAID"} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Business date</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics?.dailyCheckoutPreview?.businessDate}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Paid revenue today</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(analytics?.dailyCheckoutPreview?.paidRevenue || 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Paid orders</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics?.dailyCheckoutPreview?.paidOrdersCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Paid split bills</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics?.dailyCheckoutPreview?.splitBillsPaidCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Settled tables</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics?.dailyCheckoutPreview?.settledTablesCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Unpaid orders still open</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics?.dailyCheckoutPreview?.unpaidOrdersCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Bills issued today</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{analytics?.dailyCheckoutPreview?.billsIssuedCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Cash received</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(analytics?.dailyCheckoutPreview?.cashReceivedTotal || 0)}
              </p>
            </div>
          </div>
          {analytics?.dailyCheckoutPreview?.alreadyClosed ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Closed at {formatDateTime(analytics.dailyCheckoutPreview.closedCheckout?.closedAt)} by{" "}
              {analytics.dailyCheckoutPreview.closedCheckout?.closedBy?.name || analytics.dailyCheckoutPreview.closedCheckout?.closedBy?.email}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <textarea
                rows="3"
                value={checkoutNotes}
                onChange={(event) => setCheckoutNotes(event.target.value)}
                className="w-full rounded-2xl border border-amber-200 px-4 py-3 outline-none"
                placeholder="Optional close-day note, e.g. cash counted and fridge checked"
              />
            </div>
          )}
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Recent day-end checkouts</h2>
          <div className="mt-4 space-y-3">
            {dailyCheckouts.map((checkout) => (
              <button
                key={checkout._id}
                type="button"
                onClick={() => {
                  setHistoryFilter("day");
                  setHistoryPeriodInput(checkout.businessDate);
                  loadHistory({ granularity: "day", period: checkout.businessDate, page: 1 });
                }}
                className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{checkout.businessDate}</p>
                    <p className="text-sm text-slate-500">
                      Closed {formatDateTime(checkout.closedAt)} by {checkout.closedBy?.name || checkout.closedBy?.email}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(checkout.paidRevenue || 0)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <span>Paid orders: {checkout.paidOrdersCount}</span>
                  <span>Unpaid open: {checkout.unpaidOrdersCount}</span>
                  <span>Settled tables: {checkout.settledTablesCount}</span>
                  <span>Paid splits: {checkout.splitBillsPaidCount}</span>
                </div>
              </button>
            ))}
            {!dailyCheckouts.length ? <p className="text-sm text-slate-500">No day-end checkout has been saved yet.</p> : null}
          </div>
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Most Ordered Items</h2>
          <div className="mt-4 space-y-3">
            {(analytics?.mostOrderedItems || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-900">{item.name}</span>
                <span className="text-slate-600">{item.orderedQuantity} ordered</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Orders by Status</h2>
          <div className="mt-4 space-y-3">
            {(analytics?.ordersByStatus || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-900">{item._id}</span>
                <span className="text-slate-600">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Archived history</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search archived bills by day, month, or year. Click a period to inspect each paid order and bill in detail.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HISTORY_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const nextPeriod = getDefaultPeriod(option.value);
                  setHistoryFilter(option.value);
                  setHistoryPeriodInput(nextPeriod);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  historyFilter === option.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap gap-3">
            <input
              type={historyFilter === "year" ? "number" : "text"}
              inputMode="numeric"
              pattern={historyFilter === "day" ? "\\d{4}-\\d{2}-\\d{2}" : historyFilter === "month" ? "\\d{4}-\\d{2}" : "\\d{4}"}
              min={historyFilter === "year" ? "2000" : undefined}
              max={historyFilter === "year" ? "2100" : undefined}
              value={historyPeriodInput}
              onChange={(event) => setHistoryPeriodInput(event.target.value)}
              placeholder={getPeriodPlaceholder(historyFilter)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <select
              value={historyPaymentMethod}
              onChange={(event) => setHistoryPaymentMethod(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option value="">All methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
            </select>
            <input
              type="number"
              min="1"
              value={historyTableNumber}
              onChange={(event) => setHistoryTableNumber(event.target.value)}
              placeholder="Table #"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <input
              type="number"
              min="1"
              value={historyReceiptNumber}
              onChange={(event) => setHistoryReceiptNumber(event.target.value)}
              placeholder="Receipt #"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <input
              type="text"
              value={historyItemKeyword}
              onChange={(event) => setHistoryItemKeyword(event.target.value)}
              placeholder="Item name"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={historyAmountMin}
              onChange={(event) => setHistoryAmountMin(event.target.value)}
              placeholder="Min amount"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={historyAmountMax}
              onChange={(event) => setHistoryAmountMax(event.target.value)}
              placeholder="Max amount"
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <Button onClick={handleApplyHistoryFilter} disabled={loadingHistory}>
              {loadingHistory ? "Loading..." : "Load History"}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">Archive entries</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{historyData?.overview?.totals?.entriesCount || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">Archived revenue</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(historyData?.overview?.totals?.revenue || 0)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">Current selection</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(historyData?.summary?.revenue || 0)}
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Use English date format: <span className="font-semibold text-slate-700">{getPeriodPlaceholder(historyFilter)}</span>
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(historyData?.overview?.buckets || []).map((bucket) => (
            <button
              key={bucket.period}
              type="button"
              onClick={() => {
                setHistoryPeriodInput(bucket.period);
                loadHistory({ granularity: historyFilter, period: bucket.period, page: 1 });
              }}
              className={`rounded-2xl border px-4 py-4 text-left ${
                historyData?.filters?.period === bucket.period ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className={`text-sm ${historyData?.filters?.period === bucket.period ? "text-slate-200" : "text-slate-500"}`}>
                {bucket.period}
              </p>
              <p className="mt-1 text-lg font-bold">{formatCurrency(bucket.revenue || 0)}</p>
              <p className={`mt-1 text-sm ${historyData?.filters?.period === bucket.period ? "text-slate-200" : "text-slate-600"}`}>
                {bucket.entriesCount} archived bills
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{buildPeriodLabel(historyFilter, historyData?.filters?.period)}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {historyData?.pagination?.totalEntries || 0} archived bills in this period.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Loaded</p>
                <p className="font-semibold text-slate-900">{historyData?.summary?.entriesCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Orders</p>
                <p className="font-semibold text-slate-900">{historyData?.summary?.orderCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Split bills</p>
                <p className="font-semibold text-slate-900">{historyData?.summary?.splitBillCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handlePrintHistory} disabled={!historyData?.entries?.length}>
            Print Period Report
          </Button>
          <Button variant="secondary" onClick={handleExportHistory} disabled={!historyData?.entries?.length}>
            Export CSV
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {(historyData?.entries || []).map((entry) => (
            <article key={entry._id} className="rounded-[24px] border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={entry.sourceType} />
                    <StatusBadge status={entry.sourceBucket || "ARCHIVED"} />
                    <StatusBadge status="PAID" />
                    {entry.paymentMethod ? <StatusBadge status={entry.paymentMethod} /> : null}
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-slate-900">Table {entry.tableNumber}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Paid {formatDateTime(entry.paidAt)}
                    {entry.receiptNumber ? ` | Bill #${String(entry.receiptNumber).padStart(3, "0")}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(entry.total)}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.itemCount} items</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setSelectedHistoryEntry(entry)}>
                  View Details
                </Button>
              </div>
            </article>
          ))}

          {!historyData?.entries?.length ? <p className="text-sm text-slate-500">No archived history found for this period yet.</p> : null}
        </div>

        {historyData?.pagination?.hasMore ? (
          <div className="mt-5">
            <Button onClick={handleLoadMoreHistory} disabled={loadingHistory} className="w-full">
              {loadingHistory ? "Loading more..." : "Load More History"}
            </Button>
          </div>
        ) : null}
      </section>
      <Modal open={Boolean(selectedHistoryEntry)} title={selectedHistoryEntry ? `Bill details for table ${selectedHistoryEntry.tableNumber}` : "Bill details"} onClose={() => setSelectedHistoryEntry(null)}>
        {selectedHistoryEntry ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selectedHistoryEntry.sourceType} />
              <StatusBadge status={selectedHistoryEntry.sourceBucket || "ARCHIVED"} />
              <StatusBadge status="PAID" />
              {selectedHistoryEntry.paymentMethod ? <StatusBadge status={selectedHistoryEntry.paymentMethod} /> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Paid at</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedHistoryEntry.paidAt)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Receipt</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedHistoryEntry.receiptNumber ? String(selectedHistoryEntry.receiptNumber).padStart(3, "0") : "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {selectedHistoryEntry.items.map((item, index) => (
                <div key={`${selectedHistoryEntry._id}-${index}`} className="flex justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    {item.note ? <p className="mt-1 text-xs text-slate-500">Note: {item.note}</p> : null}
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.lineTotal || 0)}</span>
                </div>
              ))}
            </div>
            {selectedHistoryEntry.notes ? <p className="rounded-2xl bg-amber-50 p-4 text-sm text-slate-700">Note: {selectedHistoryEntry.notes}</p> : null}
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(selectedHistoryEntry.total || 0)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleReprintBill} className="flex-1">
                Reprint Bill
              </Button>
              <Button onClick={() => setSelectedHistoryEntry(null)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
