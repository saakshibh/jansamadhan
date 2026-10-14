import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, MapPin, Clock, ChevronLeft, ChevronRight, AlertTriangle, User } from "lucide-react";
import api from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";

const tabs = [
  { id: "all", label: "All" },
  { id: "submitted", label: "New" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In progress" },
  { id: "overdue", label: "Overdue" },
  { id: "resolved", label: "Resolved" },
];

export default function OfficerQueue() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
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
          .get("/officer/complaints", { params: { status, priority, search, page, limit: 8 } })
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
  }, [status, priority, search, page]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Complaint queue</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{total} complaint{total === 1 ? "" : "s"} found</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
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
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
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
          <p className="font-display text-lg font-semibold">Nothing here</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No complaints match these filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => {
            const open = !["resolved", "rejected"].includes(c.status);
            return (
              <Link
                key={c._id}
                to={`/officer/complaints/${c._id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{c.complaintId}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.isOverdue && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                        <AlertTriangle size={12} /> SLA breached
                      </span>
                    )}
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <h3 className="mt-2 truncate font-semibold">{c.title}</h3>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><User size={12} /> {c.citizen?.name || "Citizen"}</span>
                  <span>{c.category}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {c.location.city || c.location.address}</span>
                  {c.dueAt && open && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Due {new Date(c.dueAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </span>
                  )}
                  {c.escalationLevel > 0 && (
                    <span className="font-medium text-orange-600 dark:text-orange-400">Escalated L{c.escalationLevel}</span>
                  )}
                  {c.duplicateOf && (
                    <span className="font-medium text-amber-600 dark:text-amber-400">Possible duplicate</span>
                  )}
                </div>
              </Link>
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