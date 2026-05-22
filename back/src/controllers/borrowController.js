import { Op } from "sequelize";
import BorrowRecord from "../models/BorrowRecord.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import AttendanceRecord from "../models/AttendanceRecord.js";

const DAILY_FINE_RATE   = 5;   // ₱5 per day
const DEFAULT_LOAN_DAYS = 7;
const REQUEST_EXPIRY_HOURS = 24; // pending requests expire after 24 hours

/* ── helpers ─────────────────────────────────── */
const today = () => new Date().toISOString().split("T")[0];

const daysBetween = (dateA, dateB) => {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.max(0, Math.floor((b - a) / (1000 * 60 * 60 * 24)));
};

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

// Auto-expire pending requests whose requestExpiresAt has passed
const expirePendingRequests = async () => {
  await BorrowRecord.update(
    { status: "rejected", rejectionNote: "Request expired — not picked up within 24 hours." },
    { where: { status: "pending", requestExpiresAt: { [Op.lt]: new Date() } } }
  );
};

const enrichRecord = (record) => {
  const r = record.toJSON ? record.toJSON() : { ...record };
  if ((r.status === "overdue" || (r.status === "borrowed" && today() > r.dueDate)) && r.dueDate) {
    const refDate = r.returnDate || today();
    r.overdueDays = daysBetween(r.dueDate, refDate);
    r.fineAmount  = +(r.overdueDays * DAILY_FINE_RATE).toFixed(2);
  }
  // Add human-readable expiry info for pending requests
  if (r.status === "pending" && r.requestExpiresAt) {
    const msLeft = new Date(r.requestExpiresAt) - new Date();
    r.expiresInMinutes = Math.max(0, Math.floor(msLeft / 60000));
  }
  return r;
};

const userAttributes = ["id", "fullName", "email", "studentNumber", "userType"];
const bookAttributes  = ["id", "title", "author", "coverImage", "isbn", "shelfLocation", "materialType"];

/* ── REQUEST BORROW (student) ────────────────── */
export const borrowBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, loanDays = DEFAULT_LOAN_DAYS } = req.body;

    if (loanDays < 7 || loanDays > 14) {
      return res.status(400).json({ message: "Loan period must be between 7 and 14 days." });
    }

    const book = await Book.findByPk(bookId);
    if (!book) return res.status(404).json({ message: "Book not found." });
    if (book.materialType !== "Library Books") {
      return res.status(400).json({ message: "Only physical Library Books can be borrowed." });
    }
    if (!book.availableCopies || book.availableCopies <= 0) {
      return res.status(400).json({ message: "No copies available for this book." });
    }

    // No active or pending borrow of the same book
    const activeBorrow = await BorrowRecord.findOne({
      where: { userId, bookId, status: { [Op.in]: ["pending", "borrowed", "overdue"] } },
    });
    if (activeBorrow) {
      return res.status(400).json({ message: "You already have an active or pending borrow for this book." });
    }

    // No unpaid fines
    const unpaidFine = await BorrowRecord.findOne({ where: { userId, fineStatus: "unpaid" } });
    if (unpaidFine) {
      return res.status(400).json({
        message: "You have unpaid fines. Please settle them at the library before borrowing.",
      });
    }

    // Must have attendance record for today
    const todayDate = today();
    const hasAttendance = await AttendanceRecord.findOne({ where: { userId, date: todayDate } });
    if (!hasAttendance) {
      return res.status(403).json({
        message: "You must be logged in the library attendance today before borrowing a book.",
        requiresAttendance: true,
      });
    }

    // Create pending request — dates set on approval
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + REQUEST_EXPIRY_HOURS);

    const record = await BorrowRecord.create({
      userId, bookId, loanDays, status: "pending",
      requestExpiresAt: expiresAt,
    });

    res.status(201).json({ message: "Borrow request submitted. Please pick up the book within 24 hours after approval.", borrow: record });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit borrow request.", error: err.message });
  }
};

/* ── CANCEL BORROW (student) ─────────────────── */
export const cancelBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const record = await BorrowRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: "Borrow record not found." });
    if (record.userId !== userId) return res.status(403).json({ message: "Unauthorized." });
    if (record.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be cancelled." });
    }

    await record.update({ status: "rejected", rejectionNote: "Cancelled by student." });

    res.status(200).json({ message: "Borrow request cancelled." });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel borrow request.", error: err.message });
  }
};

/* ── APPROVE BORROW (librarian/admin) ────────── */
export const approveBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await BorrowRecord.findByPk(id, {
      include: [{ model: Book, as: "book" }],
    });

    if (!record) return res.status(404).json({ message: "Borrow record not found." });
    if (record.status !== "pending") {
      return res.status(400).json({ message: `Cannot approve a record with status "${record.status}".` });
    }

    // Check if request has expired
    if (record.requestExpiresAt && new Date() > new Date(record.requestExpiresAt)) {
      await record.update({ status: "rejected", rejectionNote: "Request expired — not picked up within 24 hours." });
      return res.status(400).json({ message: "This borrow request has expired." });
    }

    const book = record.book;
    if (!book.availableCopies || book.availableCopies <= 0) {
      return res.status(400).json({ message: "No copies available. Cannot approve." });
    }

    const borrowDate = today();
    const dueDate    = addDays(borrowDate, record.loanDays);

    await record.update({ status: "borrowed", borrowDate, dueDate });

    // Decrement copies
    const newCopies = book.availableCopies - 1;
    await book.update({
      availableCopies: newCopies,
      status: newCopies <= 0 ? "unavailable" : "available",
    });

    res.status(200).json({ message: "Borrow request approved.", borrow: record });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve borrow.", error: err.message });
  }
};

/* ── REJECT BORROW (librarian/admin) ─────────── */
export const rejectBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const record = await BorrowRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: "Borrow record not found." });
    if (record.status !== "pending") {
      return res.status(400).json({ message: `Cannot reject a record with status "${record.status}".` });
    }

    await record.update({ status: "rejected", rejectionNote: note || null });

    res.status(200).json({ message: "Borrow request rejected.", borrow: record });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject borrow.", error: err.message });
  }
};

/* ── RETURN (student or librarian) ───────────── */
export const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId   = req.user.id;
    const requesterRole = req.user.role;

    const record = await BorrowRecord.findByPk(id, {
      include: [{ model: Book, as: "book" }],
    });

    if (!record) return res.status(404).json({ message: "Borrow record not found." });
    if (record.status === "returned") {
      return res.status(400).json({ message: "This book has already been returned." });
    }
    if (record.status === "pending" || record.status === "rejected") {
      return res.status(400).json({ message: "Cannot return a book that was never borrowed." });
    }
    if (record.userId !== requesterId && !["admin", "librarian"].includes(requesterRole)) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const returnDate  = today();
    const isLate      = returnDate > record.dueDate;
    const overdueDays = isLate ? daysBetween(record.dueDate, returnDate) : 0;
    const fineAmount  = isLate ? +(overdueDays * DAILY_FINE_RATE).toFixed(2) : 0;

    await record.update({
      returnDate,
      status:      "returned",
      overdueDays: isLate ? overdueDays : null,
      fineAmount:  isLate ? fineAmount  : null,
      fineStatus:  isLate ? "unpaid"    : "none",
    });

    const book      = record.book;
    const newCopies = (book.availableCopies || 0) + 1;
    await book.update({ availableCopies: newCopies, status: "available" });

    res.status(200).json({
      message: isLate
        ? `Book returned late. Fine: ₱${fineAmount.toFixed(2)}`
        : "Book returned on time.",
      borrow: record,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to return book.", error: err.message });
  }
};

/* ── MARK FINE PAID (librarian/admin) ────────── */
export const markFinePaid = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await BorrowRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: "Borrow record not found." });
    if (record.fineStatus === "none")  return res.status(400).json({ message: "This record has no fine." });
    if (record.fineStatus === "paid")  return res.status(400).json({ message: "Fine already marked as paid." });

    await record.update({ fineStatus: "paid", paidAt: new Date() });
    res.status(200).json({ message: "Fine marked as paid.", borrow: record });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark fine as paid.", error: err.message });
  }
};

/* ── QUICK BORROW (librarian creates book + borrow in one step) ── */
export const quickBorrow = async (req, res) => {
  const t = await BorrowRecord.sequelize.transaction();
  try {
    const {
      // Book fields
      title, author, category, publishedYear, isbn,
      quantity = 1, shelfLocation, publisher, description, coverImage,
      // Borrow fields
      userId, loanDays = DEFAULT_LOAN_DAYS,
    } = req.body;

    if (!title || !author || !category || !publishedYear) {
      await t.rollback();
      return res.status(400).json({ message: "Book title, author, category, and year are required." });
    }
    if (!userId) {
      await t.rollback();
      return res.status(400).json({ message: "Borrower (userId) is required." });
    }
    if (loanDays < 7 || loanDays > 14) {
      await t.rollback();
      return res.status(400).json({ message: "Loan period must be between 7 and 14 days." });
    }

    // Check borrower has no unpaid fines
    const unpaidFine = await BorrowRecord.findOne({ where: { userId, fineStatus: "unpaid" } });
    if (unpaidFine) {
      await t.rollback();
      return res.status(400).json({ message: "Borrower has unpaid fines. Please settle them first." });
    }

    // Create or find the book
    let book;
    if (isbn) {
      book = await Book.findOne({ where: { isbn }, transaction: t });
    }

    if (!book) {
      const qty = Number(quantity);
      book = await Book.create({
        title, author, category,
        publishedYear: Number(publishedYear),
        isbn: isbn || null,
        quantity: qty,
        availableCopies: qty,
        shelfLocation: shelfLocation || null,
        publisher: publisher || null,
        description: description || null,
        coverImage: coverImage || null,
        materialType: "Library Books",
        status: "available",
      }, { transaction: t });
    }

    // Check availability
    if (!book.availableCopies || book.availableCopies <= 0) {
      await t.rollback();
      return res.status(400).json({ message: "No copies available for this book." });
    }

    // Check no active borrow of same book
    const activeBorrow = await BorrowRecord.findOne({
      where: { userId, bookId: book.id, status: { [Op.in]: ["pending", "borrowed", "overdue"] } },
    });
    if (activeBorrow) {
      await t.rollback();
      return res.status(400).json({ message: "Borrower already has an active borrow for this book." });
    }

    // Create borrow record — immediately approved (librarian is doing this in person)
    const borrowDate = today();
    const dueDate    = addDays(borrowDate, Number(loanDays));

    const record = await BorrowRecord.create({
      userId, bookId: book.id,
      borrowDate, dueDate, loanDays,
      status: "borrowed",
    }, { transaction: t });

    // Decrement copies
    const newCopies = book.availableCopies - 1;
    await book.update({
      availableCopies: newCopies,
      status: newCopies <= 0 ? "unavailable" : "available",
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      message: "Book added and borrow recorded successfully.",
      book,
      borrow: record,
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: "Quick borrow failed.", error: err.message });
  }
};
/* ── BORROW CHART DATA (admin/librarian) ─────── */
export const getBorrowChartData = async (req, res) => {
  try {
    // Last 7 days daily borrow counts
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = await BorrowRecord.count({
        where: { borrowDate: dateStr, status: { [Op.in]: ["borrowed", "overdue", "returned"] } },
      });
      daily.push({
        date: d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
        borrows: count,
      });
    }

    // Last 4 weeks weekly borrow counts
    const weekly = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const count = await BorrowRecord.count({
        where: {
          borrowDate: { [Op.between]: [start.toISOString().split("T")[0], end.toISOString().split("T")[0]] },
          status: { [Op.in]: ["borrowed", "overdue", "returned"] },
        },
      });
      weekly.push({
        week: `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`,
        borrows: count,
      });
    }

    res.json({ daily, weekly });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch borrow chart data.", error: err.message });
  }
};

/* ── MY BORROWS (student) ────────────────────── */
export const getMyBorrows = async (req, res) => {
  try {
    const userId = req.user.id;

    await expirePendingRequests();
    await BorrowRecord.update(
      { status: "overdue" },
      { where: { userId, status: "borrowed", dueDate: { [Op.lt]: today() } } }
    );

    const records = await BorrowRecord.findAll({
      where: { userId },
      include: [{ model: Book, as: "book", attributes: bookAttributes }],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ borrows: records.map(enrichRecord) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch borrow history.", error: err.message });
  }
};

/* ── ALL BORROWS (admin/librarian) ───────────── */
export const getAllBorrows = async (req, res) => {
  try {
    const { status, userId } = req.query;

    await expirePendingRequests();
    await BorrowRecord.update(
      { status: "overdue" },
      { where: { status: "borrowed", dueDate: { [Op.lt]: today() } } }
    );

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const records = await BorrowRecord.findAll({
      where,
      include: [
        { model: User, as: "borrower", attributes: userAttributes },
        { model: Book, as: "book",     attributes: bookAttributes  },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ borrows: records.map(enrichRecord) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch borrow records.", error: err.message });
  }
};

/* ── STATS (admin/librarian) ─────────────────── */
export const getBorrowStats = async (req, res) => {
  try {
    await expirePendingRequests();
    await BorrowRecord.update(
      { status: "overdue" },
      { where: { status: "borrowed", dueDate: { [Op.lt]: today() } } }
    );

    const [pending, totalBorrowed, totalOverdue, totalUnpaidFines, totalPaidFines] = await Promise.all([
      BorrowRecord.count({ where: { status: "pending" } }),
      BorrowRecord.count({ where: { status: { [Op.in]: ["borrowed", "overdue"] } } }),
      BorrowRecord.count({ where: { status: "overdue" } }),
      BorrowRecord.count({ where: { fineStatus: "unpaid" } }),
      BorrowRecord.count({ where: { fineStatus: "paid" } }),
    ]);

    res.status(200).json({ pending, totalBorrowed, totalOverdue, totalUnpaidFines, totalPaidFines });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats.", error: err.message });
  }
};
