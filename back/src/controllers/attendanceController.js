import QRCode from "qrcode";
import { Op } from "sequelize";
import AttendanceRecord from "../models/AttendanceRecord.js";
import User from "../models/User.js";

/* ── helpers ─────────────────────────────────── */
// Use Philippine Time (UTC+8) to get the correct local date
const todayStr = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }); // "en-CA" gives YYYY-MM-DD format

const nowTimeStr = () =>
  new Date().toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const userAttributes = ["id", "fullName", "email", "studentNumber", "userType", "role", "status"];

/* ── GET /attendance/qr  (student: get own QR code) ─── */
export const getMyQR = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: userAttributes,
    });
    if (!user) return res.status(404).json({ message: "User not found." });

    // QR payload: just the user id — simple and stable
    const payload = JSON.stringify({ uid: user.id });
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: { dark: "#227325", light: "#ffffff" },
    });

    res.json({ qr: qrDataUrl, user });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate QR.", error: err.message });
  }
};

/* ── POST /attendance/scan  (admin/librarian: scan a QR) ─── */
export const scanAttendance = async (req, res) => {
  try {
    const { payload } = req.body;

    if (!payload) return res.status(400).json({ message: "QR payload is required." });

    let uid;
    try {
      const parsed = JSON.parse(payload);
      uid = parsed.uid;
    } catch {
      return res.status(400).json({ message: "Invalid QR code." });
    }

    if (!uid) return res.status(400).json({ message: "Invalid QR code — missing user ID." });

    const student = await User.findByPk(uid, { attributes: userAttributes });
    if (!student) return res.status(404).json({ message: "Student not found." });

    const date = todayStr();
    const time = nowTimeStr();

    // 1 attendance per day restriction
    const existing = await AttendanceRecord.findOne({ where: { userId: uid, date } });
    if (existing) {
      return res.status(409).json({
        message: `${student.fullName} already has attendance recorded for today.`,
        alreadyRecorded: true,
        student,
      });
    }

    const record = await AttendanceRecord.create({
      userId: uid,
      date,
      timeIn: time,
    });

    res.status(201).json({
      action: "in",
      message: `Attendance recorded for ${student.fullName}.`,
      record,
      student,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to record attendance.", error: err.message });
  }
};

/* ── GET /attendance  (admin/librarian: all records with filters) ─── */
export const getAllAttendance = async (req, res) => {
  try {
    const { date, dateFrom, dateTo, search, page = 1, limit = 50 } = req.query;
    const where = {};

    // Support both single date (legacy) and date range
    if (date) {
      where.date = date;
    } else if (dateFrom || dateTo) {
      if (dateFrom && dateTo) {
        where.date = { [Op.between]: [dateFrom, dateTo] };
      } else if (dateFrom) {
        where.date = { [Op.gte]: dateFrom };
      } else {
        where.date = { [Op.lte]: dateTo };
      }
    }

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { fullName:     { [Op.like]: `%${search}%` } },
        { email:        { [Op.like]: `%${search}%` } },
        { studentNumber:{ [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where,
      include: [{ model: User, as: "student", attributes: userAttributes, where: userWhere }],
      order: [["date", "DESC"], ["timeIn", "DESC"]],
      limit: Number(limit),
      offset,
    });

    res.json({ total: count, page: Number(page), records: rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attendance.", error: err.message });
  }
};

/* ── GET /attendance/stats  (admin/librarian: today's summary) ─── */
export const getAttendanceStats = async (req, res) => {
  try {
    const date = todayStr();
    const todayTotal = await AttendanceRecord.count({ where: { date } });
    res.json({ date, todayTotal });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats.", error: err.message });
  }
};

/* ── GET /attendance/chart  (admin/librarian: monthly chart data) ─── */
export const getAttendanceChartData = async (req, res) => {
  try {
    const date = todayStr();

    // Today's hourly breakdown (how many scans per hour)
    const todayRecords = await AttendanceRecord.findAll({
      where: { date },
      attributes: ["timeIn"],
    });

    const hourly = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 7; // 7 AM to 6 PM
      const label = new Date(2000, 0, 1, hour).toLocaleTimeString("en-PH", { hour: "numeric", hour12: true });
      const count = todayRecords.filter((r) => {
        if (!r.timeIn) return false;
        // parse hour from "9:24 AM" or "10:05 AM"
        const match = r.timeIn.match(/(\d+):\d+\s*(AM|PM)/i);
        if (!match) return false;
        let h = parseInt(match[1]);
        const period = match[2].toUpperCase();
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return h === hour;
      }).length;
      return { hour: label, visitors: count };
    });

    // Last 30 days daily attendance
    const monthly = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
      const count = await AttendanceRecord.count({ where: { date: dateStr } });
      monthly.push({
        date: d.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric" }),
        visitors: count,
      });
    }

    res.json({ hourly, monthly });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attendance chart data.", error: err.message });
  }
};
export const getMyAttendance = async (req, res) => {
  try {
    const records = await AttendanceRecord.findAll({
      where: { userId: req.user.id },
      order: [["date", "DESC"], ["timeIn", "DESC"]],
      limit: 60,
    });
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attendance.", error: err.message });
  }
};
