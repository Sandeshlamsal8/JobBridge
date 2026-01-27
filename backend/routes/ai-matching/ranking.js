const express = require("express");
const router = express.Router();
const { auth, requireUserType } = require("../../middleware/auth");
const Application = require("../../models/Application");
const Job = require("../../models/Job");
const aiService = require("../../ai-service");

/**
 * @route   POST /api/ai-matching/analyze-cv
 * @desc    Analyze a CV and extract information
 * @access  Private
 */
router.post("/analyze-cv", auth, async (req, res) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check authorization
    if (
      application.applicant.toString() !== req.user.id &&
      application.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!application.resume || !application.resume.data) {
      return res.status(400).json({ message: "No CV uploaded" });
    }

    // Process CV
    const result = await aiService.processCVForApplication(
      application.resume.data,
      application.resume.contentType,
    );

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    // Update application with analysis
    application.cvAnalysis = {
      skills: result.analysis.skills,
      experience: result.analysis.experience,
      education: result.analysis.education,
      certifications: result.analysis.certifications,
      rawText: result.text,
      analyzedAt: new Date(),
    };

    await application.save();

    res.json({
      message: "CV analyzed successfully",
      analysis: {
        skills: result.analysis.skills,
        experience: result.analysis.experience,
        education: result.analysis.education,
        certifications: result.analysis.certifications,
      },
    });
  } catch (error) {
    console.error("Error analyzing CV:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   POST /api/ai-matching/rank-application
 * @desc    Rank a single application against a job
 * @access  Private (Employer only)
 */
router.post("/rank-application", auth, async (req, res) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findById(applicationId)
      .populate("job")
      .populate("applicant", "firstName lastName email");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check authorization (employer only)
    if (
      req.user.userType !== "employer" ||
      application.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Rank application
    const result = await aiService.rankApplicationForJob(
      application,
      application.job,
    );

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    // Update application with ranking
    application.aiRanking = {
      overallScore: result.ranking.overallScore,
      breakdown: result.ranking.breakdown,
      matchedSkills: result.ranking.matchedSkills,
      missingSkills: result.ranking.missingSkills,
      tier: result.ranking.tier,
      insights: result.ranking.insights,
      rankedAt: new Date(),
    };

    await application.save();

    res.json({
      message: "Application ranked successfully",
      ranking: result.ranking,
    });
  } catch (error) {
    console.error("Error ranking application:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/ai-matching/rank-all/:jobId
 * @desc    Rank all applications for a job
 * @access  Private (Employer only)
 */
router.get("/rank-all/:jobId", auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check authorization (employer only)
    if (
      req.user.userType !== "employer" ||
      job.company.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get all applications for this job
    const applications = await Application.find({ job: jobId }).populate(
      "applicant",
      "firstName lastName email profile jobSeekerProfile",
    );

    if (applications.length === 0) {
      return res.json({
        message: "No applications found",
        rankings: [],
        summary: { total: 0, excellent: 0, good: 0, fair: 0, poor: 0 },
      });
    }

    // Rank all applications
    const result = await aiService.rankAllApplicationsForJob(applications, job);

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    // Update applications with rankings
    const updatePromises = result.rankings.map(async (ranking) => {
      const app = applications.find(
        (a) => a._id.toString() === ranking.applicationId.toString(),
      );

      if (app) {
        app.aiRanking = {
          overallScore: ranking.overallScore,
          breakdown: ranking.breakdown,
          matchedSkills: ranking.matchedSkills,
          missingSkills: ranking.missingSkills,
          tier: require("../../ai-service/candidateRanking").getRankingTier(
            ranking.overallScore,
          ),
          insights:
            require("../../ai-service/candidateRanking").generateInsights(
              ranking,
            ),
          rankedAt: new Date(),
        };
        await app.save();
      }
    });

    await Promise.all(updatePromises);

    // Add application status to rankings
    const rankingsWithStatus = result.rankings.map((ranking) => {
      const app = applications.find(
        (a) => a._id.toString() === ranking.applicationId.toString(),
      );
      return {
        ...ranking,
        isShortlisted: app?.status === "shortlisted",
        applicationStatus: app?.status || "pending",
      };
    });

    res.json({
      message: "Applications ranked successfully",
      rankings: rankingsWithStatus,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Error ranking applications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/ai-matching/application-ranking/:applicationId
 * @desc    Get ranking details for an application
 * @access  Private
 */
router.get("/application-ranking/:applicationId", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("applicant", "firstName lastName email")
      .populate("job", "title");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check authorization
    if (
      application.applicant._id.toString() !== req.user.id &&
      application.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!application.aiRanking) {
      return res.status(404).json({ message: "Application not yet ranked" });
    }

    res.json({
      ranking: application.aiRanking,
      cvAnalysis: application.cvAnalysis,
    });
  } catch (error) {
    console.error("Error fetching ranking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
