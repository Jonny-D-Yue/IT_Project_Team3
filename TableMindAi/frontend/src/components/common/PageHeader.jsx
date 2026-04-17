export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 sm:text-sm">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3 md:justify-end">{actions}</div> : null}
    </div>
  );
}
