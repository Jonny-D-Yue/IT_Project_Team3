import { Link } from "react-router-dom";

import Button from "../../components/common/Button";
import { useTable } from "../../hooks/useTable";

export default function WelcomePage() {
  const { hasTableSession } = useTable();

  return (
    <section className="grid min-h-[calc(100vh-112px)] gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div className="rounded-[32px] border border-amber-100 bg-white/60 p-6 shadow-[0_22px_50px_rgba(125,59,12,0.07)] sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 sm:text-sm">Scan. Sit. Order smarter.</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl md:text-6xl">
          Each table QR opens the right menu session instantly.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          Scan the QR code on your table to open a table-linked session automatically, then browse the menu, ask the AI for recommendations, and send orders straight to the kitchen.
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link to={hasTableSession ? "/menu" : "/table"}>
            <Button className="w-full px-6 py-4 text-base sm:w-auto">
              {hasTableSession ? "Continue Ordering" : "How QR Ordering Works"}
            </Button>
          </Link>
          <Link to={hasTableSession ? "/assistant" : "/table"}>
            <Button variant="secondary" className="w-full px-6 py-4 text-base sm:w-auto">
              {hasTableSession ? "Open the Assistant" : "Scan a Table QR First"}
            </Button>
          </Link>
        </div>
      </div>
      <div className="panel soft-grid rounded-[40px] p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Table flow</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Built for mobile ordering</h2>
          </div>
          <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Fast lane
          </div>
        </div>
        <div className="grid gap-4">
          {[
            ["1", "Scan the QR code assigned to your table"],
            ["2", "Browse food and drinks with live availability"],
            ["3", "Ask the AI for recommendations under your budget"],
            ["4", "Place your order without waiting for a paper menu"],
          ].map(([step, label]) => (
            <div key={step} className="rounded-[28px] border border-amber-100 bg-white/90 p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 font-bold text-white shadow-[0_10px_24px_rgba(194,101,23,0.25)]">
                  {step}
                </span>
                <p className="text-base font-semibold text-slate-800">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
