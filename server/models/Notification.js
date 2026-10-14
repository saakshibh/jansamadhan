import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["complaint_submitted", "new_complaint", "status_update", "escalation"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
// Old notifications clean themselves up after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model("Notification", notificationSchema);