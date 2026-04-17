import { useEffect, useMemo, useState } from "react";

import Button from "../common/Button";
import Modal from "../common/Modal";
import { formatCurrency } from "../../utils/formatters";

export default function CashCheckoutModal({
  open,
  title,
  amountDue = 0,
  confirmLabel = "Confirm Paid",
  busy = false,
  onClose,
  onConfirm,
}) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const isCashPayment = paymentMethod === "CASH";
  const numericCashReceived = Number(cashReceived || 0);
  const changeDue = useMemo(
    () => Math.max(0, Number((numericCashReceived - Number(amountDue || 0)).toFixed(2))),
    [numericCashReceived, amountDue]
  );
  const amountShort = useMemo(
    () => Math.max(0, Number((Number(amountDue || 0) - numericCashReceived).toFixed(2))),
    [numericCashReceived, amountDue]
  );

  useEffect(() => {
    if (!open) {
      setPaymentMethod("CASH");
      setCashReceived("");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm?.({
      paymentMethod,
      cashReceived: isCashPayment ? numericCashReceived : null,
      changeDue: isCashPayment ? changeDue : 0,
    });
  };

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-700">Payment method</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { value: "CASH", label: "Cash", description: "Enter cash received and auto-calculate change." },
              { value: "CARD", label: "Card", description: "Mark this bill as paid by card." },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentMethod(option.value)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  paymentMethod === option.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <p className="font-semibold">{option.label}</p>
                <p className={`mt-1 text-sm ${paymentMethod === option.value ? "text-slate-200" : "text-slate-500"}`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Amount due</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(amountDue)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{isCashPayment ? "Cash received" : "Card payment"}</p>
            {isCashPayment ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(event) => setCashReceived(event.target.value)}
                className="mt-2 w-full rounded-xl border border-amber-200 px-3 py-2 outline-none"
                placeholder="0.00"
              />
            ) : (
              <p className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900">
                Charge {formatCurrency(amountDue)} to card
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{isCashPayment ? "Change due" : "Settlement"}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(isCashPayment ? changeDue : amountDue)}</p>
            {isCashPayment ? <p className="mt-2 text-sm text-slate-500">Cash payment summary</p> : <p className="mt-2 text-sm text-slate-500">Card payment will be recorded instantly.</p>}
            {isCashPayment && amountShort > 0 ? <p className="mt-2 text-sm text-rose-600">Still short {formatCurrency(amountShort)}</p> : null}
          </div>
        </div>
        {isCashPayment ? (
          <div className="flex flex-wrap gap-2">
            {[amountDue, 100000, 200000, 500000].filter((value, index, array) => value > 0 && array.indexOf(value) === index).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCashReceived(String(value))}
                className="rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
              >
                {formatCurrency(value)}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={busy || (isCashPayment && numericCashReceived < Number(amountDue || 0))} className="flex-1">
            {busy ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
