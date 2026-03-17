import OrderStatusActions from "./OrderStatusActions";
import StatusBadge from "../common/StatusBadge";
import { formatDateTime } from "../../utils/formatters";

export default function KitchenTableGroupCard({ group, onUpdateOrderStatus }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Latest ticket {formatDateTime(group.latestCreatedAt)}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Table {group.tableNumber}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {group.statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Merged kitchen ticket</p>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {group.mergedItems.map((item) => (
            <div key={`${group.tableNumber}-${item.name}`} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {item.name} x {item.quantity}
                </p>
                {item.notes.length ? <p className="text-xs text-slate-500">Notes: {item.notes.join(" | ")}</p> : null}
              </div>
              <span className="text-xs uppercase tracking-[0.15em] text-slate-500">{item.orderCount} tickets</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {group.orders.map((order) => (
          <div
            key={order._id}
            className={`rounded-2xl border p-4 ${
              order.source === "WAITER" ? "border-orange-300 bg-orange-50/70" : "border-slate-200"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{order.items.length} items</p>
                  <StatusBadge status={order.source || "CUSTOMER"} />
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>
            {order.source === "WAITER" ? (
              <p className="mb-3 text-sm font-semibold text-orange-700">Waiter-entered order</p>
            ) : null}
            <OrderStatusActions currentStatus={order.status} onChange={(status) => onUpdateOrderStatus(order._id, status)} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
