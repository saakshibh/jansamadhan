import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitToUser } from "./socket.js";

// None of these ever throw, so a notification problem can never break a complaint.

export const notifyUser = async (userId, { type, title, message, complaint }) => {
  try {
    if (!userId) return;
    const n = await Notification.create({
      user: userId,
      type,
      title,
      message,
      complaint: complaint || null,
    });
    emitToUser(userId, "notification", n);
  } catch (error) {
    console.error("Notify failed:", error.message);
  }
};

const notifyMany = async (ids, payload) => {
  await Promise.all(ids.map((id) => notifyUser(id, payload)));
};

export const notifyDepartment = async (departmentId, payload) => {
  try {
    if (!departmentId) return;
    const officers = await User.find({ role: "officer", department: departmentId, isActive: true }).select("_id");
    await notifyMany(officers.map((o) => o._id), payload);
  } catch (error) {
    console.error("Notify department failed:", error.message);
  }
};

export const notifyAdmins = async (payload) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] }, isActive: true }).select("_id");
    await notifyMany(admins.map((a) => a._id), payload);
  } catch (error) {
    console.error("Notify admins failed:", error.message);
  }
};