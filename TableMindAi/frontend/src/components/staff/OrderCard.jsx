import { Link } from "react-router-dom";

import StatusBadge from "../common/StatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

export default function OrderCard({ order, footer }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{formatDateTime(order.createdAt)}</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Table {order.tableNumber}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={order.source || "CUSTOMER"} />
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus || "UNPAID"} />
        </div>
      </div>
      {order.source === "WAITER" ? (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
          Waiter ticket: this order was entered directly by staff at the table.
        </div>
      ) : null}
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {order.items.map((item) => (
          <div key={`${order._id}-${item.menuItemId}`} className="flex items-center justify-between">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="font-semibold text-slate-900">{formatCurrency(order.total)}</span>
        <Link to={`/staff/orders/${order._id}`} className="text-sm font-semibold text-amber-700">
          Open order
        </Link>
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
