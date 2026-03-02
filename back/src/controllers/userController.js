import User from "../models/User.js";
import bcrypt from "bcrypt";

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