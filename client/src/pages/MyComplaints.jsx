import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, FilePlus2, MapPin, Calendar, ChevronLeft, ChevronRight, Mic } from "lucide-react";
import api from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { CATEGORIES } from "../utils/constants";

const tabs = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "rejected", label: "Rejected" },
];

export default function MyComplaints() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(
      () => {
        api
          .get("/complaints", { params: { status, search, page, limit: 8 } })
          .then(({ data }) => {
            setItems(data.complaints);
            setPages(data.pages);
            setTotal(data.total);
          })
          .catch(() => toast.error("Could not load complaints"))
          .finally(() => setLoading(false));
      },
      search ? 400 : 0
    );
    return () => clearTimeout(timer);
  }, [status, search, page]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">My complaints</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total} complaint{total === 1 ? "" : "s"} found</p>
        </div>
        <Link to="/complaints/new" className="btn-primary flex w-auto items-center gap-2 px-5">
          <FilePlus2 size={16} /> New complaint
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          className="input"
          placeholder="Search by title, ID or description"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setStatus(t.id);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              status === t.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="font-display text-lg font-semibold">No complaints found</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try a different filter, or file your first complaint.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => {
            const Icon = CATEGORIES.find((x) => x.name === c.category)?.icon;
            return (
              <div
                key={c._id}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {c.images[0] ? (
                  <img src={c.images[0].url} alt="" className="hidden h-20 w-20 shrink-0 rounded-xl object-cover sm:block" />
                ) : (
                  <div className="hidden h-20 w-20 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 sm:grid">
                    {Icon && <Icon size={28} />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{c.complaintId}</span>
                    <div className="flex items-center gap-2">
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <Link to={`/complaints/${c._id}`} className="mt-1 block truncate font-semibold hover:text-indigo-600 dark:hover:text-indigo-400">
  {c.title}
</Link>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
  {c.department && (
    <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
      Dept: {c.department.name}
    </span>
  )}
  {c.dueAt && c.status !== "resolved" && c.status !== "rejected" && (
    <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
      Due: {new Date(c.dueAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
    </span>
  )}
  {c.duplicateOf && (
    <span className="rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      Possible duplicate
    </span>
  )}
</div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{c.category}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {c.location.city || c.location.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {c.submittedVia === "voice" && (
                      <span className="flex items-center gap-1">
                        <Mic size={12} /> Voice
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm">Page {page} of {pages}</span>
          <button
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}