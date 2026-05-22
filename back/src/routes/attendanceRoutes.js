import express from "express";
import {
  getMyQR,
  scanAttendance,
  getAllAttendance,
  getAttendanceStats,
  getAttendanceChartData,
  getMyAttendance,
} from "../controllers/attendanceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Stats must come before parameterized routes
router.get("/stats", authMiddleware, roleMiddleware("admin", "librarian"), getAttendanceStats);

// Chart data
router.get("/chart", authMiddleware, roleMiddleware("admin", "librarian"), getAttendanceChartData);

// Admin/Librarian: all attendance records (with filters)
router.get("/", authMiddleware, roleMiddleware("admin", "librarian"), getAllAttendance);

// Admin/Librarian: process a QR scan
router.post("/scan", authMiddleware, roleMiddleware("admin", "librarian"), scanAttendance);

// Student: get own QR code
router.get("/qr", authMiddleware, getMyQR);

// Student: own attendance history
router.get("/my", authMiddleware, getMyAttendance);

export default router;
