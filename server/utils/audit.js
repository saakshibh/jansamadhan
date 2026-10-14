import AuditLog from "../models/AuditLog.js";

export const logAction = async (actor, action, targetType, targetId, details) => {
  try {
    await AuditLog.create({ actor: actor._id, action, targetType, targetId, details });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
};