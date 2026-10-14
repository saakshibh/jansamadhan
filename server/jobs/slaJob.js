import cron from "node-cron";
import Complaint from "../models/Complaint.js";
import { notifyUser, notifyDepartment, notifyAdmins } from "../utils/notify.js";

const HOUR = 60 * 60 * 1000;

export const runSlaCheck = async () => {
  const now = new Date();
  const overdue = await Complaint.find({
    dueAt: { $lt: now },
    status: { $nin: ["resolved", "rejected"] },
  });

  let count = 0;
  for (const c of overdue) {
    const hoursLate = (now - c.dueAt) / HOUR;
    const level = hoursLate >= 24 ? 2 : 1;
    if (level <= (c.escalationLevel || 0)) continue;

    c.escalationLevel = level;
    c.escalatedAt = now;
    if (level === 2) c.priority = "urgent";

    c.history.push({
      status: c.status,
      note:
        level === 1
          ? "SLA deadline missed. Escalated to the department head (Level 1)."
          : "Still unresolved 24 hours after the deadline. Escalated to senior administration (Level 2) and marked urgent.",
    });

    await c.save();
        const alert = {
      type: "escalation",
      title: level === 1 ? "SLA deadline missed" : "Escalated to senior administration",
      message: `${c.complaintId}: ${c.title}`,
      complaint: c._id,
    };
    await notifyDepartment(c.department, alert);
    if (level === 2) await notifyAdmins(alert);
    await notifyUser(c.citizen, {
      ...alert,
      title: "Your complaint was escalated",
      message: `${c.complaintId} passed its deadline and has been escalated for faster action.`,
    });
    count++;
  }

  if (count) console.log(`SLA check: escalated ${count} complaint(s)`);
};

export const startSlaJob = () => {
  runSlaCheck().catch((e) => console.error("SLA check failed:", e.message));
  cron.schedule("*/5 * * * *", () => {
    runSlaCheck().catch((e) => console.error("SLA check failed:", e.message));
  });
  console.log("SLA monitor started (checks every 5 minutes)");
};