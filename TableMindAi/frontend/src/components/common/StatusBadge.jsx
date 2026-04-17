const styles = {
  NEW: "bg-sky-100 text-sky-700",
  PREPARING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  SERVED: "bg-slate-200 text-slate-700",
  UNPAID: "bg-rose-100 text-rose-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  EMPTY: "bg-slate-100 text-slate-600",
  OCCUPIED: "bg-sky-100 text-sky-700",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
  NO_BILL: "bg-slate-100 text-slate-500",
  OPEN: "bg-sky-100 text-sky-700",
  VOID: "bg-slate-100 text-slate-500",
  CUSTOMER: "bg-violet-100 text-violet-700",
  WAITER: "bg-orange-100 text-orange-700",
  CASH: "bg-emerald-100 text-emerald-700",
  CARD: "bg-sky-100 text-sky-700",
  ORDER: "bg-slate-900 text-white",
  SPLIT_BILL: "bg-amber-100 text-amber-700",
  LIVE: "bg-violet-100 text-violet-700",
  ARCHIVED: "bg-slate-200 text-slate-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status] || styles.NEW}`}>
      {status}
    </span>
  );
}
