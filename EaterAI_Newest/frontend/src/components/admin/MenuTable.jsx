import { formatCurrency } from "../../utils/formatters";
import Button from "../common/Button";

export default function MenuTable({ items, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Availability</th>
              <th className="px-5 py-4">Highlights</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold text-slate-900">{item.name}</td>
                <td className="px-5 py-4 text-slate-600">{item.category?.name}</td>
                <td className="px-5 py-4">{formatCurrency(item.price)}</td>
                <td className="px-5 py-4">{item.isAvailable ? "Available" : "Unavailable"}</td>
                <td className="px-5 py-4">
                  {item.isOwnerPick ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                      Owner Pick
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => onEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => onDelete(item)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
