import Input from "../common/Input";

export default function SearchBar({ value, onChange }) {
  return (
    <Input
      label="Search menu"
      placeholder="Search dishes or drinks"
      value={value}
      className="min-w-0 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:text-base"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
