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

    let user = await User.findOne({ where: { googleId } });

    if (!user && email) {
      // Check if an account with this email already exists
      user = await User.findOne({ where: { email } });
      if (user) {
        // Link Google ID to existing account
        await user.update({ googleId });
      } else {
        // Create a new student account
        user = await User.create({ fullName, email, googleId, role: "student" });
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
    JSON.stringify({ id: user.id, fullName: user.fullName, email: user.email, role: user.role })
  );
  // Redirect to frontend with token + user info in query params
  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-callback?token=${token}&user=${userData}`
  );
};

// register user
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
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