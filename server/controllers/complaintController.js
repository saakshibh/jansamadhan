import Complaint, { CATEGORIES } from "../models/Complaint.js";
import Department from "../models/Department.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { classifyComplaint, getEmbedding, cosineSimilarity } from "../utils/ai.js";
import { notifyUser, notifyDepartment } from "../utils/notify.js";

const DUPLICATE_THRESHOLD = 0.85;
const HOUR = 60 * 60 * 1000;

export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, address, city, pincode, submittedVia } = req.body;

    if (!title || !description || !CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Title, description and a valid category are required" });
    }

    const files = req.files || [];
    const images = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer)));

    // 1. AI analysis and embedding (never blocks the complaint if it fails)
    const [analysis, embedding] = await Promise.all([
      classifyComplaint(title, description).catch((e) => {
        console.error("AI classify failed:", e.message);
        return null;
      }),
      getEmbedding(`${title}. ${description}`).catch((e) => {
        console.error("AI embedding failed:", e.message);
        return null;
      }),
    ]);

    // 2. Routing: trust the citizen's category, use AI only when they chose "Other"
    const routedCategory = category === "Other" && analysis?.category ? analysis.category : category;
    const priority = analysis?.priority || "medium";

    const department =
      (await Department.findOne({ categories: routedCategory, isActive: true })) ||
      (await Department.findOne({ code: "GRC" }));

    // 3. SLA deadline: urgent issues get half the time, high gets 75%
    let dueAt = null;
    if (department) {
      const factor = priority === "urgent" ? 0.5 : priority === "high" ? 0.75 : 1;
      dueAt = new Date(Date.now() + department.slaHours * factor * HOUR);
    }

    // 4. Duplicate detection against open complaints from the last 30 days
    let duplicateOf = null;
    let duplicateScore;
    if (embedding) {
      try {
        const since = new Date(Date.now() - 30 * 24 * HOUR);
        const candidates = await Complaint.find({
          category: routedCategory,
          status: { $nin: ["resolved", "rejected"] },
          createdAt: { $gte: since },
        })
          .select("+embedding")
          .limit(200);

        let best = 0;
        let bestId = null;
        for (const c of candidates) {
          const otherCity = c.location?.city?.toLowerCase();
          if (city && otherCity && city.toLowerCase() !== otherCity) continue;
          const score = cosineSimilarity(embedding, c.embedding);
          if (score > best) {
            best = score;
            bestId = c._id;
          }
        }
        if (best >= DUPLICATE_THRESHOLD) {
          duplicateOf = bestId;
          duplicateScore = Math.round(best * 100) / 100;
        }
      } catch (e) {
        console.error("Duplicate check failed:", e.message);
      }
    }

    const history = [{ status: "submitted", note: "Complaint submitted by citizen", by: req.user._id }];
    if (department) {
      history.push({ status: "submitted", note: `Auto-routed to ${department.name}` });
    }
    if (duplicateOf) {
      history.push({ status: "submitted", note: "Flagged as a possible duplicate of an existing complaint" });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      location: { address, city, pincode },
      submittedVia: submittedVia === "voice" ? "voice" : "text",
      images,
      citizen: req.user._id,
      department: department?._id || null,
      dueAt,
      embedding: embedding || undefined,
      ai: analysis
        ? {
            summary: analysis.summary,
            confidence: analysis.confidence,
            suggestedCategory: analysis.category,
            analyzed: true,
          }
        : { analyzed: false },
      duplicateOf,
      duplicateScore,
      history,
    });

    await complaint.populate("department", "name code");
        await notifyUser(req.user._id, {
      type: "complaint_submitted",
      title: "Complaint submitted",
      message: department
        ? `${complaint.complaintId} was filed and routed to ${department.name}.`
        : `${complaint.complaintId} was filed and is being processed.`,
      complaint: complaint._id,
    });
    if (department) {
      await notifyDepartment(department._id, {
        type: "new_complaint",
        title: "New complaint received",
        message: `${complaint.complaintId}: ${title} (${priority} priority)`,
        complaint: complaint._id,
      });
    }
    res.status(201).json({ complaint });
  } catch (error) {
    const code = error.name === "ValidationError" ? 400 : 500;
    res.status(code).json({ message: error.message });
  }
};

export const getMyComplaints = async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filter = { citizen: req.user._id };
    if (status && status !== "all") filter.status = status;
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { complaintId: rx }, { description: rx }];
    }

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .select("-history")
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ complaints, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyStats = async (req, res) => {
  try {
    const rows = await Complaint.aggregate([
      { $match: { citizen: req.user._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const c = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    res.json({
      total: rows.reduce((sum, r) => sum + r.count, 0),
      pending: c.submitted || 0,
      inProgress: (c.assigned || 0) + (c.in_progress || 0),
      resolved: c.resolved || 0,
      rejected: c.rejected || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, citizen: req.user._id })
      .populate("department", "name code")
      .populate("assignedTo", "name")
      .populate("history.by", "name role");

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json({ complaint });
  } catch (error) {
    const code = error.name === "CastError" ? 404 : 500;
    res.status(code).json({ message: code === 404 ? "Complaint not found" : error.message });
  }
};