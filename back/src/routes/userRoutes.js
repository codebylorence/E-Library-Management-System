import express from "express";
import { registerUser, loginUser, googleAuthSuccess } from "../controllers/userController.js";
import { getProfile, authMiddleware } from "../middleware/authMiddleware.js";
import passport from "../config/passport.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", authMiddleware, getProfile);

// Google OAuth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  googleAuthSuccess
);

export default router;
