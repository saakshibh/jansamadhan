import { useState } from "react";
import toast from "react-hot-toast";
import { User, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "" });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      setUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : "-";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold">My profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-display text-4xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-display text-lg font-semibold">{user.name}</h2>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            <ShieldCheck size={14} /> {user.role}
          </span>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar size={14} /> Member since {memberSince}
          </div>
        </div>

        <form
          onSubmit={save}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2"
        >
          <h2 className="font-display text-lg font-semibold">Personal information</h2>

          <div className="relative">
            <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              required
              className="input"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input className="input cursor-not-allowed opacity-60" value={user.email} disabled />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              className="input"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary sm:w-48">
            {busy ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}