import User from "../models/User.js";

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "carmonalibrary@cvsu.edu.ph";
  const fullName = process.env.ADMIN_NAME || "Carmona Library Admin";

  const existing = await User.findOne({ where: { email } });

  if (existing) {
    // Ensure existing admin is approved and has the admin role
    const updates = {};
    if (existing.status !== "approved") updates.status = "approved";
    if (existing.role !== "admin") updates.role = "admin";
    if (Object.keys(updates).length) await existing.update(updates);
    console.log("Admin account already exists ✅");
    return;
  }

  // Google OAuth admin — no password needed
  await User.create({
    fullName,
    email,
    password: null,
    role: "admin",
    status: "approved",
  });

  console.log(`Admin account created ✅  →  ${email}`);
};

export default seedAdmin;
