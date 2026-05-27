import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import userRoutes from "./routes/userRoutes.js"
import bookRoutes from "./routes/bookRoutes.js"
import borrowRoutes from "./routes/borrowRoutes.js"
import attendanceRoutes from "./routes/attendanceRoutes.js"
import reservationRoutes from "./routes/reservationRoutes.js"
import settingsRoutes from "./routes/settingsRoutes.js"
import upload from "./config/upload.js"
import uploadId from "./config/uploadId.js"
import uploadPdf from "./config/uploadPdf.js"
import passport from "./config/passport.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
    : ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Serve uploaded cover images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Cover image upload endpoint
app.post("/api/upload/cover", upload.single("cover"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.status(200).json({ url: `/uploads/covers/${req.file.filename}` });
});

// PDF upload endpoint (e-books, theses)
app.post("/api/upload/pdf", uploadPdf.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.status(200).json({ url: `/uploads/pdfs/${req.file.filename}` });
});

// ID image upload endpoint (library ID + school ID during registration)
app.post(
  "/api/upload/ids",
  uploadId.fields([
    { name: "libraryId", maxCount: 1 },
    { name: "schoolId", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files;
    if (!files?.libraryId && !files?.schoolId) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    res.status(200).json({
      libraryIdUrl: files.libraryId ? `/uploads/ids/${files.libraryId[0].filename}` : null,
      schoolIdUrl: files.schoolId ? `/uploads/ids/${files.schoolId[0].filename}` : null,
    });
  }
);

app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/settings", settingsRoutes);

// In production, serve the built React frontend
if (process.env.NODE_ENV === "production") {
  const frontDist = path.join(__dirname, "../../front/dist");
  app.use(express.static(frontDist));
  // All non-API routes → React app
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(frontDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Backend is running");
  });
}

export default app;