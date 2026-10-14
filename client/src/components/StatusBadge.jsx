import { STATUS } from "../utils/constants";

export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.submitted;
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
  );
}