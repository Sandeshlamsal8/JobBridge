/**
 * Check if employer's company profile is complete
 * @param {Object} user - User object with employerProfile
 * @returns {boolean} - True if profile is complete, false otherwise
 */
export const isCompanyProfileComplete = (user) => {
  const employerProfile = user?.employerProfile;

  if (!employerProfile) return false;

  return !!(
    employerProfile.companyName &&
    employerProfile.industry &&
    employerProfile.companySize &&
    employerProfile.companyLocation &&
    employerProfile.companyDescription &&
    employerProfile.companyDescription.length >= 50
  );
};

/**
 * Get missing company profile fields
 * @param {Object} user - User object with employerProfile
 * @returns {Array} - Array of missing field names
 */
export const getMissingCompanyFields = (user) => {
  const employerProfile = user?.employerProfile;
  const missing = [];

  if (!employerProfile?.companyName) missing.push("Company Name");
  if (!employerProfile?.industry) missing.push("Industry");
  if (!employerProfile?.companySize) missing.push("Company Size");
  if (!employerProfile?.companyLocation) missing.push("Company Location");
  if (
    !employerProfile?.companyDescription ||
    employerProfile.companyDescription.length < 50
  ) {
    missing.push("Company Description");
  }

  return missing;
};

/**
 * Calculate company profile completion percentage
 * @param {Object} user - User object with employerProfile
 * @returns {number} - Completion percentage (0-100)
 */
export const getCompanyProfileCompletion = (user) => {
  const employerProfile = user?.employerProfile;
  if (!employerProfile) return 0;

  const fields = [
    employerProfile.companyName,
    employerProfile.industry,
    employerProfile.companySize,
    employerProfile.companyLocation,
    employerProfile.companyDescription &&
      employerProfile.companyDescription.length >= 50,
    employerProfile.companyWebsite, // Optional but counts toward completion
    employerProfile.foundedYear, // Optional but counts toward completion
  ];

  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
};
