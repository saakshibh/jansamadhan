import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Complaint from "../models/Complaint.js";

const hours = Number(process.argv[2]) || 2;

await connectDB();

const c = await Complaint.findOne({ status: { $nin: ["resolved", "rejected"] } }).sort({ createdAt: -1 });

if (!c) {
  console.log("No open complaint found. File one first.");
} else {
  c.dueAt = new Date(Date.now() - hours * 60 * 60 * 1000);
  await c.save();
  console.log(`Made ${c.complaintId} overdue by ${hours} hours`);
}

await mongoose.disconnect();