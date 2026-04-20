import Book from "../models/Book.js";

// CREATE BOOK
export const createBook = async (req, res) => {
  try {
    console.log("CREATE BOOK BODY:", JSON.stringify(req.body));
    const {
      title,
      author,
      isbn,
      category,
      publishedYear,
      quantity,
      availableCopies,
      description,
      shelfLocation,
      coverImage,
      materialType,
      status,
    } = req.body;

    if (!title || !author || !isbn || !category || !publishedYear || !quantity) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const existingBook = await Book.findOne({ where: { isbn } });

    if (existingBook) {
      return res.status(400).json({
        message: "Book with this ISBN already exists",
      });
    }

    const newBook = await Book.create({
      title,
      author,
      isbn,
      category,
      publishedYear,
      quantity,
      availableCopies: availableCopies ?? quantity,
      description,
      shelfLocation,
      coverImage,
      materialType: materialType || "Library Books",
      status: status || "available",
    });

    res.status(201).json({
      message: "Book created successfully",
      book: newBook,
    });
  } catch (error) {
    console.error("CREATE BOOK ERROR:", error.message, error.stack);
    res.status(500).json({
      message: "Failed to create book",
      error: error.message,
    });
  }
};

// GET ALL BOOKS
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Books fetched successfully",
      books,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch books",
      error: error.message,
    });
  }
};

// GET SINGLE BOOK BY ID
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book fetched successfully",
      book,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch book",
      error: error.message,
    });
  }
};

// UPDATE BOOK
export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    const {
      title,
      author,
      isbn,
      category,
      publishedYear,
      quantity,
      availableCopies,
      description,
      shelfLocation,
      coverImage,
      materialType,
      status,
    } = req.body;

    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ where: { isbn } });

      if (existingBook) {
        return res.status(400).json({
          message: "Another book with this ISBN already exists",
        });
      }
    }

    await book.update({
      title: title ?? book.title,
      author: author ?? book.author,
      isbn: isbn ?? book.isbn,
      category: category ?? book.category,
      publishedYear: publishedYear ?? book.publishedYear,
      quantity: quantity ?? book.quantity,
      availableCopies: availableCopies ?? book.availableCopies,
      description: description ?? book.description,
      shelfLocation: shelfLocation ?? book.shelfLocation,
      coverImage: coverImage ?? book.coverImage,
      materialType: materialType ?? book.materialType,
      status: status ?? book.status,
    });

    res.status(200).json({
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update book",
      error: error.message,
    });
  }
};

// DELETE BOOK
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    await book.destroy();

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete book",
      error: error.message,
    });
  }
};