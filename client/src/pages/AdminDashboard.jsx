import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, BarChart, Bar,
} from "recharts";
import { FileText, Clock, CheckCircle2, AlertTriangle, Gauge, Timer } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { STATUS } from "../utils/constants";

const STATUS_COLORS = {
  submitted: "#f59e0b",
  assigned: "#0ea5e9",
  in_progress: "#8b5cf6",
  resolved: "#10b981",
  rejected: "#ef4444",
};

const formatHours = (h) => (h == null ? "-" : h < 48 ? `${h} h` : `${(h / 24).toFixed(1)} days`);

function ChartCard({ title, subtitle, className = "", children }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      <div className="h-72">{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get("/admin/analytics").then(({ data }) => setData(data)).catch(() => setFailed(true));
  }, []);

  if (failed) {
    return <p className="py-24 text-center text-slate-500">Could not load analytics. Check that the server is running.</p>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const dark = theme === "dark";
  const axis = dark ? "#94a3b8" : "#64748b";
  const grid = dark ? "#1e293b" : "#e2e8f0";
  const tip = {
    contentStyle: {
      background: dark ? "#0f172a" : "#ffffff",
      border: `1px solid ${grid}`,
      borderRadius: 12,
      fontSize: 12,
    },
    labelStyle: { color: axis },
  };

  const { overview: o } = data;
  const statusData = data.byStatus.map((s) => ({
    name: STATUS[s.name]?.label || s.name,
    value: s.value,
    fill: STATUS_COLORS[s.name] || "#94a3b8",
  }));

  const cards = [
    { label: "Total complaints", value: o.total, icon: FileText, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" },
    { label: "Open", value: o.open, icon: Clock, color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" },
    { label: "Resolved", value: o.resolved, icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" },
    { label: "SLA breached", value: o.overdue, icon: AlertTriangle, color: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300" },
    { label: "SLA compliance", value: o.slaCompliance == null ? "-" : `${o.slaCompliance}%`, icon: Gauge, color: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300" },
    { label: "Avg resolution time", value: formatHours(o.avgResolutionHours), icon: Timer, color: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <h1 className="relative font-display text-3xl font-bold">Admin overview</h1>
        <p className="relative mt-2 max-w-2xl text-white/80">
          Welcome, {user.name.split(" ")[0]}. {o.citizens} citizens, {o.staff} staff members, and {o.duplicates} possible
          duplicate{o.duplicates === 1 ? "" : "s"} flagged so far.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${color}`}>
              <Icon size={20} />
            </div>
            <p className="font-display text-2xl font-bold">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {o.total === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No complaints yet. The charts will fill up as citizens file complaints.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Last 14 days" subtitle="Complaints filed vs resolved" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ left: -10, right: 10, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="date" tick={{ fill: axis, fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip {...tip} />
              <Legend />
              <Area type="monotone" dataKey="filed" name="Filed" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By status" subtitle="Where complaints stand today">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} />
              <Tooltip {...tip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="By category" subtitle="What citizens complain about most">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byCategory} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: axis, fontSize: 11 }} tickLine={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip {...tip} cursor={{ fill: dark ? "#1e293b" : "#f1f5f9" }} />
              <Bar dataKey="value" name="Complaints" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By department" subtitle="Total and still-open complaints">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.byDepartment} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="name" tick={{ fill: axis, fontSize: 11 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: axis, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip {...tip} cursor={{ fill: dark ? "#1e293b" : "#f1f5f9" }} />
              <Legend />
              <Bar dataKey="count" name="Total" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="open" name="Open" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}