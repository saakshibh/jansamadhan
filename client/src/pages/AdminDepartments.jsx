import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Power, Clock, Users, Inbox } from "lucide-react";
import api from "../utils/api";
import Modal from "../components/Modal";
import { CATEGORIES } from "../utils/constants";

const label = "mb-1.5 block text-sm font-medium";

function DepartmentModal({ dept, onClose, onDone }) {
  const editing = !!dept;
  const [form, setForm] = useState({
    name: dept?.name || "",
    code: dept?.code || "",
    description: dept?.description || "",
    slaHours: dept?.slaHours ?? 72,
    categories: dept?.categories || [],
  });
  const [busy, setBusy] = useState(false);

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const toggleCategory = (name) =>
    setForm({
      ...form,
      categories: form.categories.includes(name)
        ? form.categories.filter((c) => c !== name)
        : [...form.categories, name],
    });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        const { code, ...rest } = form;
        await api.patch(`/admin/departments/${dept._id}`, rest);
        toast.success("Department updated");
      } else {
        await api.post("/admin/departments", form);
        toast.success("Department created");
      }
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save department");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? `Edit ${dept.name}` : "Add department"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={label}>Department name</label>
            <input required className="input pl-4" value={form.name} onChange={update("name")} />
          </div>
          <div>
            <label className={label}>Code</label>
            <input
              required
              disabled={editing}
              maxLength={10}
              className="input pl-4 uppercase disabled:opacity-60"
              placeholder="e.g. FIRE"
              value={form.code}
              onChange={update("code")}
            />
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <input className="input pl-4" maxLength={300} value={form.description} onChange={update("description")} />
        </div>
        <div>
          <label className={label}>Resolution deadline (SLA) in hours</label>
          <input
            required
            type="number"
            min={1}
            max={720}
            className="input pl-4"
            value={form.slaHours}
            onChange={update("slaHours")}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Applies to new complaints only. Urgent complaints get half this time.
          </p>
        </div>
        <div>
          <span className={label}>Categories handled</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map(({ name }) => (
              <label
                key={name}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  form.categories.includes(name)
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.categories.includes(name)}
                  onChange={() => toggleCategory(name)}
                  className="accent-indigo-600"
                />
                {name}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving..." : editing ? "Save changes" : "Create department"}
        </button>
      </form>
    </Modal>
  );
}

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/departments")
      .then(({ data }) => setDepartments(data.departments))
      .catch(() => toast.error("Could not load departments"))
      .finally(() => setLoading(false));
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);

  const toggleActive = async (d) => {
    const verb = d.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${verb} ${d.name}?`)) return;
    try {
      await api.patch(`/admin/departments/${d._id}`, { isActive: !d.isActive });
      toast.success(`Department ${verb}d`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Departments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage who handles which complaints and how fast.
          </p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary flex w-auto items-center gap-2 px-5">
          <Plus size={16} /> Add department
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {departments.map((d) => (
            <div
              key={d._id}
              className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
                d.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    {d.code}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{d.name}</h3>
                  {d.description && <p className="text-sm text-slate-500 dark:text-slate-400">{d.description}</p>}
                </div>
                {!d.isActive && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                    Inactive
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {d.categories.map((c) => (
                  <span key={c} className="rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{c}</span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Clock size={14} /> SLA {d.slaHours}h</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {d.officerCount} officer{d.officerCount === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1.5"><Inbox size={14} /> {d.openCount} open</span>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setModal(d)}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <Pencil size={13} /> Edit
                </button>
                {d.code !== "GRC" && (
                  <button
                    onClick={() => toggleActive(d)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
                      d.isActive ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <Power size={13} /> {d.isActive ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <DepartmentModal
          dept={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}