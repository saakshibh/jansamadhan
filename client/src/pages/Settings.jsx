import { useState } from "react";
import toast from "react-hot-toast";
import { Sun, Moon, Bell, ShieldCheck, Palette, Lock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";

const tabs = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
];

const defaultPrefs = { email: true, statusUpdates: true, escalations: true, sms: false };

const prefList = [
  { key: "email", title: "Email notifications", desc: "Receive updates on your registered email" },
  { key: "statusUpdates", title: "Status updates", desc: "Get notified when a complaint changes status" },
  { key: "escalations", title: "Escalation alerts", desc: "Know when your complaint is escalated" },
  { key: "sms", title: "SMS alerts", desc: "Receive important updates by SMS" },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState("appearance");
  const [prefs, setPrefs] = useState(() => {
    try {
      return { ...defaultPrefs, ...JSON.parse(localStorage.getItem("notifPrefs")) };
    } catch {
      return defaultPrefs;
    }
  });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const updatePref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem("notifPrefs", JSON.stringify(next));
    toast.success("Preference saved");
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error("New passwords do not match");
    setBusy(true);
    try {
      await api.put("/auth/password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success("Password changed successfully");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              tab === id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "appearance" && (
        <div className={card}>
          <h2 className="font-display text-lg font-semibold">Theme</h2>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Choose how JanSamadhan looks for you.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "light", label: "Light mode", icon: Sun },
              { id: "dark", label: "Dark mode", icon: Moon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => theme !== id && toggleTheme()}
                className={`flex items-center gap-3 rounded-2xl border-2 p-5 text-left transition ${
                  theme === id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                }`}
              >
                <Icon size={22} />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className={`${card} space-y-5`}>
          <div>
            <h2 className="font-display text-lg font-semibold">Notification preferences</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Saved on this device for now. We will connect them to real alerts later.
            </p>
          </div>
          {prefList.map(({ key, title, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
              <Toggle checked={prefs[key]} onChange={(v) => updatePref(key, v)} />
            </div>
          ))}
        </div>
      )}

      {tab === "security" && (
        <form onSubmit={changePassword} className={`${card} max-w-lg space-y-4`}>
          <h2 className="font-display text-lg font-semibold">Change password</h2>
          {[
            { field: "currentPassword", placeholder: "Current password" },
            { field: "newPassword", placeholder: "New password (min 6 characters)" },
            { field: "confirm", placeholder: "Confirm new password" },
          ].map(({ field, placeholder }) => (
            <div key={field} className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                required
                className="input"
                placeholder={placeholder}
                value={pw[field]}
                onChange={(e) => setPw({ ...pw, [field]: e.target.value })}
              />
            </div>
          ))}
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}