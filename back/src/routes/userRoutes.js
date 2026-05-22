import express from "express";
import { registerUser, loginUser, googleAuthSuccess, getAllUsers, deleteUser, updateUserStatus, updateUserRole, completeProfile } from "../controllers/userController.js";
import { getProfile, authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import passport from "../config/passport.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", authMiddleware, getProfile);

// Complete profile (any authenticated user)
router.patch("/profile/complete", authMiddleware, completeProfile);

// Admin: list all users
router.get("/", authMiddleware, roleMiddleware("admin", "librarian"), getAllUsers);

// Admin/Librarian: approve or reject a user
router.patch("/:id/status", authMiddleware, roleMiddleware("admin", "librarian"), updateUserStatus);

// Admin: change user role
router.patch("/:id/role", authMiddleware, roleMiddleware("admin"), updateUserRole);

// Admin: delete a user
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

// Google OAuth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/auth/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        const reason = info?.message === "non_cvsu" ? "non_cvsu" : "auth_failed";
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${reason}`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  googleAuthSuccess
);

export default router;
