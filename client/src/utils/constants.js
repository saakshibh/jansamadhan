import {
  Construction, Droplets, Zap, Trash2, Bus,
  HeartPulse, GraduationCap, ShieldAlert, TreePine, Tag,
} from "lucide-react";

export const CATEGORIES = [
  { name: "Roads & Infrastructure", icon: Construction },
  { name: "Water Supply", icon: Droplets },
  { name: "Electricity", icon: Zap },
  { name: "Sanitation & Waste", icon: Trash2 },
  { name: "Public Transport", icon: Bus },
  { name: "Healthcare", icon: HeartPulse },
  { name: "Education", icon: GraduationCap },
  { name: "Police & Safety", icon: ShieldAlert },
  { name: "Environment", icon: TreePine },
  { name: "Other", icon: Tag },
];

export const STATUS = {
  submitted: { label: "Submitted", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  assigned: { label: "Assigned", cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" },
  in_progress: { label: "In progress", cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
  resolved: { label: "Resolved", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
};
export const STAFF_ROLES = ["officer", "admin", "superadmin"];

export const TRANSITIONS = {
  submitted: ["assigned", "in_progress", "rejected"],
  assigned: ["in_progress", "resolved", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
};

export const ACTIONS = {
  assigned: { label: "Accept and assign to me", cls: "bg-sky-600 hover:bg-sky-700" },
  in_progress: { label: "Start work", cls: "bg-violet-600 hover:bg-violet-700" },
  resolved: { label: "Mark resolved", cls: "bg-emerald-600 hover:bg-emerald-700" },
  rejected: { label: "Reject", cls: "bg-red-600 hover:bg-red-700" },
};

export const ADMIN_ROLES = ["admin", "superadmin"];

export const homeFor = (role) =>
  ADMIN_ROLES.includes(role) ? "/admin" : STAFF_ROLES.includes(role) ? "/officer" : "/dashboard";