import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, LogOut } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { homeFor } from "../utils/constants";

export default function ChangePassword() {
  const { setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error("New passwords do not match");
    setBusy(true);
    try {
      const { data } = await api.put("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setUser(data.user);
      toast.success("Password updated. Welcome aboard!");
      navigate(homeFor(data.user.role), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const fields = [
    { field: "currentPassword", placeholder: "Temporary password (given by your admin)" },
    { field: "newPassword", placeholder: "New password (min 6 characters)" },
    { field: "confirm", placeholder: "Confirm new password" },
  ];

  return (
    <AuthLayout
      title="Set your password"
      subtitle="Your account was created with a temporary password. Choose your own to continue."
    >
      <form onSubmit={submit} className="space-y-5">
        {fields.map(({ field, placeholder }) => (
          <div key={field} className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="password"
              required
              className="input"
              placeholder={placeholder}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Updating..." : "Update password and continue"}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="mx-auto mt-6 flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 dark:text-slate-400"
      >
        <LogOut size={14} /> Log out
      </button>
    </AuthLayout>
  );
}