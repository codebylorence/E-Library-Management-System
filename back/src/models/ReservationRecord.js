import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const ReservationRecord = sequelize.define("ReservationRecord", {
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

  // Date of the reservation
  reservationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  // Time slot (e.g. "09:00", "14:30")
  startTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  endTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // What the faculty member needs the library for
  purpose: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  // Number of expected attendees
  attendees: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },

  // pending | approved | rejected | cancelled | completed
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled", "completed"),
    defaultValue: "pending",
  },

  // Admin/librarian note on approval or rejection
  adminNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
});

// Associations
ReservationRecord.belongsTo(User, { foreignKey: "userId", as: "requester" });
User.hasMany(ReservationRecord, { foreignKey: "userId", as: "reservations" });

export default ReservationRecord;
