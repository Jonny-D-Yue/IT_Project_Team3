import { useState } from "react";

import Button from "../common/Button";
import Input from "../common/Input";

export default function TableNumberForm({ onSubmit, loading, error, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className="panel space-y-5 rounded-[32px] p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(Number(value));
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Ready to join your table?</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Enter your table number</h2>
      </div>
      <Input
        label="Table number"
        placeholder="Enter your table number"
        type="number"
        min="1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={error}
      />
      <Button type="submit" className="w-full" disabled={loading || !value}>
        {loading ? "Checking table..." : "Confirm Table"}
      </Button>
    </form>
  );
}
