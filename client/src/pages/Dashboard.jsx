import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get("/complaints/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/complaints", { params: { limit: 4 } }).then(({ data }) => setRecent(data.complaints)).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const cards = [
    { label: "Total complaints", value: stats.total, icon: FileText, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" },
    { label: "In progress", value: stats.inProgress, icon: RefreshCw, color: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <h1 className="relative font-display text-3xl font-bold">
          {greeting}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="relative mt-2 max-w-xl text-white/80">
          Report a civic issue and let our AI route it to the right department. Track every step until it is resolved.
        </p>
        <Link
          to="/complaints/new"
          className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:scale-105"
        >
          File a complaint <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${color}`}>
              <Icon size={22} />
            </div>
            <p className="font-display text-3xl font-bold">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent complaints</h2>
          <Link to="/complaints" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            You have not filed any complaints yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {recent.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {c.complaintId} · {c.category}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}