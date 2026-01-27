/**
 * Quick script to verify all imports work correctly
 */

console.log("🔍 Verifying imports...\n");

try {
  console.log("1. Testing AI service import...");
  const aiService = require("./ai-service");
  console.log("   ✅ AI service imported successfully");

  console.log("\n2. Testing auth middleware import...");
  const { auth, requireUserType } = require("./middleware/auth");
  console.log("   ✅ Auth middleware imported successfully");

  console.log("\n3. Testing ranking routes import...");
  const rankingRoutes = require("./routes/ai-matching/ranking");
  console.log("   ✅ Ranking routes imported successfully");

  console.log("\n4. Testing models import...");
  const Application = require("./models/Application");
  const Job = require("./models/Job");
  console.log("   ✅ Models imported successfully");

  console.log("\n✨ All imports verified successfully!");
  console.log("\nYou can now start the server with: npm run dev");
} catch (error) {
  console.error("\n❌ Import error:", error.message);
  console.error("\nStack trace:", error.stack);
  process.exit(1);
}
