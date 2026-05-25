import express from "express";
import {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  approveReservation,
  rejectReservation,
  getReservationStats,
} from "../controllers/reservationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Stats — must come before /:id routes
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getReservationStats
);

// Admin/Librarian: all reservations (supports ?status=, ?date=, ?month=YYYY-MM)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getAllReservations
);

// Faculty: submit a reservation
router.post(
  "/",
  authMiddleware,
  roleMiddleware("faculty"),
  createReservation
);

// Faculty: my reservations
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("faculty"),
  getMyReservations
);

// Faculty: cancel a reservation
router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("faculty"),
  cancelReservation
);

// Admin/Librarian: approve
router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  approveReservation
);

// Admin/Librarian: reject
router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  rejectReservation
);

export default router;
