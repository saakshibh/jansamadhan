import User from "../models/User.js";
import Complaint, { CATEGORIES } from "../models/Complaint.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";
import { logAction } from "../utils/audit.js";

const CLOSED = ["resolved", "rejected"];
const DAY = 24 * 60 * 60 * 1000;
const TZ = "Asia/Kolkata";
const STAFF_DOMAIN = "@jansamadhan.in";

const fail = (res, error) => {
  if (error.code === 11000) {
    return res.status(400).json({ message: "That name, code or email already exists" });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join(", ") });
  }
  if (error.name === "CastError") return res.status(404).json({ message: "Not found" });
  res.status(500).json({ message: error.message });
};

const paging = (req, def = 10) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || def, 50);
  return { page, limit, skip: (page - 1) * limit };
};

const rxOf = (s) => new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const groupCount = (field) =>
  Complaint.aggregate([
    { $group: { _id: `$${field}`, value: { $sum: 1 } } },
    { $project: { _id: 0, name: "$_id", value: 1 } },
    { $sort: { value: -1 } },
  ]);

/* ---------- Analytics ---------- */

export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const since = new Date(Date.now() - 14 * DAY);

    const [byStatus, byCategory, byDepartment, filed, resolvedDaily, resolution, overdue, duplicates, citizens, staff] =
      await Promise.all([
        groupCount("status"),
        groupCount("category"),
        Complaint.aggregate([
          {
            $group: {
              _id: "$department",
              count: { $sum: 1 },
              open: { $sum: { $cond: [{ $in: ["$status", CLOSED] }, 0, 1] } },
            },
          },
          { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
          {
            $project: {
              _id: 0,
              name: { $ifNull: [{ $arrayElemAt: ["$dept.code", 0] }, "Unrouted"] },
              count: 1,
              open: 1,
            },
          },
          { $sort: { count: -1 } },
        ]),
        Complaint.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, n: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
          { $match: { resolvedAt: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$resolvedAt", timezone: TZ } }, n: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
          { $match: { status: "resolved", resolvedAt: { $type: "date" }, dueAt: { $type: "date" } } },
          {
            $group: {
              _id: null,
              avgMs: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } },
              onTime: { $sum: { $cond: [{ $lte: ["$resolvedAt", "$dueAt"] }, 1, 0] } },
              count: { $sum: 1 },
            },
          },
        ]),
        Complaint.countDocuments({ dueAt: { $lt: now }, status: { $nin: CLOSED } }),
        Complaint.countDocuments({ duplicateOf: { $ne: null } }),
        User.countDocuments({ role: "citizen" }),
        User.countDocuments({ role: { $in: ["officer", "admin", "superadmin"] } }),
      ]);

    const count = Object.fromEntries(byStatus.map((s) => [s.name, s.value]));
    const total = byStatus.reduce((sum, s) => sum + s.value, 0);
    const r = resolution[0];

    const filedMap = Object.fromEntries(filed.map((x) => [x._id, x.n]));
    const resolvedMap = Object.fromEntries(resolvedDaily.map((x) => [x._id, x.n]));
    const trend = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const key = d.toLocaleDateString("en-CA", { timeZone: TZ });
      trend.push({
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: TZ }),
        filed: filedMap[key] || 0,
        resolved: resolvedMap[key] || 0,
      });
    }

    res.json({
      overview: {
        total,
        open: total - (count.resolved || 0) - (count.rejected || 0),
        resolved: count.resolved || 0,
        overdue,
        duplicates,
        citizens,
        staff,
        avgResolutionHours: r ? Math.round((r.avgMs / 3600000) * 10) / 10 : null,
        slaCompliance: r ? Math.round((r.onTime / r.count) * 100) : null,
      },
      byStatus,
      byCategory,
      byDepartment,
      trend,
    });
  } catch (error) {
    fail(res, error);
  }
};

/* ---------- Users ---------- */

export const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const { page, limit, skip } = paging(req);

    const filter = {};
    if (role === "admin") filter.role = { $in: ["admin", "superadmin"] };
    else if (role && role !== "all") filter.role = role;
    if (search) {
      const rx = rxOf(search);
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ users, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    fail(res, error);
  }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, role, department } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const mail = email.trim().toLowerCase();
    if (!mail.endsWith(STAFF_DOMAIN)) {
      return res.status(400).json({ message: `Staff emails must end with ${STAFF_DOMAIN}` });
    }
    if (!["officer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be officer or admin" });
    }
    if (role === "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only a super admin can create admins" });
    }

    let dept = null;
    if (role === "officer") {
      dept = department ? await Department.findById(department) : null;
      if (!dept || !dept.isActive) {
        return res.status(400).json({ message: "Please choose an active department for the officer" });
      }
    }

    if (await User.findOne({ email: mail })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({
      name: name.trim(),
      email: mail,
      password,
      phone: phone?.trim() || "",
      role,
      department: dept?._id || null,
            mustChangePassword: true,
    });

    await logAction(
      req.user,
      "user.created",
      "user",
      user._id,
      `Created ${role} account ${mail}${dept ? ` in ${dept.name}` : ""}`
    );

    const saved = await User.findById(user._id).populate("department", "name code");
    res.status(201).json({ user: saved });
  } catch (error) {
    fail(res, error);
  }
};

export const updateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot change your own account here" });
    }
    if (target.role === "superadmin") {
      return res.status(403).json({ message: "Super admin accounts cannot be modified" });
    }
    if (target.role === "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only a super admin can modify admins" });
    }

    const { role, department, isActive } = req.body;
    const changes = [];

    const roleChanged = role !== undefined && role !== target.role;
    if (roleChanged) {
      if (!["citizen", "officer", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      if (role === "admin" && req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only a super admin can create admins" });
      }
      target.role = role;
      changes.push(`role set to ${role}`);
    }

    if (target.role === "officer" && (roleChanged || department !== undefined)) {
      const deptId = department !== undefined ? department : target.department;
      const dept = deptId ? await Department.findById(deptId) : null;
      if (!dept) return res.status(400).json({ message: "Officers must belong to a department" });
      if (String(target.department) !== String(dept._id)) {
        target.department = dept._id;
        changes.push(`department set to ${dept.name}`);
      }
    }
    if (roleChanged && target.role !== "officer") target.department = null;

    if (typeof isActive === "boolean" && isActive !== target.isActive) {
      target.isActive = isActive;
      changes.push(isActive ? "account activated" : "account deactivated");
    }

    if (changes.length) {
      await target.save();
      await logAction(req.user, "user.updated", "user", target._id, `${target.email}: ${changes.join(", ")}`);
    }

    const saved = await User.findById(target._id).populate("department", "name code");
    res.json({ user: saved });
  } catch (error) {
    fail(res, error);
  }
};

/* ---------- Departments ---------- */

const parseDepartment = (body, partial = false) => {
  const data = {};

  if (!partial || body.name !== undefined) {
    if (!body.name?.trim()) return { error: "Name is required" };
    data.name = body.name.trim();
  }
  if (body.description !== undefined) {
    data.description = String(body.description).trim().slice(0, 300);
  }
  if (!partial || body.categories !== undefined) {
    const cats = Array.isArray(body.categories) ? body.categories : [];
    if (cats.length === 0) return { error: "Select at least one category" };
    if (cats.some((c) => !CATEGORIES.includes(c))) return { error: "Invalid category selected" };
    data.categories = cats;
  }
  if (!partial || body.slaHours !== undefined) {
    const hours = Number(body.slaHours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 720) {
      return { error: "SLA must be between 1 and 720 hours" };
    }
    data.slaHours = hours;
  }
  return { data };
};

export const getDepartments = async (req, res) => {
  try {
    const [departments, officers, open] = await Promise.all([
      Department.find().sort({ name: 1 }),
      User.aggregate([
        { $match: { role: "officer", department: { $ne: null } } },
        { $group: { _id: "$department", n: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { status: { $nin: CLOSED }, department: { $ne: null } } },
        { $group: { _id: "$department", n: { $sum: 1 } } },
      ]),
    ]);

    const officerMap = Object.fromEntries(officers.map((x) => [String(x._id), x.n]));
    const openMap = Object.fromEntries(open.map((x) => [String(x._id), x.n]));

    res.json({
      departments: departments.map((d) => ({
        ...d.toObject(),
        officerCount: officerMap[String(d._id)] || 0,
        openCount: openMap[String(d._id)] || 0,
      })),
    });
  } catch (error) {
    fail(res, error);
  }
};

export const createDepartment = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!/^[A-Z]{2,10}$/.test(code)) {
      return res.status(400).json({ message: "Code must be 2 to 10 letters" });
    }
    const { data, error } = parseDepartment(req.body);
    if (error) return res.status(400).json({ message: error });

    const dept = await Department.create({ ...data, code });
    await logAction(req.user, "department.created", "department", dept._id, `Created department ${dept.name} (${dept.code})`);
    res.status(201).json({ department: dept });
  } catch (error) {
    fail(res, error);
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const { data, error } = parseDepartment(req.body, true);
    if (error) return res.status(400).json({ message: error });

    if (typeof req.body.isActive === "boolean") {
      if (!req.body.isActive && dept.code === "GRC") {
        return res.status(400).json({ message: "The General Grievance Cell must stay active. It receives unmatched complaints." });
      }
      data.isActive = req.body.isActive;
    }

    const changed = Object.keys(data);
    if (changed.length === 0) return res.json({ department: dept });

    Object.assign(dept, data);
    await dept.save();
    await logAction(req.user, "department.updated", "department", dept._id, `${dept.name}: updated ${changed.join(", ")}`);
    res.json({ department: dept });
  } catch (error) {
    fail(res, error);
  }
};

/* ---------- Audit ---------- */

export const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = paging(req, 15);
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate("actor", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ logs, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    fail(res, error);
  }
};

export const getActivity = async (req, res) => {
  try {
    const { page, limit, skip } = paging(req, 15);

    const [items, totals] = await Promise.all([
      Complaint.aggregate([
        { $unwind: "$history" },
        { $sort: { "history.at": -1 } },
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: "users", localField: "history.by", foreignField: "_id", as: "actor" } },
        {
          $project: {
            complaintId: 1,
            title: 1,
            status: "$history.status",
            note: "$history.note",
            at: "$history.at",
            actorName: { $arrayElemAt: ["$actor.name", 0] },
            actorRole: { $arrayElemAt: ["$actor.role", 0] },
          },
        },
      ]),
      Complaint.aggregate([{ $group: { _id: null, n: { $sum: { $size: { $ifNull: ["$history", []] } } } } }]),
    ]);

    const total = totals[0]?.n || 0;
    res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    fail(res, error);
  }
};