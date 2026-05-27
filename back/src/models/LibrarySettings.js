import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Single-row settings table — always upsert row with id=1
const LibrarySettings = sequelize.define("LibrarySetting", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },

  // Library Hours
  hoursMonFri:  { type: DataTypes.STRING, allowNull: true, defaultValue: "7:30 AM – 5:00 PM" },
  hoursSaturday:{ type: DataTypes.STRING, allowNull: true, defaultValue: "Closed" },
  hoursSunday:  { type: DataTypes.STRING, allowNull: true, defaultValue: "Closed" },

  // Contact Details
  address:      { type: DataTypes.STRING, allowNull: true, defaultValue: "Carmona, Cavite, Philippines" },
  phone:        { type: DataTypes.STRING, allowNull: true, defaultValue: "(046) 123-4567" },
  email:        { type: DataTypes.STRING, allowNull: true, defaultValue: "cvsulibrary@cvsu.edu.ph" },
  website:      { type: DataTypes.STRING, allowNull: true, defaultValue: "https://www.cvsu.edu.ph" },
  facebook:     { type: DataTypes.STRING, allowNull: true, defaultValue: "" },

  // Announcement cards on Home page
  announcement1Title: { type: DataTypes.STRING, allowNull: true, defaultValue: "Library Hours" },
  announcement1Body:  { type: DataTypes.TEXT,   allowNull: true, defaultValue: "Monday – Friday: 7:30 AM – 5:00 PM. Saturday: 8:00 AM – 12:00 PM. Closed on Sundays and holidays." },
  announcement2Title: { type: DataTypes.STRING, allowNull: true, defaultValue: "Book Week Celebration" },
  announcement2Body:  { type: DataTypes.TEXT,   allowNull: true, defaultValue: "Join us for our annual Book Week! Activities include reading contests, book exhibits, and author talks." },
  announcement3Title: { type: DataTypes.STRING, allowNull: true, defaultValue: "System Maintenance" },
  announcement3Body:  { type: DataTypes.TEXT,   allowNull: true, defaultValue: "The e-library system will undergo scheduled maintenance every Sunday from 12:00 AM – 4:00 AM." },
});

export default LibrarySettings;
