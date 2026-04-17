import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import { useTable } from "../../hooks/useTable";

export default function EnterTablePage() {
  const navigate = useNavigate();
  const { hasTableSession, tableNumber } = useTable();

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_420px] lg:gap-8">
      <div className="space-y-4 rounded-[32px] border border-amber-100 bg-white/70 p-6 shadow-[0_20px_44px_rgba(125,59,12,0.06)] sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <PageHeader
          eyebrow="QR Check-In"
          title="Scan the QR code on your table to begin"
          description="Customers no longer enter table numbers manually. Each table QR opens a secure session for the correct restaurant and table automatically."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Each table now has its own QR code",
            "The scan URL includes restaurant and table details",
            "Validation runs before the session is created",
            "Orders and AI chat stay tied to the scanned table",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
        {hasTableSession ? (
          <div className="panel rounded-[28px] p-5 text-slate-700">
            Active session detected for <span className="font-bold text-slate-900">Table {tableNumber}</span>. You can continue ordering without scanning again.
          </div>
        ) : null}
      </div>
      <div className="rounded-[32px] border border-amber-100 bg-white p-6 shadow-[0_18px_40px_rgba(125,59,12,0.08)] sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900">What to scan</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Ask the customer to scan the QR code printed on the table. The QR should point to a URL like
          <span className="font-semibold text-slate-900"> `/scan/:restaurantId/:tableNumber`</span>.
        </p>
        <div className="mt-6 grid gap-3">
          <Button className="w-full" onClick={() => navigate(hasTableSession ? "/menu" : "/")}>
            {hasTableSession ? "Continue to Menu" : "Back to Welcome"}
          </Button>
          {hasTableSession ? (
            <Link to="/assistant">
              <Button variant="secondary" className="w-full">Open Assistant</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
