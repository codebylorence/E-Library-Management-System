import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const AttendanceRecord = sequelize.define("AttendanceRecord", {
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

  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  timeIn: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Associations
AttendanceRecord.belongsTo(User, { foreignKey: "userId", as: "student" });
User.hasMany(AttendanceRecord, { foreignKey: "userId", as: "attendances" });

export default AttendanceRecord;
