import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, User, ShieldCheck } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../utils/constants";

const portals = [
  { id: "citizen", label: "Citizen", icon: User },
  { id: "staff", label: "Staff", icon: ShieldCheck },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState("citizen");
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const isStaff = portal === "staff";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(form.email, form.password, portal);
      toast.success("Welcome back!");
      navigate(user.mustChangePassword ? "/change-password" : homeFor(user.role));     
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        isStaff
          ? "Log in to manage and resolve complaints for your department."
          : "Log in to track and manage your complaints."
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
        {portals.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPortal(id)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              portal === id
                ? "bg-white text-indigo-600 shadow dark:bg-slate-900 dark:text-indigo-300"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="email"
            required
            placeholder={isStaff ? "Official email address" : "Email address"}
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type={show ? "text" : "password"}
            required
            placeholder="Password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Logging in..." : isStaff ? "Log in as staff" : "Log in"}
        </button>
      </form>

      {isStaff ? (
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Staff accounts are created by administrators.
        </p>
      ) : (
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          New here?{" "}
          <Link to="/register" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            Create an account
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}