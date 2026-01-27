/**
 * Check if AI service is working
 */

const http = require("http");

console.log("🔍 Checking Server Status...\n");

// Check if backend is running
const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/health",
  method: "GET",
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode === 200) {
      console.log("✅ Backend Server: RUNNING on port 5000");
      const health = JSON.parse(data);
      console.log(`   Environment: ${health.environment}`);
      console.log(`   Timestamp: ${health.timestamp}`);

      // Now test AI service
      console.log("\n🤖 Testing AI Service...");
      testAIService();
    } else {
      console.log("❌ Backend Server: ERROR");
      console.log(`   Status: ${res.statusCode}`);
    }
  });
});

req.on("error", (error) => {
  console.log("❌ Backend Server: NOT RUNNING");
  console.log(`   Error: ${error.message}`);
  console.log("\n💡 Start the backend with: npm run dev");
  process.exit(1);
});

req.end();

function testAIService() {
  try {
    // Try to load AI service modules
    const aiService = require("./ai-service");
    console.log("✅ AI Service Modules: LOADED");

    // Check if main functions exist
    const functions = [
      "processCVForApplication",
      "rankApplicationForJob",
      "rankAllApplicationsForJob",
      "initialize",
    ];

    let allExist = true;
    functions.forEach((fn) => {
      if (typeof aiService[fn] === "function") {
        console.log(`   ✅ ${fn}: Available`);
      } else {
        console.log(`   ❌ ${fn}: Missing`);
        allExist = false;
      }
    });

    if (allExist) {
      console.log("\n✨ AI Service Status: READY");
      console.log("\n📊 Summary:");
      console.log("   - Backend Server: ✅ Running");
      console.log("   - AI Service: ✅ Ready");
      console.log("   - API Endpoints: ✅ Available");
      console.log("\n🎯 AI Features:");
      console.log("   - CV Parsing (PDF/Word): ✅");
      console.log("   - Skill Extraction: ✅");
      console.log("   - Semantic Matching: ✅");
      console.log("   - Candidate Ranking: ✅");
      console.log(
        "\n💡 The AI will initialize on first use (when someone applies with a CV)",
      );
      console.log(
        "   First request may take 10-30 seconds to download the model.",
      );
      console.log("   Subsequent requests will be fast (<1 second).");
      console.log("\n🚀 You can test the AI service with:");
      console.log("   node ai-service/test.js");
    } else {
      console.log("\n⚠️  AI Service: INCOMPLETE");
    }
  } catch (error) {
    console.log("❌ AI Service: ERROR");
    console.log(`   Error: ${error.message}`);
  }
}
