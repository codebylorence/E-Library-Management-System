import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Book = sequelize.define(
  "Book",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // ── Core (all types) ──────────────────────────
    title: { type: DataTypes.STRING, allowNull: false },
    author: { type: DataTypes.STRING, allowNull: false }, // author / editor / researcher
    category: { type: DataTypes.STRING, allowNull: false },
    publishedYear: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    coverImage: { type: DataTypes.STRING, allowNull: true },

    materialType: {
      type: DataTypes.ENUM(
        "Library Books",
        "E-Books",
        "E-Journals",
        "Thesis / Dissertation",
        "Magazine / Article"
      ),
      allowNull: false,
      defaultValue: "Library Books",
    },

    status: {
      type: DataTypes.ENUM("available", "unavailable"),
      defaultValue: "available",
    },

    // ── Physical (Library Books) ──────────────────
    isbn: { type: DataTypes.STRING, allowNull: true, unique: false },
    quantity: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    availableCopies: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    shelfLocation: { type: DataTypes.STRING, allowNull: true },
    publisher: { type: DataTypes.STRING, allowNull: true },

    // ── Digital (E-Books / E-Journals) ───────────
    fileUrl: { type: DataTypes.STRING, allowNull: true },   // PDF link or uploaded path
    accessUrl: { type: DataTypes.STRING, allowNull: true }, // external access link

    // ── E-Journal specific ────────────────────────
    journalName: { type: DataTypes.STRING, allowNull: true },
    volume: { type: DataTypes.STRING, allowNull: true },
    issue: { type: DataTypes.STRING, allowNull: true },
    issn: { type: DataTypes.STRING, allowNull: true },

    // ── Thesis / Dissertation ─────────────────────
    abstract: { type: DataTypes.TEXT, allowNull: true },
    program: { type: DataTypes.STRING, allowNull: true },   // e.g. BS Computer Science
    department: { type: DataTypes.STRING, allowNull: true },
    advisor: { type: DataTypes.STRING, allowNull: true },
    degree: { type: DataTypes.STRING, allowNull: true },    // e.g. Bachelor's, Master's

    // ── Magazine / Article ────────────────────────
    magazineName: { type: DataTypes.STRING, allowNull: true },
    articleDoi: { type: DataTypes.STRING, allowNull: true },
    pageRange: { type: DataTypes.STRING, allowNull: true },  // e.g. 12-25
  },
  { timestamps: true }
);

export default Book;
