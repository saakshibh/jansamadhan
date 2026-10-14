import StatusBadge from "./StatusBadge";

const dots = {
  submitted: "bg-amber-500",
  assigned: "bg-sky-500",
  in_progress: "bg-violet-500",
  resolved: "bg-emerald-500",
  rejected: "bg-red-500",
};

export default function Timeline({ history = [] }) {
  const items = [...history].reverse();

  return (
    <ol className="relative ml-2 space-y-6 border-l-2 border-slate-200 pl-6 dark:border-slate-700">
      {items.map((h, i) => (
        <li key={i} className="relative">
          <span
            className={`absolute -left-[33px] top-1.5 h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-900 ${
              dots[h.status] || "bg-slate-400"
            }`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={h.status} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(h.at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          {h.note && <p className="mt-2 text-sm">{h.note}</p>}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {h.by ? `${h.by.name} (${h.by.role})` : "System"}
          </p>
        </li>
      ))}
    </ol>
  );
}