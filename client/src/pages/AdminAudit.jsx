import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";

const tabs = [
  { id: "activity", label: "Complaint activity" },
  { id: "admin", label: "Admin actions" },
];

const actionLabel = {
  "user.created": "Created staff account",
  "user.updated": "Updated user",
  "department.created": "Created department",
  "department.updated": "Updated department",
};

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export default function AdminAudit() {
  const [tab, setTab] = useState("activity");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = tab === "activity" ? "/admin/activity" : "/admin/audit";
    api
      .get(url, { params: { page, limit: 12 } })
      .then(({ data }) => {
        setItems(tab === "activity" ? data.items : data.logs);
        setPages(data.pages);
        setTotal(data.total);
      })
      .catch(() => toast.error("Could not load the audit log"))
      .finally(() => setLoading(false));
  }, [tab, page]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Audit log</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{total} record{total === 1 ? "" : "s"}. Nothing here can be edited or deleted.</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="font-display text-lg font-semibold">Nothing recorded yet</p>
        </div>
      ) : tab === "activity" ? (
        <div className="space-y-3">
          {items.map((a, i) => (
            <div key={`${a._id}-${i}`} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <Link to={`/officer/complaints/${a._id}`} className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                    {a.complaintId}
                  </Link>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{fmt(a.at)}</span>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{a.title}</p>
              {a.note && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.note}</p>}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                By {a.actorName ? `${a.actorName} (${a.actorRole})` : "System"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((l) => (
            <div key={l._id} className={card}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {actionLabel[l.action] || l.action}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{fmt(l.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm">{l.details}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                By {l.actor ? `${l.actor.name} (${l.actor.role})` : "Unknown"}
              </p>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}