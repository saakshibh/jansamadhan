import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Department from "../models/Department.js";

const departments = [
  { name: "Public Works Department", code: "PWD", categories: ["Roads & Infrastructure"], slaHours: 96, description: "Roads, bridges, footpaths and public infrastructure" },
  { name: "Water Supply & Sewerage Board", code: "WSSB", categories: ["Water Supply"], slaHours: 48, description: "Drinking water, leakages and drainage" },
  { name: "Electricity Board", code: "ELEC", categories: ["Electricity"], slaHours: 24, description: "Power supply, streetlights and transformers" },
  { name: "Solid Waste Management Cell", code: "SWM", categories: ["Sanitation & Waste"], slaHours: 48, description: "Garbage collection and cleanliness" },
  { name: "Transport Department", code: "TRANS", categories: ["Public Transport"], slaHours: 72, description: "Buses, routes and traffic services" },
  { name: "Health Department", code: "HEALTH", categories: ["Healthcare"], slaHours: 48, description: "Public hospitals and health services" },
  { name: "Education Department", code: "EDU", categories: ["Education"], slaHours: 96, description: "Schools and education services" },
  { name: "Police Department", code: "POLICE", categories: ["Police & Safety"], slaHours: 24, description: "Safety, law and order" },
  { name: "Pollution Control Board", code: "PCB", categories: ["Environment"], slaHours: 96, description: "Pollution, noise and environment issues" },
  { name: "General Grievance Cell", code: "GRC", categories: ["Other"], slaHours: 72, description: "Everything that does not fit elsewhere" },
];

await connectDB();

for (const d of departments) {
  await Department.updateOne({ code: d.code }, { $set: d }, { upsert: true });
  console.log(`Saved: ${d.name}`);
}

await mongoose.disconnect();
console.log("Done! Departments are ready.");