import Button from "../common/Button";

export default function CategoryTable({ categories, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold text-slate-900">{category.name}</td>
                <td className="px-5 py-4 text-slate-600">{category.description}</td>
                <td className="px-5 py-4">{category.isActive ? "Active" : "Inactive"}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => onEdit(category)}>
                      Edit
                    </Button>
                    <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => onDelete(category)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
