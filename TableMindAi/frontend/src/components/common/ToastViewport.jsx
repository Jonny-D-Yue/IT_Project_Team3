const variants = {
  info: "border-slate-200 bg-white text-slate-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export default function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-[22px] border p-4 shadow-lg ${variants[toast.variant] || variants.info}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-sm opacity-80">{toast.message}</p> : null}
            </div>
            <button className="text-sm opacity-70" onClick={() => onDismiss(toast.id)}>
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
