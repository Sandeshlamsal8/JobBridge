/**
 * Simple test script for AI service
 * Run with: node backend/ai-service/test.js
 */

const aiService = require("./index");

// Sample CV text
const sampleCV = `
John Doe
Software Engineer

EXPERIENCE
Senior Full Stack Developer at Tech Corp (2020-2024)
- Developed web applications using React, Node.js, and MongoDB
- Led a team of 5 developers
- Implemented CI/CD pipelines using Docker and Kubernetes
- 5 years of experience in software development

SKILLS
- JavaScript, TypeScript, Python
- React, Angular, Vue.js
- Node.js, Express, Django
- MongoDB, PostgreSQL, Redis
- AWS, Docker, Kubernetes
- Git, Agile, Scrum

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2015-2019)

CERTIFICATIONS
- AWS Certified Solutions Architect
- Certified Scrum Master
`;

// Sample Job Description
const sampleJob = {
  title: "Senior Full Stack Developer",
  description: `
    We are looking for an experienced Full Stack Developer to join our team.
    You will work on building scalable web applications using modern technologies.
  `,
  skills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Docker"],
  requirements: [
    "Bachelor's degree in Computer Science or related field",
    "5+ years of experience in web development",
    "Strong knowledge of React and Node.js",
    "Experience with cloud platforms (AWS preferred)",
    "Excellent problem-solving skills",
  ],
  experienceLevel: "senior",
};

async function runTests() {
  console.log("🧪 Testing AI Service...\n");

  try {
    // Test 1: Skill Extraction
    console.log("Test 1: Skill Extraction");
    console.log("------------------------");
    const { analyzeCV } = aiService.skillExtractor;
    const analysis = analyzeCV(sampleCV);
    console.log("✅ Skills extracted:", analysis.skills.length);
    console.log("   Sample skills:", analysis.skills.slice(0, 10).join(", "));
    console.log("✅ Experience:", analysis.experience, "years");
    console.log("✅ Education:", analysis.education.join(", "));
    console.log("✅ Certifications:", analysis.certifications.length);
    console.log();

    // Test 2: Initialize AI Model
    console.log("Test 2: Initialize AI Model");
    console.log("---------------------------");
    console.log(
      "⏳ Loading embedding model (this may take 10-30 seconds on first run)...",
    );
    await aiService.initialize();
    console.log("✅ Model initialized successfully");
    console.log();

    // Test 3: Calculate Similarity
    console.log("Test 3: Calculate Semantic Similarity");
    console.log("-------------------------------------");
    const { calculateSimilarity } = aiService.embeddingService;
    const similarity = await calculateSimilarity(
      sampleCV,
      sampleJob.description,
    );
    console.log("✅ Semantic similarity score:", similarity + "%");
    console.log();

    // Test 4: Rank Candidate
    console.log("Test 4: Rank Candidate");
    console.log("----------------------");
    const { rankCandidate } = aiService.candidateRanking;
    const ranking = await rankCandidate(sampleCV, analysis, sampleJob);
    console.log("✅ Overall Score:", ranking.overallScore + "/100");
    console.log("   Breakdown:");
    console.log("   - Semantic Match:", ranking.breakdown.semanticMatch + "%");
    console.log("   - Skill Match:", ranking.breakdown.skillMatch + "%");
    console.log(
      "   - Experience Match:",
      ranking.breakdown.experienceMatch + "%",
    );
    console.log(
      "   - Education Match:",
      ranking.breakdown.educationMatch + "%",
    );
    console.log("   Matched Skills:", ranking.matchedSkills.join(", "));
    console.log("   Missing Skills:", ranking.missingSkills.join(", "));
    console.log();

    // Test 5: Generate Insights
    console.log("Test 5: Generate Insights");
    console.log("-------------------------");
    const { generateInsights, getRankingTier } = aiService.candidateRanking;
    const tier = getRankingTier(ranking.overallScore);
    const insights = generateInsights(ranking);
    console.log("✅ Ranking Tier:", tier.toUpperCase());
    console.log("   Insights:");
    insights.forEach((insight) => console.log("   -", insight));
    console.log();

    console.log("🎉 All tests passed successfully!");
    console.log("\n📊 Summary:");
    console.log("   - CV parsing: ✅");
    console.log("   - Skill extraction: ✅");
    console.log("   - AI model loading: ✅");
    console.log("   - Semantic matching: ✅");
    console.log("   - Candidate ranking: ✅");
    console.log("   - Insights generation: ✅");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests()
  .then(() => {
    console.log("\n✨ AI Service is ready to use!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
