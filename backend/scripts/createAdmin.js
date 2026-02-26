const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@jobbridge.com" });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      console.log("Email:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@jobbridge.com",
      password: "Admin@123", // Change this password after first login
      userType: "admin",
      isEmailVerified: true,
      isActive: true,
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@jobbridge.com");
    console.log("Password: Admin@123");
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();
