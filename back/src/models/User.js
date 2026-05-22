import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false, // unique index already exists in DB, managed manually
  },

  password: {
    type: DataTypes.STRING,
    allowNull: true, // null for OAuth users
  },

  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false, // unique index already exists in DB, managed manually
  },

  role: {
    type: DataTypes.ENUM("admin", "librarian", "student", "faculty", "staff"),
    defaultValue: "student",
  },

  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },

  // Profile fields
  sex: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  userType: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  studentNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false, // unique index already exists in DB, managed manually
  },

  profileComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default User;
