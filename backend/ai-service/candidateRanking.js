const { calculateSimilarity } = require("./embeddingService");
const { analyzeCV } = require("./skillExtractor");

/**
 * Calculate skill match percentage
 */
function calculateSkillMatch(cvSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) return 0;

  const cvSkillsLower = cvSkills.map((s) => s.toLowerCase());
  const jobSkillsLower = jobSkills.map((s) => s.toLowerCase());

  let matchCount = 0;
  jobSkillsLower.forEach((jobSkill) => {
    if (
      cvSkillsLower.some(
        (cvSkill) => cvSkill.includes(jobSkill) || jobSkill.includes(cvSkill),
      )
    ) {
      matchCount++;
    }
  });

  return Math.round((matchCount / jobSkillsLower.length) * 100);
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(cvExperience, requiredExperience) {
  if (!requiredExperience || requiredExperience === 0) return 100;

  if (cvExperience >= requiredExperience) return 100;
  if (cvExperience === 0) return 0;

  // Partial credit for partial experience
  return Math.round((cvExperience / requiredExperience) * 100);
}

/**
 * Calculate education match score
 */
function calculateEducationMatch(cvEducation, requiredEducation) {
  if (!requiredEducation || requiredEducation.length === 0) return 100;

  const educationLevels = {
    phd: 5,
    doctorate: 5,
    doctoral: 5,
    master: 4,
    mba: 4,
    bachelor: 3,
    associate: 2,
    diploma: 1,
  };

  let cvLevel = 0;
  cvEducation.forEach((edu) => {
    const eduLower = edu.toLowerCase();
    Object.keys(educationLevels).forEach((key) => {
      if (eduLower.includes(key) && educationLevels[key] > cvLevel) {
        cvLevel = educationLevels[key];
      }
    });
  });

  let requiredLevel = 0;
  requiredEducation.forEach((edu) => {
    const eduLower = edu.toLowerCase();
    Object.keys(educationLevels).forEach((key) => {
      if (eduLower.includes(key) && educationLevels[key] > requiredLevel) {
        requiredLevel = educationLevels[key];
      }
    });
  });

  if (cvLevel >= requiredLevel) return 100;
  if (cvLevel === 0) return 0;

  return Math.round((cvLevel / requiredLevel) * 80);
}

/**
 * Rank a single candidate against a job
 */
async function rankCandidate(cvText, cvAnalysis, job) {
  try {
    // Prepare job description text
    const jobText = `
      ${job.title}
      ${job.description}
      Skills: ${job.skills ? job.skills.join(", ") : ""}
      Requirements: ${job.requirements ? job.requirements.join(", ") : ""}
      Experience Level: ${job.experienceLevel}
    `.trim();

    // Calculate semantic similarity (AI-based)
    const semanticScore = await calculateSimilarity(cvText, jobText);

    // Calculate skill match
    const skillScore = calculateSkillMatch(cvAnalysis.skills, job.skills || []);

    // Calculate experience match
    const experienceMap = {
      entry: 0,
      mid: 3,
      senior: 7,
      executive: 10,
    };
    const requiredExp = experienceMap[job.experienceLevel] || 0;
    const experienceScore = calculateExperienceMatch(
      cvAnalysis.experience,
      requiredExp,
    );

    // Calculate education match
    const educationScore = calculateEducationMatch(
      cvAnalysis.education,
      job.requirements || [],
    );

    // Weighted overall score
    const weights = {
      semantic: 0.4, // 40% - Overall fit based on AI
      skills: 0.35, // 35% - Specific skill matching
      experience: 0.15, // 15% - Experience level
      education: 0.1, // 10% - Education requirements
    };

    const overallScore = Math.round(
      semanticScore * weights.semantic +
        skillScore * weights.skills +
        experienceScore * weights.experience +
        educationScore * weights.education,
    );

    return {
      overallScore,
      breakdown: {
        semanticMatch: semanticScore,
        skillMatch: skillScore,
        experienceMatch: experienceScore,
        educationMatch: educationScore,
      },
      matchedSkills: cvAnalysis.skills.filter((skill) =>
        job.skills?.some(
          (jobSkill) =>
            skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
            jobSkill.toLowerCase().includes(skill.toLowerCase()),
        ),
      ),
      missingSkills:
        job.skills?.filter(
          (jobSkill) =>
            !cvAnalysis.skills.some(
              (skill) =>
                skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
                jobSkill.toLowerCase().includes(skill.toLowerCase()),
            ),
        ) || [],
    };
  } catch (error) {
    console.error("Error ranking candidate:", error);
    throw error;
  }
}

/**
 * Rank multiple candidates for a job
 */
async function rankCandidates(applications, job) {
  try {
    const rankedCandidates = [];

    for (const application of applications) {
      if (!application.resume || !application.resume.data) {
        continue;
      }

      // Parse CV if not already parsed
      let cvAnalysis = application.cvAnalysis;
      if (!cvAnalysis) {
        const { parseCV } = require("./cvParser");
        const cvText = await parseCV(
          application.resume.data,
          application.resume.contentType,
        );
        cvAnalysis = analyzeCV(cvText);
      }

      // Rank candidate
      const ranking = await rankCandidate(cvAnalysis.rawText, cvAnalysis, job);

      rankedCandidates.push({
        applicationId: application._id,
        applicantId: application.applicant._id || application.applicant,
        applicantName:
          application.applicant.firstName && application.applicant.lastName
            ? `${application.applicant.firstName} ${application.applicant.lastName}`
            : "Unknown",
        ...ranking,
      });
    }

    // Sort by overall score (descending)
    rankedCandidates.sort((a, b) => b.overallScore - a.overallScore);

    // Add rank position
    rankedCandidates.forEach((candidate, index) => {
      candidate.rank = index + 1;
    });

    return rankedCandidates;
  } catch (error) {
    console.error("Error ranking candidates:", error);
    throw error;
  }
}

/**
 * Get ranking tier based on score
 */
function getRankingTier(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "fair";
  return "poor";
}

/**
 * Generate ranking insights
 */
function generateInsights(ranking) {
  const tier = getRankingTier(ranking.overallScore);
  const insights = [];

  if (tier === "excellent") {
    insights.push(
      "Highly qualified candidate with strong alignment to job requirements",
    );
  } else if (tier === "good") {
    insights.push("Well-qualified candidate with good fit for the position");
  } else if (tier === "fair") {
    insights.push(
      "Candidate meets some requirements but may need additional evaluation",
    );
  } else {
    insights.push("Candidate may not be the best fit for this position");
  }

  if (ranking.breakdown.skillMatch >= 80) {
    insights.push("Excellent skill match");
  } else if (ranking.breakdown.skillMatch < 50) {
    insights.push(`Missing ${ranking.missingSkills.length} key skills`);
  }

  if (ranking.breakdown.experienceMatch >= 100) {
    insights.push("Meets or exceeds experience requirements");
  } else if (ranking.breakdown.experienceMatch < 70) {
    insights.push("May need more experience for this role");
  }

  return insights;
}

module.exports = {
  rankCandidate,
  rankCandidates,
  calculateSkillMatch,
  calculateExperienceMatch,
  calculateEducationMatch,
  getRankingTier,
  generateInsights,
};
