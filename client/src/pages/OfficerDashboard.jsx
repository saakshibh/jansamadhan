import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, RefreshCw, AlertTriangle, Flame, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import PriorityBadge from "../components/PriorityBadge";

function Section({ title, items, empty }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <Link to="/officer/complaints" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          View queue
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((c) => (
            <Link
              key={c._id}
              to={`/officer/complaints/${c._id}`}
              className="flex items-center justify-between gap-4 py-3 transition hover:opacity-70"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {c.complaintId} · {c.category}
                </p>
              </div>
              <PriorityBadge priority={c.priority} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ newCount: 0, active: 0, overdue: 0, urgent: 0, resolved: 0 });
  const [overdueList, setOverdueList] = useState([]);
  const [newList, setNewList] = useState([]);

  useEffect(() => {
    api.get("/officer/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/officer/complaints", { params: { status: "overdue", limit: 5 } })
      .then(({ data }) => setOverdueList(data.complaints)).catch(() => {});
    api.get("/officer/complaints", { params: { status: "submitted", limit: 5 } })
      .then(({ data }) => setNewList(data.complaints)).catch(() => {});
  }, []);

  const cards = [
    { label: "New complaints", value: stats.newCount, icon: Inbox, color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" },
    { label: "In progress", value: stats.active, icon: RefreshCw, color: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300" },
    { label: "SLA breached", value: stats.overdue, icon: AlertTriangle, color: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300" },
    { label: "High priority open", value: stats.urgent, icon: Flame, color: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <h1 className="relative font-display text-3xl font-bold">Welcome, {user.name.split(" ")[0]} 👋</h1>
        <p className="relative mt-2 max-w-xl text-white/80">
          Here is what needs your attention. Complaints past their deadline are escalated automatically.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <p className="font-display text-3xl font-bold">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="SLA breached" items={overdueList} empty="No overdue complaints. Great work!" />
        <Section title="Awaiting action" items={newList} empty="No new complaints right now." />
      </div>
    </div>
  );
}