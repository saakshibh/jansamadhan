import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const name = process.env.ADMIN_NAME || "System Admin";

if (!email.endsWith("@jansamadhan.in")) {
  console.error("Set ADMIN_EMAIL in .env to an address ending with @jansamadhan.in");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Set ADMIN_PASSWORD in .env (at least 10 characters)");
  process.exit(1);
}

await connectDB();

const existing = await User.findOne({ email });

if (existing) {
  existing.password = password;
  existing.role = "superadmin";
  existing.department = null;
  existing.isActive = true;
  existing.mustChangePassword = false;
  await existing.save();
  console.log(`Updated the super admin account: ${email}`);
} else {
  await User.create({ name, email, password, role: "superadmin" });
  console.log(`Created the super admin account: ${email}`);
}

await mongoose.disconnect();