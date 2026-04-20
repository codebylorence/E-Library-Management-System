import bcrypt from "bcrypt";
import User from "../models/User.js";

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@elibrary.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@1234";
  const fullName = process.env.ADMIN_NAME || "System Admin";

  const existing = await User.findOne({ where: { email } });

  if (existing) {
    console.log("Admin account already exists ✅");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Admin account created ✅  →  ${email} / ${password}`);
};

export default seedAdmin;
