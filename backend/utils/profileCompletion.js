// Profile completion utility functions

/**
 * Calculate profile completion percentage for job seekers
 * @param {Object} user - User object with populated profile data
 * @returns {Object} - Completion data with percentage and missing fields
 */
const calculateJobSeekerProfileCompletion = (user) => {
  const completionChecks = {
    // Basic Info (40% weight)
    basicInfo: {
      weight: 40,
      fields: {
        firstName: !!user.firstName,
        lastName: !!user.lastName,
        email: !!user.email,
        phone: !!user.profile?.phone,
        location: !!user.profile?.location,
        bio: !!(user.profile?.bio && user.profile.bio.length >= 50),
      },
    },

    // Professional Info (35% weight)
    professionalInfo: {
      weight: 35,
      fields: {
        headline: !!user.jobSeekerProfile?.headline,
        skills: !!(
          user.jobSeekerProfile?.skills &&
          user.jobSeekerProfile.skills.length >= 3
        ),
        experienceLevel: !!user.jobSeekerProfile?.experienceLevel,
        expectedSalary: !!(
          user.jobSeekerProfile?.expectedSalary?.min &&
          user.jobSeekerProfile?.expectedSalary?.max
        ),
      },
    },

    // Experience & Resume (25% weight)
    experience: {
      weight: 25,
      fields: {
        workExperience: !!(
          user.jobSeekerProfile?.experienceHistory &&
          user.jobSeekerProfile.experienceHistory.length >= 1
        ),
        resume: !!user.jobSeekerProfile?.resume,
      },
    },
  };

  let totalScore = 0;
  let maxScore = 0;
  const missingFields = [];
  const sectionScores = {};

  Object.entries(completionChecks).forEach(([sectionName, section]) => {
    const sectionFields = Object.entries(section.fields);
    const completedFields = sectionFields.filter(
      ([, isCompleted]) => isCompleted
    ).length;
    const sectionPercentage = (completedFields / sectionFields.length) * 100;
    const weightedScore = (sectionPercentage / 100) * section.weight;

    totalScore += weightedScore;
    maxScore += section.weight;

    sectionScores[sectionName] = {
      percentage: Math.round(sectionPercentage),
      completed: completedFields,
      total: sectionFields.length,
      weight: section.weight,
    };

    // Add missing fields
    sectionFields.forEach(([fieldName, isCompleted]) => {
      if (!isCompleted) {
        missingFields.push({
          section: sectionName,
          field: fieldName,
          priority:
            section.weight > 30
              ? "high"
              : section.weight > 20
              ? "medium"
              : "low",
        });
      }
    });
  });

  const overallPercentage = Math.round((totalScore / maxScore) * 100);

  return {
    overallPercentage,
    sectionScores,
    missingFields,
    isComplete: overallPercentage >= 80,
    needsAttention: overallPercentage < 50,
    recommendations: generateRecommendations(missingFields, overallPercentage),
  };
};

/**
 * Calculate profile completion percentage for employers
 * @param {Object} user - User object with populated profile data
 * @returns {Object} - Completion data with percentage and missing fields
 */
const calculateEmployerProfileCompletion = (user) => {
  const completionChecks = {
    // Basic Info (30% weight)
    basicInfo: {
      weight: 30,
      fields: {
        firstName: !!user.firstName,
        lastName: !!user.lastName,
        email: !!user.email,
      },
    },

    // Company Info (70% weight)
    companyInfo: {
      weight: 70,
      fields: {
        companyName: !!user.employerProfile?.companyName,
        companySize: !!user.employerProfile?.companySize,
        industry: !!user.employerProfile?.industry,
        companyDescription: !!(
          user.employerProfile?.companyDescription &&
          user.employerProfile.companyDescription.length >= 100
        ),
        companyWebsite: !!user.employerProfile?.companyWebsite,
        companyLocation: !!user.employerProfile?.companyLocation,
      },
    },
  };

  let totalScore = 0;
  let maxScore = 0;
  const missingFields = [];
  const sectionScores = {};

  Object.entries(completionChecks).forEach(([sectionName, section]) => {
    const sectionFields = Object.entries(section.fields);
    const completedFields = sectionFields.filter(
      ([, isCompleted]) => isCompleted
    ).length;
    const sectionPercentage = (completedFields / sectionFields.length) * 100;
    const weightedScore = (sectionPercentage / 100) * section.weight;

    totalScore += weightedScore;
    maxScore += section.weight;

    sectionScores[sectionName] = {
      percentage: Math.round(sectionPercentage),
      completed: completedFields,
      total: sectionFields.length,
      weight: section.weight,
    };

    // Add missing fields
    sectionFields.forEach(([fieldName, isCompleted]) => {
      if (!isCompleted) {
        missingFields.push({
          section: sectionName,
          field: fieldName,
          priority: section.weight > 50 ? "high" : "medium",
        });
      }
    });
  });

  const overallPercentage = Math.round((totalScore / maxScore) * 100);

  return {
    overallPercentage,
    sectionScores,
    missingFields,
    isComplete: overallPercentage >= 80,
    needsAttention: overallPercentage < 40,
    recommendations: generateRecommendations(missingFields, overallPercentage),
  };
};

/**
 * Generate recommendations based on missing fields
 * @param {Array} missingFields - Array of missing field objects
 * @param {Number} overallPercentage - Overall completion percentage
 * @returns {Array} - Array of recommendation objects
 */
const generateRecommendations = (missingFields, overallPercentage) => {
  const recommendations = [];

  if (overallPercentage < 25) {
    recommendations.push({
      type: "urgent",
      title: "Complete Your Basic Information",
      description:
        "Start by filling out your basic contact information and bio.",
      action: "Go to Profile Settings",
      priority: 1,
    });
  } else if (overallPercentage < 50) {
    recommendations.push({
      type: "important",
      title: "Add Professional Details",
      description:
        "Add your skills, experience level, and salary expectations to attract employers.",
      action: "Complete Professional Info",
      priority: 2,
    });
  } else if (overallPercentage < 80) {
    recommendations.push({
      type: "suggested",
      title: "Enhance Your Profile",
      description:
        "Add work experience and upload your resume to stand out to employers.",
      action: "Add Experience & Resume",
      priority: 3,
    });
  }

  // Specific field recommendations
  const highPriorityMissing = missingFields.filter(
    (field) => field.priority === "high"
  );
  if (highPriorityMissing.length > 0) {
    recommendations.push({
      type: "specific",
      title: "Complete Essential Fields",
      description: `Missing: ${highPriorityMissing
        .map((f) => f.field)
        .join(", ")}`,
      action: "Update Profile",
      priority: 1,
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
};

/**
 * Check if user needs profile completion prompt
 * @param {Object} user - User object
 * @returns {Boolean} - Whether to show completion prompt
 */
const shouldShowProfileCompletion = (user) => {
  if (user.userType !== "jobseeker") return false;

  const completion = calculateJobSeekerProfileCompletion(user);

  // Show if profile is less than 50% complete or if it's a new user
  return (
    completion.overallPercentage < 50 ||
    !user.profile?.profileCompletionPromptShown
  );
};

/**
 * Mark profile completion prompt as shown
 * @param {String} userId - User ID
 */
const markProfileCompletionPromptShown = async (userId) => {
  const User = require("../models/User");
  await User.findByIdAndUpdate(userId, {
    "profile.profileCompletionPromptShown": true,
  });
};

module.exports = {
  calculateJobSeekerProfileCompletion,
  calculateEmployerProfileCompletion,
  shouldShowProfileCompletion,
  markProfileCompletionPromptShown,
  generateRecommendations,
};
