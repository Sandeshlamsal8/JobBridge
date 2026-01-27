/**
 * Test script to verify notification fix
 */

const mongoose = require("mongoose");
require("dotenv").config();

async function testNotificationFix() {
  try {
    console.log("🧪 Testing Notification Fix...\n");

    // Connect to MongoDB
    console.log("1. Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("   ✅ Connected\n");

    // Load models
    console.log("2. Loading models...");
    const Notification = require("./models/Notification");
    const User = require("./models/User");
    const Job = require("./models/Job"); // Load Job model for populate
    const Application = require("./models/Application"); // Load Application model
    console.log("   ✅ Models loaded\n");

    // Find a test user
    console.log("3. Finding test user...");
    const testUser = await User.findOne();

    if (!testUser) {
      console.log("   ⚠️  No users found in database");
      console.log("   Create a user first to test notifications\n");
      await mongoose.connection.close();
      return;
    }

    console.log(
      `   ✅ Found user: ${testUser.firstName} ${testUser.lastName}\n`,
    );

    // Test creating a notification
    console.log("4. Creating test notification...");
    const notification = await Notification.createNotification({
      recipient: testUser._id,
      type: "system_announcement",
      title: "Test Notification",
      message: "This is a test notification to verify the fix",
      priority: "low",
    });

    console.log("   ✅ Notification created successfully!");
    console.log(`   ID: ${notification._id}`);
    console.log(
      `   Recipient: ${notification.recipient.firstName} ${notification.recipient.lastName}\n`,
    );

    // Test getting user notifications
    console.log("5. Fetching user notifications...");
    const notifications = await Notification.getUserNotifications(
      testUser._id,
      {
        limit: 5,
      },
    );

    console.log(`   ✅ Retrieved ${notifications.length} notifications\n`);

    // Clean up test notification
    console.log("6. Cleaning up test notification...");
    await Notification.findByIdAndDelete(notification._id);
    console.log("   ✅ Test notification deleted\n");

    console.log("========================================");
    console.log("✨ All tests passed!");
    console.log("========================================\n");
    console.log("📊 Results:");
    console.log("   - MongoDB connection: ✅");
    console.log("   - Model loading: ✅");
    console.log("   - Create notification: ✅");
    console.log("   - Fetch notifications: ✅");
    console.log("   - No path collision errors: ✅\n");
    console.log("🎉 Notification system is working correctly!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\nError details:", error);

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

// Run the test
testNotificationFix();
