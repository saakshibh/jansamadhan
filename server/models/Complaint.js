import mongoose from "mongoose";

export const CATEGORIES = [
  "Roads & Infrastructure",
  "Water Supply",
  "Electricity",
  "Sanitation & Waste",
  "Public Transport",
  "Healthcare",
  "Education",
  "Police & Safety",
  "Environment",
  "Other",
];

export const STATUSES = ["submitted", "assigned", "in_progress", "resolved", "rejected"];

const historySchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true },
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 120 },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: 2000,
    },
    category: { type: String, enum: CATEGORIES, required: [true, "Category is required"] },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: { type: String, enum: STATUSES, default: "submitted" },
    location: {
      address: { type: String, required: [true, "Address is required"], trim: true },
      city: { type: String, default: "", trim: true },
      pincode: { type: String, default: "", trim: true },
    },
    images: [{ _id: false, url: String, publicId: String }],
    submittedVia: { type: String, enum: ["text", "voice"], default: "text" },
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    history: [historySchema],
        embedding: { type: [Number], select: false },
    ai: {
      summary: String,
      confidence: Number,
      suggestedCategory: String,
      analyzed: { type: Boolean, default: false },
    },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null },
    duplicateScore: Number,
    dueAt: Date,
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: Date,
    escalationLevel: { type: Number, default: 0 },
    escalatedAt: Date,
  },
  { timestamps: true }
);

complaintSchema.index({ citizen: 1, createdAt: -1 });

complaintSchema.pre("validate", function () {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    this.complaintId = `JS-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
});

export default mongoose.model("Complaint", complaintSchema);
complaintSchema.virtual("isOverdue").get(function () {
  return (
    !!this.dueAt &&
    !["resolved", "rejected"].includes(this.status) &&
    this.dueAt < new Date()
  );
});

complaintSchema.set("toJSON", { virtuals: true });