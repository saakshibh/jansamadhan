import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, MapPin, Calendar, Building2, User, Phone, Mail,
  Clock, AlertTriangle, Sparkles, Copy,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import Timeline from "../components/Timeline";
import { STAFF_ROLES, TRANSITIONS, ACTIONS } from "../utils/constants";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <div className="break-words text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const staff = STAFF_ROLES.includes(user.role);
  const base = staff ? "/officer/complaints" : "/complaints";

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`${base}/${id}`)
      .then(({ data }) => setComplaint(data.complaint))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [base, id]);

  const changeStatus = async (status) => {
    if (["resolved", "rejected"].includes(status) && !note.trim()) {
      return toast.error("Please write a note first. The citizen will see it.");
    }
    setBusy(true);
    try {
      const { data } = await api.patch(`${base}/${id}/status`, { status, note });
      setComplaint(data.complaint);
      setNote("");
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (missing || !complaint) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-xl font-bold">Complaint not found</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          It may not exist, or you may not have access to it.
        </p>
        <Link to={staff ? "/officer/complaints" : "/complaints"} className="mt-4 inline-block text-indigo-600 hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  const actions = staff ? TRANSITIONS[complaint.status] || [] : [];
  const open = !["resolved", "rejected"].includes(complaint.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to={staff ? "/officer/complaints" : "/complaints"}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400"
      >
        <ArrowLeft size={16} /> Back to complaints
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{complaint.complaintId}</p>
          <h1 className="font-display text-2xl font-bold">{complaint.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{complaint.category}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {complaint.isOverdue && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300">
              <AlertTriangle size={12} /> SLA breached
            </span>
          )}
          {complaint.escalationLevel > 0 && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
              Escalated L{complaint.escalationLevel}
            </span>
          )}
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className={card}>
            <h2 className="mb-3 font-display text-lg font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{complaint.description}</p>

            {staff && complaint.ai?.summary && (
              <div className="mt-5 flex gap-3 rounded-xl bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                <Sparkles size={18} className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                <div>
                  <p className="font-semibold text-indigo-700 dark:text-indigo-300">AI summary</p>
                  <p className="mt-1">{complaint.ai.summary}</p>
                </div>
              </div>
            )}

            {complaint.images?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {complaint.images.map((img) => (
                  <a key={img.url} href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt="Attached" className="h-28 w-28 rounded-xl object-cover transition hover:opacity-80" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {actions.length > 0 && (
            <div className={card}>
              <h2 className="mb-1 font-display text-lg font-semibold">Update status</h2>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                The note is saved in the audit trail and shown to the citizen.
              </p>
              <textarea
                rows={3}
                maxLength={500}
                className="input pl-4"
                placeholder="Add a note (required to resolve or reject)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => changeStatus(s)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${ACTIONS[s].cls}`}
                  >
                    {ACTIONS[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {staff && actions.length === 0 && (
            <div className={`${card} text-center text-sm text-slate-500 dark:text-slate-400`}>
              This complaint is closed. No further actions are available.
            </div>
          )}

          <div className={card}>
            <h2 className="mb-5 font-display text-lg font-semibold">Activity timeline</h2>
            <Timeline history={complaint.history} />
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${card} space-y-4`}>
            <h2 className="font-display text-lg font-semibold">Details</h2>
            <Row icon={Building2} label="Department">{complaint.department?.name || "Not routed yet"}</Row>
            <Row icon={User} label="Assigned officer">{complaint.assignedTo?.name || "Not assigned yet"}</Row>
            <Row icon={MapPin} label="Location">
              {[complaint.location?.address, complaint.location?.city, complaint.location?.pincode].filter(Boolean).join(", ")}
            </Row>
            <Row icon={Calendar} label="Filed on">{fmt(complaint.createdAt)}</Row>
            {complaint.dueAt && (
              <Row icon={Clock} label={open ? "Resolution deadline (SLA)" : "Deadline was"}>
                <span className={complaint.isOverdue ? "text-red-500" : ""}>{fmt(complaint.dueAt)}</span>
              </Row>
            )}
          </div>

          {staff && complaint.citizen && (
            <div className={`${card} space-y-4`}>
              <h2 className="font-display text-lg font-semibold">Citizen</h2>
              <Row icon={User} label="Name">{complaint.citizen.name}</Row>
              <Row icon={Mail} label="Email">{complaint.citizen.email}</Row>
              {complaint.citizen.phone && <Row icon={Phone} label="Phone">{complaint.citizen.phone}</Row>}
            </div>
          )}

          {staff && complaint.duplicateOf && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
              <p className="mb-1 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
                <Copy size={16} /> Possible duplicate
              </p>
              <p>
                Similar to {complaint.duplicateOf.complaintId}: {complaint.duplicateOf.title}
                {complaint.duplicateScore ? ` (${Math.round(complaint.duplicateScore * 100)}% match)` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}