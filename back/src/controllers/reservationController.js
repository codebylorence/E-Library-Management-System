import { Op } from "sequelize";
import ReservationRecord from "../models/ReservationRecord.js";
import User from "../models/User.js";

const userAttributes = ["id", "fullName", "email", "userType", "role"];

// Philippine Time date helper
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

/* ── CREATE RESERVATION (faculty) ─────────────── */
export const createReservation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reservationDate, startTime, endTime, purpose, attendees } = req.body;

    if (!reservationDate || !startTime || !endTime || !purpose) {
      return res.status(400).json({ message: "Date, start time, end time, and purpose are required." });
    }

    // Must be a future date (or today)
    if (reservationDate < today()) {
      return res.status(400).json({ message: "Reservation date must be today or in the future." });
    }

    // Validate time order
    if (startTime >= endTime) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    // Check for overlapping approved/pending reservations on the same date
    const overlap = await ReservationRecord.findOne({
      where: {
        reservationDate,
        status: { [Op.in]: ["pending", "approved"] },
        [Op.or]: [
          { startTime: { [Op.between]: [startTime, endTime] } },
          { endTime:   { [Op.between]: [startTime, endTime] } },
          {
            startTime: { [Op.lte]: startTime },
            endTime:   { [Op.gte]: endTime },
          },
        ],
      },
    });

    if (overlap) {
      return res.status(409).json({
        message: "This time slot overlaps with an existing reservation. Please choose a different time.",
      });
    }

    // Check if user already has a pending/approved reservation on the same date
    const existing = await ReservationRecord.findOne({
      where: {
        userId,
        reservationDate,
        status: { [Op.in]: ["pending", "approved"] },
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "You already have a pending or approved reservation on this date.",
      });
    }

    const record = await ReservationRecord.create({
      userId,
      reservationDate,
      startTime,
      endTime,
      purpose,
      attendees: attendees || 1,
    });

    res.status(201).json({ message: "Reservation request submitted successfully.", reservation: record });
  } catch (err) {
    res.status(500).json({ message: "Failed to create reservation.", error: err.message });
  }
};

/* ── MY RESERVATIONS (faculty) ────────────────── */
export const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Auto-complete past approved reservations
    await ReservationRecord.update(
      { status: "completed" },
      {
        where: {
          userId,
          status: "approved",
          reservationDate: { [Op.lt]: today() },
        },
      }
    );

    const records = await ReservationRecord.findAll({
      where: { userId },
      order: [["reservationDate", "DESC"], ["startTime", "ASC"]],
    });

    res.status(200).json({ reservations: records });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations.", error: err.message });
  }
};

/* ── CANCEL RESERVATION (faculty) ─────────────── */
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await ReservationRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: "Reservation not found." });
    if (record.userId !== userId) return res.status(403).json({ message: "Unauthorized." });
    if (!["pending", "approved"].includes(record.status)) {
      return res.status(400).json({ message: "Only pending or approved reservations can be cancelled." });
    }

    await record.update({ status: "cancelled" });
    res.status(200).json({ message: "Reservation cancelled." });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel reservation.", error: err.message });
  }
};

/* ── ALL RESERVATIONS (admin/librarian) ────────── */
export const getAllReservations = async (req, res) => {
  try {
    const { status, date, month } = req.query;

    // Auto-complete past approved reservations
    await ReservationRecord.update(
      { status: "completed" },
      {
        where: {
          status: "approved",
          reservationDate: { [Op.lt]: today() },
        },
      }
    );

    const where = {};
    if (status) where.status = status;
    if (date)   where.reservationDate = date;
    if (month) {
      // month format: "YYYY-MM"
      where.reservationDate = {
        [Op.between]: [`${month}-01`, `${month}-31`],
      };
    }

    const records = await ReservationRecord.findAll({
      where,
      include: [{ model: User, as: "requester", attributes: userAttributes }],
      order: [["reservationDate", "ASC"], ["startTime", "ASC"]],
    });

    res.status(200).json({ reservations: records });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations.", error: err.message });
  }
};

/* ── APPROVE RESERVATION (admin/librarian) ─────── */
export const approveReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const record = await ReservationRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: "Reservation not found." });
    if (record.status !== "pending") {
      return res.status(400).json({ message: `Cannot approve a reservation with status "${record.status}".` });
    }

    await record.update({ status: "approved", adminNote: note || null });
    res.status(200).json({ message: "Reservation approved.", reservation: record });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve reservation.", error: err.message });
  }
};

/* ── REJECT RESERVATION (admin/librarian) ──────── */
export const rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const record = await ReservationRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: "Reservation not found." });
    if (record.status !== "pending") {
      return res.status(400).json({ message: `Cannot reject a reservation with status "${record.status}".` });
    }

    await record.update({ status: "rejected", adminNote: note || null });
    res.status(200).json({ message: "Reservation rejected.", reservation: record });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject reservation.", error: err.message });
  }
};

/* ── RESERVATION STATS (admin/librarian) ────────── */
export const getReservationStats = async (req, res) => {
  try {
    const [pending, approved, rejected, completed, cancelled] = await Promise.all([
      ReservationRecord.count({ where: { status: "pending" } }),
      ReservationRecord.count({ where: { status: "approved" } }),
      ReservationRecord.count({ where: { status: "rejected" } }),
      ReservationRecord.count({ where: { status: "completed" } }),
      ReservationRecord.count({ where: { status: "cancelled" } }),
    ]);

    res.status(200).json({ pending, approved, rejected, completed, cancelled });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservation stats.", error: err.message });
  }
};
