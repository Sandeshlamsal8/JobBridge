const { parseCV } = require("./cvParser");
const { analyzeCV } = require("./skillExtractor");
const { calculateSimilarity, initializeModel } = require("./embeddingService");
const {
  rankCandidate,
  rankCandidates,
  generateInsights,
} = require("./candidateRanking");

/**
 * Process CV and extract information
 */
async function processCVForApplication(buffer, contentType) {
  try {
    // Parse CV to text
    const cvText = await parseCV(buffer, contentType);

    // Analyze CV
    const analysis = analyzeCV(cvText);

    return {
      success: true,
      analysis,
      text: cvText,
    };
  } catch (error) {
    console.error("Error processing CV:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Rank application against job
 */
async function rankApplicationForJob(application, job) {
  try {
    // Parse CV if needed
    let cvText, cvAnalysis;

    if (application.cvAnalysis) {
      cvAnalysis = application.cvAnalysis;
      cvText = cvAnalysis.rawText;
    } else if (application.resume && application.resume.data) {
      const cvData = await parseCV(
        application.resume.data,
        application.resume.contentType,
      );
      cvText = cvData;
      cvAnalysis = analyzeCV(cvText);
    } else {
      throw new Error("No CV data available");
    }

    // Rank candidate
    const ranking = await rankCandidate(cvText, cvAnalysis, job);

    // Generate insights
    const insights = generateInsights(ranking);

    return {
      success: true,
      ranking: {
        ...ranking,
        insights,
        tier: require("./candidateRanking").getRankingTier(
          ranking.overallScore,
        ),
      },
    };
  } catch (error) {
    console.error("Error ranking application:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Rank all applications for a job
 */
async function rankAllApplicationsForJob(applications, job) {
  try {
    const rankings = await rankCandidates(applications, job);

    return {
      success: true,
      rankings,
      summary: {
        total: rankings.length,
        excellent: rankings.filter((r) => r.overallScore >= 85).length,
        good: rankings.filter(
          (r) => r.overallScore >= 70 && r.overallScore < 85,
        ).length,
        fair: rankings.filter(
          (r) => r.overallScore >= 55 && r.overallScore < 70,
        ).length,
        poor: rankings.filter((r) => r.overallScore < 55).length,
      },
    };
  } catch (error) {
    console.error("Error ranking applications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Initialize AI service (preload models)
 */
async function initialize() {
  try {
    console.log("Initializing AI service...");
    await initializeModel();
    console.log("AI service initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing AI service:", error);
    return false;
  }
}

module.exports = {
  processCVForApplication,
  rankApplicationForJob,
  rankAllApplicationsForJob,
  initialize,
  // Export sub-modules for direct access if needed
  cvParser: require("./cvParser"),
  skillExtractor: require("./skillExtractor"),
  embeddingService: require("./embeddingService"),
  candidateRanking: require("./candidateRanking"),
};
