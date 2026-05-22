import express from "express";
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// CREATE BOOK - admin and librarian only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  createBook
);

// GET ALL BOOKS - public
router.get("/", getAllBooks);

// GET SINGLE BOOK - public
router.get("/:id", getBookById);

// UPDATE BOOK - admin and librarian only
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  updateBook
);

// DELETE BOOK - admin and librarian
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  deleteBook
);

export default router;