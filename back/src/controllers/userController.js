import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Helper: generate JWT for a user
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

// Google OAuth callback handler
export const googleAuthCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const fullName = profile.displayName;
    const googleId = profile.id;

    // Only allow CvSU accounts
    if (!email || !email.endsWith("@cvsu.edu.ph")) {
      return done(null, false, { message: "non_cvsu" });
    }

    let user = await User.findOne({ where: { googleId } });

    if (!user && email) {
      // Check if an account with this email already exists
      user = await User.findOne({ where: { email } });
      if (user) {
        // Link Google ID to existing account
        await user.update({ googleId });
      } else {
        // Create a new student account (Google users are auto-approved)
        user = await User.create({ fullName, email, googleId, role: "student", status: "approved" });
      }
    }

    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
};

// Called after Google redirects back — issues JWT and redirects to frontend
export const googleAuthSuccess = (req, res) => {
  const user = req.user;
  const token = generateToken(user);
  const userData = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profileComplete: user.profileComplete ?? false,
    })
  );
  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-callback?token=${token}&user=${userData}`
  );
};

// register user
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || "student",
      status: "pending",
    });
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH complete user profile
export const completeProfile = async (req, res) => {
  try {
    const { id } = req.user; // from JWT
    const { sex, address, mobileNumber, userType, studentNumber } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({
      sex,
      address,
      mobileNumber,
      userType,
      studentNumber: studentNumber || null,
      profileComplete: true,
    });

    res.status(200).json({
      message: "Profile completed successfully",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileComplete: true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "fullName", "email", "role", "studentNumber", "googleId", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH update user status: approve or reject (admin/librarian only)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ status });
    res.status(200).json({ message: `User ${status} successfully.`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;

    if (!["admin", "librarian", "student", "faculty", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be admin, librarian, student, faculty, or staff." });
    }

    // Prevent changing your own role
    if (Number(id) === requesterId) {
      return res.status(400).json({ message: "You cannot change your own role." });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    await user.update({ role });
    res.status(200).json({ message: `Role updated to ${role}.`, user: { id: user.id, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account uses Google Sign-In. Please continue with Google." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is pending approval. Please wait for an admin to approve your registration." });
    }

    if (user.status === "rejected") {
      return res.status(403).json({ message: "Your account registration was rejected. Please contact the library for assistance." });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};