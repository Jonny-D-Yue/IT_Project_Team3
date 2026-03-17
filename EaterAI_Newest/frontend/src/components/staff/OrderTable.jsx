import { Link } from "react-router-dom";

import StatusBadge from "../common/StatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

export default function OrderTable({ orders }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-5 py-4">Time</th>
              <th className="px-5 py-4">Table</th>
              <th className="px-5 py-4">Items</th>
              <th className="px-5 py-4">Source</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Payment</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t border-slate-100 text-sm text-slate-700">
                <td className="px-5 py-4">{formatDateTime(order.createdAt)}</td>
                <td className="px-5 py-4 font-semibold">Table {order.tableNumber}</td>
                <td className="px-5 py-4">{order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.source || "CUSTOMER"} />
                </td>
                <td className="px-5 py-4 font-semibold">{formatCurrency(order.total)}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.paymentStatus || "UNPAID"} />
                </td>
                <td className="px-5 py-4">
                  <Link className="font-semibold text-amber-700" to={`/staff/orders/${order._id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
