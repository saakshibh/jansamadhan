import express from "express";
import {
  getAnalytics,
  getUsers,
  createStaff,
  updateUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  getAuditLogs,
  getActivity,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("admin", "superadmin"));

router.get("/analytics", getAnalytics);

router.get("/users", getUsers);
router.post("/users", createStaff);
router.patch("/users/:id", updateUser);

router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.patch("/departments/:id", updateDepartment);

router.get("/audit", getAuditLogs);
router.get("/activity", getActivity);

export default router;