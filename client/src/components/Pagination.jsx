import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm">Page {page} of {pages}</span>
      <button
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}