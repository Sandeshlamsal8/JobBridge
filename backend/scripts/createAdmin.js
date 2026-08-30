const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function adminConfig(source = process.env) {
  const mongoUri = source.MONGODB_URI?.trim();
  const email = source.ADMIN_EMAIL?.trim().toLowerCase();
  const password = source.ADMIN_PASSWORD;

  if (!mongoUri) throw new Error("MONGODB_URI is required");
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address");
  }
  if (
    !password ||
    password.length < 12 ||
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password)
  ) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters with upper, lower, number, and symbol",
    );
  }
  return { mongoUri, email, password };
}

async function createAdminUser(source = process.env) {
  const config = adminConfig(source);
  try {
    await mongoose.connect(config.mongoUri);
    const existingUser = await User.findOne({ email: config.email });
    if (existingUser) {
      if (existingUser.userType !== "admin") {
        throw new Error("ADMIN_EMAIL belongs to a non-admin account");
      }
      console.log("Admin user already exists");
      return existingUser;
    }

    const admin = await User.create({
      firstName: "System",
      lastName: "Admin",
      email: config.email,
      password: config.password,
      userType: "admin",
      isEmailVerified: true,
      isActive: true,
    });
    console.log("Admin user created successfully");
    return admin;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  createAdminUser().catch((error) => {
    console.error("Admin bootstrap failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { adminConfig, createAdminUser };
