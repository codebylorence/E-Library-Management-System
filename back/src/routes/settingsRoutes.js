import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public — Home page reads this
router.get("/", getSettings);

// Admin/Librarian — update settings
router.put("/", authMiddleware, roleMiddleware("admin", "librarian"), updateSettings);

export default router;
