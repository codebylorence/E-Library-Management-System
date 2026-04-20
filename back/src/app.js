import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import userRoutes from "./routes/userRoutes.js"
import bookRoutes from "./routes/bookRoutes.js"
import upload from "./config/upload.js"
import passport from "./config/passport.js"

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Serve uploaded cover images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Cover image upload endpoint
app.post("/api/upload/cover", upload.single("cover"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const url = `/uploads/covers/${req.file.filename}`;
  res.status(200).json({ url });
});

app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);

app.get("/", (req, res) => {
    res.send("Backend is running");
});

export default app;