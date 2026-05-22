import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";
import Book from "./Book.js";

const BorrowRecord = sequelize.define("BorrowRecord", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: "id" },
    onDelete: "CASCADE",
  },

  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Book, key: "id" },
    onDelete: "CASCADE",
  },

  borrowDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,  // set when approved
    defaultValue: null,
  },

  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,  // set when approved
    defaultValue: null,
  },

  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
  },

  // pending | borrowed | overdue | returned | rejected
  status: {
    type: DataTypes.ENUM("pending", "borrowed", "overdue", "returned", "rejected"),
    defaultValue: "pending",
  },

  // loan period requested by student
  loanDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
  },

  // Fine fields (populated when overdue)
  overdueDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },

  fineAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
  },

  // none | unpaid | paid
  fineStatus: {
    type: DataTypes.ENUM("none", "unpaid", "paid"),
    defaultValue: "none",
  },

  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },

  // Optional note from librarian on rejection
  rejectionNote: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },

  // Pending request expires at this datetime (24h after creation)
  requestExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
});

// Associations
BorrowRecord.belongsTo(User, { foreignKey: "userId", as: "borrower" });
BorrowRecord.belongsTo(Book, { foreignKey: "bookId", as: "book" });
User.hasMany(BorrowRecord, { foreignKey: "userId", as: "borrows" });
Book.hasMany(BorrowRecord, { foreignKey: "bookId", as: "borrows" });

export default BorrowRecord;
