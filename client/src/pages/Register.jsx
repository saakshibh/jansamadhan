import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Phone, Lock } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const { confirm, ...data } = form;
      await register(data);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join JanSamadhan and get your issues resolved faster.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input required placeholder="Full name" className="input" value={form.name} onChange={update("name")} />
        </div>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input type="email" required placeholder="Email address" className="input" value={form.email} onChange={update("email")} />
        </div>
        <div className="relative">
          <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input placeholder="Phone (optional)" className="input" value={form.phone} onChange={update("phone")} />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input type="password" required minLength={6} placeholder="Password (min 6 characters)" className="input" value={form.password} onChange={update("password")} />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input type="password" required placeholder="Confirm password" className="input" value={form.confirm} onChange={update("confirm")} />
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}