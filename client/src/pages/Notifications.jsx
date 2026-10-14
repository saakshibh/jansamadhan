import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Trash2, FileText, RefreshCw, AlertTriangle, Inbox } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import Pagination from "../components/Pagination";
import { STAFF_ROLES } from "../utils/constants";

const types = {
  complaint_submitted: { icon: FileText, cls: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" },
  new_complaint: { icon: Inbox, cls: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" },
  status_update: { icon: RefreshCw, cls: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300" },
  escalation: { icon: AlertTriangle, cls: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300" },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function Notifications() {
  const { user } = useAuth();
  const { unread, setUnread, incoming } = useNotifications();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/notifications", { params: { filter, page, limit: 10 } })
      .then(({ data }) => {
        setItems(data.notifications);
        setPages(data.pages);
        setTotal(data.total);
        setUnread(data.unread);
      })
      .catch(() => toast.error("Could not load notifications"))
      .finally(() => setLoading(false));
  }, [filter, page, setUnread]);

  // A new notification arrives while this page is open
  useEffect(() => {
    if (!incoming || page !== 1) return;
    setItems((prev) => {
      if (prev.some((n) => n._id === incoming._id)) return prev;
      setTotal((t) => t + 1);
      return [incoming, ...prev].slice(0, 10);
    });
  }, [incoming, page]);

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        /* ignore */
      }
    }
    if (n.complaint) {
      const base = STAFF_ROLES.includes(user.role) ? "/officer/complaints" : "/complaints";
      navigate(`${base}/${n.complaint}`);
    }
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
      toast.success("All marked as read");
    } catch {
      toast.error("Action failed");
    }
  };

  const remove = async (e, n) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${n._id}`);
      setItems((prev) => prev.filter((x) => x._id !== n._id));
      setTotal((t) => Math.max(0, t - 1));
      if (!n.isRead) setUnread((u) => Math.max(0, u - 1));
    } catch {
      toast.error("Could not delete");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {unread} unread · {total} shown
          </p>
        </div>
        <button
          onClick={markAll}
          disabled={unread === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { id: "all", label: "All" },
          { id: "unread", label: "Unread" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setFilter(t.id);
              setPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === t.id
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
          <Bell className="mx-auto mb-3 text-slate-400" size={32} />
          <p className="font-display text-lg font-semibold">
            {filter === "unread" ? "You are all caught up" : "No notifications yet"}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Updates on your complaints will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const t = types[n.type] || types.status_update;
            const Icon = t.icon;
            return (
              <div
                key={n._id}
                onClick={() => open(n)}
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                  n.isRead
                    ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    : "border-indigo-300 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/10"
                }`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${t.cls}`}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => remove(e, n)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  aria-label="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}