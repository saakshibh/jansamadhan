import Complaint from "../models/Complaint.js";
import { notifyUser } from "../utils/notify.js";

const CLOSED = ["resolved", "rejected"];

// The workflow: which status can move to which
const TRANSITIONS = {
  submitted: ["assigned", "in_progress", "rejected"],
  assigned: ["in_progress", "resolved", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
};

const DEFAULT_NOTES = {
  assigned: "Complaint accepted and assigned to an officer",
  in_progress: "Work has started on this complaint",
  resolved: "Complaint marked as resolved",
  rejected: "Complaint rejected",
};

// Officers see only their own department. Admins see everything.
const scope = (user) => {
  if (user.role !== "officer") return {};
  if (!user.department) return { _id: { $exists: false } };
  return { department: user.department };
};

const populateDetail = (query) =>
  query
    .populate("citizen", "name email phone")
    .populate("department", "name code")
    .populate("assignedTo", "name")
    .populate("duplicateOf", "complaintId title status")
    .populate("history.by", "name role");

const handleError = (res, error) => {
  if (error.name === "CastError") return res.status(404).json({ message: "Complaint not found" });
  res.status(500).json({ message: error.message });
};

export const getQueue = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filter = { ...scope(req.user) };

    if (status === "overdue") {
      filter.dueAt = { $lt: new Date() };
      filter.status = { $nin: CLOSED };
    } else if (status && status !== "all") {
      filter.status = status;
    }
    if (priority && priority !== "all") filter.priority = priority;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { complaintId: rx }, { description: rx }];
    }

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .select("-history")
      .populate("citizen", "name")
      .populate("department", "name code")
      .sort(status === "overdue" ? { dueAt: 1 } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ complaints, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    handleError(res, error);
  }
};

export const getOfficerStats = async (req, res) => {
  try {
    const base = scope(req.user);
    const now = new Date();

    const [rows, overdue, urgent] = await Promise.all([
      Complaint.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.countDocuments({ ...base, dueAt: { $lt: now }, status: { $nin: CLOSED } }),
      Complaint.countDocuments({ ...base, priority: { $in: ["urgent", "high"] }, status: { $nin: CLOSED } }),
    ]);

    const c = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    res.json({
      total: rows.reduce((sum, r) => sum + r.count, 0),
      newCount: c.submitted || 0,
      active: (c.assigned || 0) + (c.in_progress || 0),
      resolved: c.resolved || 0,
      overdue,
      urgent,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getOfficerComplaint = async (req, res) => {
  try {
    const complaint = await populateDetail(
      Complaint.findOne({ _id: req.params.id, ...scope(req.user) })
    );
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json({ complaint });
  } catch (error) {
    handleError(res, error);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const complaint = await Complaint.findOne({ _id: req.params.id, ...scope(req.user) });
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const allowed = TRANSITIONS[complaint.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot move a complaint from "${complaint.status}" to "${status}"` });
    }

    const cleanNote = (note || "").trim().slice(0, 500);
    if (CLOSED.includes(status) && !cleanNote) {
      return res.status(400).json({ message: "Please add a note explaining the outcome" });
    }

    complaint.status = status;
    if (["assigned", "in_progress"].includes(status) && !complaint.assignedTo) {
      complaint.assignedTo = req.user._id;
    }
    if (status === "resolved") complaint.resolvedAt = new Date();

    complaint.history.push({
      status,
      note: cleanNote || DEFAULT_NOTES[status],
      by: req.user._id,
    });

    await complaint.save();
        const STATUS_TITLES = {
      assigned: "Your complaint was accepted",
      in_progress: "Work has started on your complaint",
      resolved: "Your complaint was resolved",
      rejected: "Your complaint was rejected",
    };
    await notifyUser(complaint.citizen, {
      type: "status_update",
      title: STATUS_TITLES[status],
      message: `${complaint.complaintId}: ${cleanNote || DEFAULT_NOTES[status]}`,
      complaint: complaint._id,
    });

    const fresh = await populateDetail(Complaint.findById(complaint._id));
    res.json({ complaint: fresh });
  } catch (error) {
    handleError(res, error);
  }
};