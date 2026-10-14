import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, UserPlus, Pencil, Power } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";

const tabs = [
  { id: "all", label: "All" },
  { id: "citizen", label: "Citizens" },
  { id: "officer", label: "Officers" },
  { id: "admin", label: "Admins" },
];

const roleStyle = {
  citizen: "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
  officer: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  superadmin: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
};

const label = "mb-1.5 block text-sm font-medium";

function CreateModal({ departments, isSuper, onClose, onDone }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "officer", department: "" });
  const [busy, setBusy] = useState(false);
  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/users", form);
      toast.success("Staff account created");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add staff member" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={label}>Full name</label>
          <input required className="input pl-4" value={form.name} onChange={update("name")} />
        </div>
        <div>
          <label className={label}>Official email</label>
          <input required type="email" className="input pl-4" placeholder="name@jansamadhan.in" value={form.email} onChange={update("email")} />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Must end with @jansamadhan.in</p>
        </div>
        <div>
          <label className={label}>Phone (optional)</label>
          <input className="input pl-4" value={form.phone} onChange={update("phone")} />
        </div>
        <div>
          <label className={label}>Temporary password</label>
          <input required type="password" minLength={6} className="input pl-4" value={form.password} onChange={update("password")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Role</label>
            <select className="input pl-4" value={form.role} onChange={update("role")}>
              <option value="officer">Officer</option>
              {isSuper && <option value="admin">Admin</option>}
            </select>
          </div>
          {form.role === "officer" && (
            <div>
              <label className={label}>Department</label>
              <select required className="input pl-4" value={form.department} onChange={update("department")}>
                <option value="">Select...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Creating..." : "Create account"}
        </button>
      </form>
    </Modal>
  );
}

function EditModal({ user, departments, isSuper, onClose, onDone }) {
  const [role, setRole] = useState(user.role);
  const [department, setDepartment] = useState(user.department?._id || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/admin/users/${user._id}`, { role, department });
      toast.success("User updated");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Edit ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        <div>
          <label className={label}>Role</label>
          <select className="input pl-4" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="citizen">Citizen</option>
            <option value="officer">Officer</option>
            {(isSuper || user.role === "admin") && <option value="admin">Admin</option>}
          </select>
        </div>
        {role === "officer" && (
          <div>
            <label className={label}>Department</label>
            <select required className="input pl-4" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select...</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving..." : "Save changes"}
        </button>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const isSuper = me.role === "superadmin";

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    api
      .get("/admin/departments")
      .then(({ data }) => setDepartments(data.departments.filter((d) => d.isActive)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(
      () => {
        api
          .get("/admin/users", { params: { role, search, page, limit: 10 } })
          .then(({ data }) => {
            setUsers(data.users);
            setPages(data.pages);
            setTotal(data.total);
          })
          .catch(() => toast.error("Could not load users"))
          .finally(() => setLoading(false));
      },
      search ? 400 : 0
    );
    return () => clearTimeout(timer);
  }, [role, search, page, tick]);

  const refresh = () => setTick((t) => t + 1);

  const canManage = (u) =>
    u._id !== me.id && u.role !== "superadmin" && (u.role !== "admin" || isSuper);

  const toggleActive = async (u) => {
    const verb = u.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${verb} ${u.name}?`)) return;
    try {
      await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`User ${verb}d`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{total} user{total === 1 ? "" : "s"} found</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex w-auto items-center gap-2 px-5">
          <UserPlus size={16} /> Add staff
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          className="input"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setRole(t.id);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              role === t.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <p className="font-display text-lg font-semibold">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name}{u._id === me.id && " (you)"}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleStyle[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3">{u.department?.name || "-"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold ${u.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    {canManage(u) ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(u)}
                          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
                            u.isActive ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          <Power size={13} /> {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-right text-slate-400">-</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />

      {creating && (
        <CreateModal
          departments={departments}
          isSuper={isSuper}
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}
      {editing && (
        <EditModal
          user={editing}
          departments={departments}
          isSuper={isSuper}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}