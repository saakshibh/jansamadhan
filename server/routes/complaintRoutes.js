import express from "express";
import {
  createComplaint,
  getMyComplaints,
  getMyStats,
  getComplaintById,
} from "../controllers/complaintController.js";
import { protect } from "../middleware/auth.js";
import { uploadImages } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/", uploadImages, createComplaint);
router.get("/", getMyComplaints);
router.get("/stats", getMyStats);
router.get("/:id", getComplaintById);

export default router;