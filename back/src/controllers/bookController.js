import Book from "../models/Book.js";

const PHYSICAL = "Library Books";
const EBOOK    = "E-Books";
const EJOURNAL = "E-Journals";
const THESIS   = "Thesis / Dissertation";
const MAGAZINE = "Magazine / Article";

// ── helpers ──────────────────────────────────────
const pick = (obj, keys) =>
  keys.reduce((acc, k) => { if (obj[k] !== undefined) acc[k] = obj[k]; return acc; }, {});

const validateRequired = (body, fields) => {
  const missing = fields.filter((f) => !body[f] && body[f] !== 0);
  return missing.length ? `Missing required fields: ${missing.join(", ")}` : null;
};

// ── CREATE ────────────────────────────────────────
export const createBook = async (req, res) => {
  try {
    const b = req.body;
    const type = b.materialType || PHYSICAL;

    // Base required for all types
    const baseError = validateRequired(b, ["title", "author", "category", "publishedYear", "materialType"]);
    if (baseError) return res.status(400).json({ message: baseError });

    // Type-specific required fields
    const typeErrors = {
      [PHYSICAL]: validateRequired(b, ["isbn", "quantity"]),
      [EBOOK]:    null,
      [EJOURNAL]: validateRequired(b, ["journalName"]),
      [THESIS]:   validateRequired(b, ["program", "degree"]),
      [MAGAZINE]: validateRequired(b, ["magazineName"]),
    };
    if (typeErrors[type]) return res.status(400).json({ message: typeErrors[type] });

    // ISBN uniqueness check (physical books only)
    if (type === PHYSICAL && b.isbn) {
      const exists = await Book.findOne({ where: { isbn: b.isbn } });
      if (exists) return res.status(400).json({ message: "A book with this ISBN already exists." });
    }

    const qty = type === PHYSICAL ? Number(b.quantity) : null;
    // Only physical books have availability tracking; all others are always "available"
    const status = type === PHYSICAL ? (b.status || "available") : "available";

    const newBook = await Book.create({
      // core
      title: b.title, author: b.author, category: b.category,
      publishedYear: Number(b.publishedYear), description: b.description || null,
      coverImage: b.coverImage || null, materialType: type,
      status,
      // physical
      isbn: b.isbn || null, quantity: qty,
      availableCopies: qty !== null ? (b.availableCopies ?? qty) : null,
      shelfLocation: b.shelfLocation || null, publisher: b.publisher || null,
      // digital
      fileUrl: b.fileUrl || null, accessUrl: b.accessUrl || null,
      // e-journal
      journalName: b.journalName || null, volume: b.volume || null,
      issue: b.issue || null, issn: b.issn || null,
      // thesis
      abstract: b.abstract || null, program: b.program || null,
      department: b.department || null, advisor: b.advisor || null, degree: b.degree || null,
      // magazine
      magazineName: b.magazineName || null, articleDoi: b.articleDoi || null,
      pageRange: b.pageRange || null,
    });

    res.status(201).json({ message: "Resource added successfully", book: newBook });
  } catch (err) {
    res.status(500).json({ message: "Failed to create resource", error: err.message });
  }
};

// ── GET ALL ───────────────────────────────────────
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll({ order: [["createdAt", "DESC"]] });
    res.status(200).json({ message: "Books fetched successfully", books });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch books", error: err.message });
  }
};

// ── GET ONE ───────────────────────────────────────
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.status(200).json({ message: "Book fetched successfully", book });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch book", error: err.message });
  }
};

// ── UPDATE ────────────────────────────────────────
export const updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const b = req.body;
    if (b.isbn && b.isbn !== book.isbn) {
      const exists = await Book.findOne({ where: { isbn: b.isbn } });
      if (exists) return res.status(400).json({ message: "Another book with this ISBN already exists." });
    }

    await book.update({
      ...pick(b, [
        "title","author","category","publishedYear","description","coverImage",
        "materialType","shelfLocation","isbn","quantity","availableCopies",
        "publisher","fileUrl","accessUrl","journalName","volume","issue","issn",
        "abstract","program","department","advisor","degree",
        "magazineName","articleDoi","pageRange",
      ]),
      // Only physical books can be unavailable
      status: book.materialType === PHYSICAL ? (b.status ?? book.status) : "available",
    });

    res.status(200).json({ message: "Book updated successfully", book });
  } catch (err) {
    res.status(500).json({ message: "Failed to update book", error: err.message });
  }
};

// ── DELETE ────────────────────────────────────────
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    await book.destroy();
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete book", error: err.message });
  }
};
