export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] hover:bg-slate-800",
    secondary: "bg-white text-slate-900 border border-amber-200 hover:bg-amber-50",
    ghost: "bg-transparent text-slate-700 hover:bg-white/80",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
