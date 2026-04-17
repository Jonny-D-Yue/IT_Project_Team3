import { Link } from "react-router-dom";

import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

export default function TableOverviewCard({ table, onMarkPaid }) {
  const isEmptyTable = table.tableStatus === "EMPTY";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Table</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{table.tableNumber}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={table.tableStatus} />
          <StatusBadge status={table.paymentStatus} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-slate-500">Active sessions</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{table.activeSessionCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-slate-500">Open bill</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(table.unpaidTotal)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>
          Open orders: <span className="font-semibold text-slate-900">{table.unpaidOrdersCount}</span>
        </p>
        <p>
          Paid orders: <span className="font-semibold text-slate-900">{table.paidOrdersCount}</span>
        </p>
        <p>
          Latest activity: <span className="font-semibold text-slate-900">{formatDateTime(table.latestOrderAt)}</span>
        </p>
      </div>

      {table.recentOrders?.length ? (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Recent tickets</p>
          <div className="mt-2 space-y-2">
            {table.recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between gap-3">
                <span>
                  {formatDateTime(order.createdAt)} · {order.itemCount} items
                </span>
                <span className="font-semibold">{formatCurrency(order.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          onClick={() => onMarkPaid(table.tableNumber)}
          disabled={table.paymentStatus !== "UNPAID"}
          className="flex-1"
        >
          Mark Table Paid
        </Button>
        {!isEmptyTable ? (
          <Button variant="secondary" onClick={() => table.onQuickPrint?.(table.tableNumber)} className="flex-1">
            Quick Print
          </Button>
        ) : null}
        <Link
          to={`/staff/tables/${table.tableNumber}`}
          className={`inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 font-semibold ${
            isEmptyTable
              ? "bg-slate-900 text-white"
              : "border border-amber-200 bg-white text-slate-900"
          }`}
        >
          {isEmptyTable ? "Open Empty Table" : "Open Table"}
        </Link>
      </div>
    </div>
  );
}
