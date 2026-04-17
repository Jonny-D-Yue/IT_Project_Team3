import { ORDER_STATUSES } from "../../utils/constants";
import Button from "../common/Button";

export default function OrderStatusActions({ currentStatus, onChange, compact = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ORDER_STATUSES.map((status) => (
        <Button
          key={status}
          variant={status === currentStatus ? "primary" : "secondary"}
          className={compact ? "px-3 py-2 text-xs" : "px-3 py-2 text-sm"}
          onClick={() => onChange(status)}
        >
          {status}
        </Button>
      ))}
    </div>
  );
}
