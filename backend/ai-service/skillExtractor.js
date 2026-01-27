const natural = require("natural");
const compromise = require("compromise");

// Common technical skills database
const TECHNICAL_SKILLS = [
  // Programming Languages
  "javascript",
  "python",
  "java",
  "c++",
  "c#",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "go",
  "rust",
  "typescript",
  "scala",
  "r",
  "matlab",
  "perl",
  "shell",
  "bash",

  // Web Technologies
  "html",
  "css",
  "react",
  "angular",
  "vue",
  "node.js",
  "express",
  "django",
  "flask",
  "spring",
  "asp.net",
  "laravel",
  "rails",
  "next.js",
  "nuxt.js",
  "gatsby",
  "svelte",
  "jquery",
  "bootstrap",
  "tailwind",
  "sass",
  "less",

  // Databases
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "redis",
  "elasticsearch",
  "cassandra",
  "oracle",
  "sqlite",
  "dynamodb",
  "firebase",
  "mariadb",
  "neo4j",

  // Cloud & DevOps
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "jenkins",
  "gitlab",
  "github",
  "terraform",
  "ansible",
  "chef",
  "puppet",
  "circleci",
  "travis ci",
  "nginx",
  "apache",
  "linux",
  "unix",
  "ci/cd",
  "devops",

  // Data Science & AI
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "keras",
  "scikit-learn",
  "pandas",
  "numpy",
  "data analysis",
  "data science",
  "nlp",
  "computer vision",
  "ai",
  "artificial intelligence",
  "neural networks",

  // Mobile Development
  "ios",
  "android",
  "react native",
  "flutter",
  "xamarin",
  "ionic",

  // Testing
  "jest",
  "mocha",
  "chai",
  "selenium",
  "cypress",
  "junit",
  "pytest",
  "unit testing",
  "integration testing",
  "test automation",

  // Tools & Methodologies
  "git",
  "agile",
  "scrum",
  "kanban",
  "jira",
  "confluence",
  "slack",
  "rest api",
  "graphql",
  "microservices",
  "api",
  "json",
  "xml",
  "oauth",
  "jwt",
  "websocket",
  "grpc",

  // Design
  "ui/ux",
  "figma",
  "sketch",
  "adobe xd",
  "photoshop",
  "illustrator",
  "wireframing",
  "prototyping",

  // Business Skills
  "project management",
  "leadership",
  "communication",
  "problem solving",
  "team collaboration",
  "analytical thinking",
  "strategic planning",
];

// Soft skills database
const SOFT_SKILLS = [
  "leadership",
  "communication",
  "teamwork",
  "problem solving",
  "critical thinking",
  "time management",
  "adaptability",
  "creativity",
  "collaboration",
  "organization",
  "attention to detail",
  "analytical",
  "interpersonal",
  "presentation",
  "negotiation",
  "conflict resolution",
  "decision making",
  "emotional intelligence",
  "mentoring",
];

/**
 * Extract skills from text using pattern matching and NLP
 */
function extractSkills(text) {
  const lowerText = text.toLowerCase();
  const extractedSkills = new Set();

  // Extract technical skills
  TECHNICAL_SKILLS.forEach((skill) => {
    const regex = new RegExp(
      `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    if (regex.test(lowerText)) {
      extractedSkills.add(skill);
    }
  });

  // Extract soft skills
  SOFT_SKILLS.forEach((skill) => {
    const regex = new RegExp(
      `\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    if (regex.test(lowerText)) {
      extractedSkills.add(skill);
    }
  });

  return Array.from(extractedSkills);
}

/**
 * Extract experience years from text
 */
function extractExperience(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /experience\s*:?\s*(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*yrs?\s+(?:of\s+)?experience/gi,
  ];

  let maxYears = 0;

  patterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (years > maxYears) {
        maxYears = years;
      }
    }
  });

  return maxYears;
}

/**
 * Extract education information
 */
function extractEducation(text) {
  const degrees = [];
  const degreePatterns = [
    /bachelor'?s?\s+(?:of\s+)?(?:science|arts|engineering|technology|business)?/gi,
    /master'?s?\s+(?:of\s+)?(?:science|arts|engineering|technology|business)?/gi,
    /phd|doctorate|doctoral/gi,
    /mba|m\.b\.a/gi,
    /b\.?tech|b\.?e\.?|b\.?s\.?|b\.?a\.?/gi,
    /m\.?tech|m\.?e\.?|m\.?s\.?|m\.?a\.?/gi,
  ];

  degreePatterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      degrees.push(match[0]);
    }
  });

  return [...new Set(degrees)];
}

/**
 * Extract contact information
 */
function extractContactInfo(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];

  return {
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
  };
}

/**
 * Extract certifications
 */
function extractCertifications(text) {
  const certPatterns = [
    /certified\s+[\w\s]+/gi,
    /certification\s+in\s+[\w\s]+/gi,
    /aws\s+certified/gi,
    /microsoft\s+certified/gi,
    /google\s+certified/gi,
    /pmp|scrum\s+master|csm|psm/gi,
  ];

  const certifications = [];
  certPatterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      certifications.push(match[0].trim());
    }
  });

  return [...new Set(certifications)];
}

/**
 * Comprehensive CV analysis
 */
function analyzeCV(text) {
  return {
    skills: extractSkills(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    contact: extractContactInfo(text),
    certifications: extractCertifications(text),
    rawText: text,
  };
}

module.exports = {
  extractSkills,
  extractExperience,
  extractEducation,
  extractContactInfo,
  extractCertifications,
  analyzeCV,
  TECHNICAL_SKILLS,
  SOFT_SKILLS,
};
