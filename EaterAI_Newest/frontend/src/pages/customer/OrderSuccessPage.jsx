import { Link } from "react-router-dom";

import Button from "../../components/common/Button";
import { useTable } from "../../hooks/useTable";

export default function OrderSuccessPage() {
  const { tableNumber } = useTable();

  return (
    <div className="mx-auto max-w-3xl panel soft-grid rounded-[36px] p-8 text-center sm:p-12">
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[24px] bg-emerald-500 text-4xl text-white shadow-[0_16px_30px_rgba(22,163,74,0.24)]">
        ✓
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">Order sent</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Your kitchen ticket is in motion.</h1>
      <p className="mt-4 text-base text-slate-600 sm:text-lg">
        Staff can now see your order for <span className="font-bold text-slate-900">Table {tableNumber}</span>.
      </p>
      <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:justify-center">
        <Link to="/menu">
          <Button className="w-full sm:w-auto">Return to Menu</Button>
        </Link>
        <Link to="/assistant">
          <Button variant="secondary" className="w-full sm:w-auto">Ask the Assistant</Button>
        </Link>
      </div>
    </div>
  );
}
