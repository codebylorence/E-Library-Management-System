import express from "express";
import {
  borrowBook,
  cancelBorrow,
  approveBorrow,
  rejectBorrow,
  returnBook,
  markFinePaid,
  getMyBorrows,
  getAllBorrows,
  getBorrowStats,
  getBorrowChartData,
  quickBorrow,
} from "../controllers/borrowController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Stats must come before /:id routes
router.get("/stats", authMiddleware, roleMiddleware("admin", "librarian"), getBorrowStats);

// Chart data
router.get("/chart", authMiddleware, roleMiddleware("admin", "librarian"), getBorrowChartData);

// Admin/Librarian: quick borrow — create book + borrow in one step
router.post("/quick", authMiddleware, roleMiddleware("admin", "librarian"), quickBorrow);

// Student: submit borrow request
router.post("/", authMiddleware, borrowBook);

// Student: my history
router.get("/my", authMiddleware, getMyBorrows);

// Student: cancel a pending request
router.patch("/:id/cancel", authMiddleware, cancelBorrow);

// Admin/Librarian: all borrows
router.get("/", authMiddleware, roleMiddleware("admin", "librarian"), getAllBorrows);

// Admin/Librarian: approve a pending request
router.patch("/:id/approve", authMiddleware, roleMiddleware("admin", "librarian"), approveBorrow);

// Admin/Librarian: reject a pending request
router.patch("/:id/reject", authMiddleware, roleMiddleware("admin", "librarian"), rejectBorrow);

// Student or Librarian: return a book
router.patch("/:id/return", authMiddleware, returnBook);

// Admin/Librarian: mark fine as paid
router.patch("/:id/pay-fine", authMiddleware, roleMiddleware("admin", "librarian"), markFinePaid);

export default router;
