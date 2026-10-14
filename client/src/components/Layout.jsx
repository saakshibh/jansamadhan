import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  Bell,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Landmark,
  ChevronDown,
  BarChart3,
  Users,
  Building2,
  ScrollText,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ADMIN_ROLES, STAFF_ROLES } from "../utils/constants";
import { useNotifications } from "../context/NotificationContext";

const common = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

const citizenLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/complaints/new", label: "New Complaint", icon: FilePlus2 },
  { to: "/complaints", label: "My Complaints", icon: ListChecks, end: true },
  { to: "/notifications", label: "Notifications", icon: Bell },
  ...common,
];

const officerLinks = [
  { to: "/officer", label: "Officer Dashboard", icon: LayoutDashboard, end: true },
  { to: "/officer/complaints", label: "Complaint Queue", icon: ListChecks },
  ...common,
];

const adminLinks = [
  { to: "/admin", label: "Admin Dashboard", icon: BarChart3, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
  { to: "/officer/complaints", label: "All Complaints", icon: ListChecks },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  ...common,
];

const linksFor = (role) =>
  ADMIN_ROLES.includes(role) ? adminLinks : STAFF_ROLES.includes(role) ? officerLinks : citizenLinks;

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen">
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white">
              <Landmark size={22} />
            </div>
            <span className="font-display text-xl font-bold">JanSamadhan</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1">
          {linksFor(user.role).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
                        <Link
              to="/notifications"
              className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu(!menu)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
                  {initial}
                </span>
                <span className="hidden text-sm font-medium sm:block">{user.name.split(" ")[0]}</span>
                <ChevronDown size={16} />
              </button>

              {menu && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                      {user.role}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <User size={16} /> My profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings size={16} /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}