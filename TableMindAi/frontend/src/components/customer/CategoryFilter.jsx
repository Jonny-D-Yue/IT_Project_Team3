export default function CategoryFilter({ categories, selectedCategory, onChange }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      <button
        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${selectedCategory ? "bg-white text-slate-700" : "bg-slate-900 text-white"}`}
        onClick={() => onChange("")}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category._id}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${selectedCategory === category._id ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          onClick={() => onChange(category._id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
