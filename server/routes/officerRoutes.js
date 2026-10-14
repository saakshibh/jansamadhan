import express from "express";
import {
  getQueue,
  getOfficerStats,
  getOfficerComplaint,
  updateStatus,
} from "../controllers/officerController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("officer", "admin", "superadmin"));

router.get("/stats", getOfficerStats);
router.get("/complaints", getQueue);
router.get("/complaints/:id", getOfficerComplaint);
router.patch("/complaints/:id/status", updateStatus);

export default router;