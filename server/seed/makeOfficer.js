import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

const [email, code] = process.argv.slice(2);

await connectDB();

const departments = await Department.find().select("code");
const validCodes = departments.map((d) => d.code).join(", ");

if (!email || !code) {
  console.log("Usage: node seed/makeOfficer.js <email> <DEPARTMENT_CODE>");
  console.log(`Valid codes: ${validCodes}`);
} else {
  const user = await User.findOne({ email: email.toLowerCase() });
  const dept = await Department.findOne({ code: code.toUpperCase() });

  if (!user) {
    console.log(`No user found with email ${email}`);
  } else if (!dept) {
    console.log(`No department with code ${code}. Valid codes: ${validCodes}`);
  } else {
    user.role = "officer";
    user.department = dept._id;
    await user.save();
    console.log(`${user.email} is now an officer of ${dept.name}`);
  }
}

await mongoose.disconnect();