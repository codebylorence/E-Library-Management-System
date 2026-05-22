import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/pdfs";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf" || path.extname(file.originalname).toLowerCase() === ".pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

const uploadPdf = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

export default uploadPdf;
