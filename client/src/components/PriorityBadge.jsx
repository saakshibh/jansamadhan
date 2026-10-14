const styles = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

export default function PriorityBadge({ priority = "medium" }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  );
}