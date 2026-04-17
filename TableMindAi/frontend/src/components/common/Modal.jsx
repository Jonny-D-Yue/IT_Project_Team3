export default function Modal({ open, title, children, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
      <div className="panel my-8 flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-[28px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button className="text-slate-500" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
