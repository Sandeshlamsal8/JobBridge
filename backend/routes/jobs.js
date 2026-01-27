const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { auth, optionalAuth, requireUserType } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all active jobs with filtering and pagination
// @access  Public
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("search")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Search term too long"),
    query("location")
      .optional()
      .isLength({ max: 100 })
      .withMessage("Location filter too long"),
    query("jobType")
      .optional()
      .isIn(["full-time", "part-time", "contract", "internship", "freelance"]),
    query("workMode").optional().isIn(["remote", "onsite", "hybrid"]),
    query("experienceLevel")
      .optional()
      .isIn(["entry", "mid", "senior", "executive"]),
    query("category")
      .optional()
      .isIn([
        "technology",
        "marketing",
        "sales",
        "design",
        "finance",
        "hr",
        "operations",
        "customer-service",
        "healthcare",
        "education",
        "legal",
        "other",
      ]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 10,
        search,
        location,
        jobType,
        workMode,
        experienceLevel,
        category,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build filter object
      const filters = { status: "active" };

      if (location) {
        filters.location = { $regex: location, $options: "i" };
      }
      if (jobType) filters.jobType = jobType;
      if (workMode) filters.workMode = workMode;
      if (experienceLevel) filters.experienceLevel = experienceLevel;
      if (category) filters.category = category;

      let query;
      let countFilters = { status: "active" };

      if (search) {
        // Text search
        query = Job.searchJobs(search, filters);
        // For count, we need to build the same query structure
        countFilters = {
          status: "active",
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { skills: { $regex: search, $options: "i" } },
            { companyName: { $regex: search, $options: "i" } },
          ],
        };
        // Apply additional filters to count
        Object.keys(filters).forEach((key) => {
          if (
            filters[key] !== undefined &&
            filters[key] !== null &&
            key !== "status"
          ) {
            countFilters[key] = filters[key];
          }
        });
      } else {
        // Regular filtering
        query = Job.findActiveJobs(filters);
        countFilters = filters;
      }

      // Apply sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
      query = query.sort(sortOptions);

      // Apply pagination
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(parseInt(limit));

      const jobs = await query;
      const total = await Job.countDocuments(countFilters);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalJobs: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/jobs/categories
// @desc    Get all available job categories with search functionality
// @access  Public
router.get("/categories", async (req, res) => {
  try {
    const { search } = req.query;

    // All available categories from the Job model enum
    const allCategories = [
      "technology",
      "marketing",
      "sales",
      "design",
      "finance",
      "hr",
      "operations",
      "customer-service",
      "healthcare",
      "education",
      "legal",
      "other",
    ];

    // Create category objects with display names and job counts
    let categories = await Promise.all(
      allCategories.map(async (category) => {
        const jobCount = await Job.countDocuments({
          status: "active",
          category: category,
        });

        return {
          value: category,
          label: category
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          jobCount: jobCount,
        };
      }),
    );

    // Filter by search term if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      categories = categories.filter(
        (category) =>
          category.label.toLowerCase().includes(searchTerm) ||
          category.value.toLowerCase().includes(searchTerm),
      );
    }

    // Sort by job count (descending) then by label
    categories.sort((a, b) => {
      if (b.jobCount !== a.jobCount) {
        return b.jobCount - a.jobCount;
      }
      return a.label.localeCompare(b.label);
    });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/jobs/recommended
// @desc    Get recommended jobs for job seeker based on their preferences
// @access  Private (Job seekers only)
router.get(
  "/recommended",
  [auth, requireUserType("jobseeker")],
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // Get user's job preferences
      const user = await require("../models/User").findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userCategories =
        user.jobSeekerProfile?.jobPreferences?.categories || [];

      let jobs = [];

      if (userCategories.length > 0) {
        // Find jobs matching user's preferred categories
        jobs = await Job.find({
          status: "active",
          category: { $in: userCategories },
        })
          .populate(
            "company",
            "firstName lastName employerProfile.companyName employerProfile.companySize",
          )
          .sort({ createdAt: -1, featured: -1 })
          .limit(parseInt(limit));
      }

      // If not enough jobs found or no preferences set, get general active jobs
      if (jobs.length < limit) {
        const remainingLimit = limit - jobs.length;
        const existingJobIds = jobs.map((job) => job._id);

        const additionalJobs = await Job.find({
          status: "active",
          _id: { $nin: existingJobIds },
        })
          .populate(
            "company",
            "firstName lastName employerProfile.companyName employerProfile.companySize",
          )
          .sort({ featured: -1, createdAt: -1 })
          .limit(remainingLimit);

        jobs = [...jobs, ...additionalJobs];
      }

      res.json({
        success: true,
        data: {
          jobs,
          recommendationBasis:
            userCategories.length > 0 ? "preferences" : "general",
          userPreferences: userCategories,
        },
      });
    } catch (error) {
      console.error("Get recommended jobs error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public (with optional auth to check application status)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "company",
      "firstName lastName employerProfile.companyName employerProfile.companySize employerProfile.companyDescription employerProfile.companyWebsite",
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Increment view count
    await job.incrementViewCount();

    // Check if user has applied (if authenticated)
    let hasApplied = false;
    let applicationStatus = null;

    if (req.user && req.user.userId) {
      const existingApplication = await Application.findOne({
        job: req.params.id,
        applicant: req.user.userId,
        status: { $ne: "withdrawn" },
      });

      if (existingApplication) {
        hasApplied = true;
        applicationStatus = existingApplication.status;
      }
    }

    res.json({
      success: true,
      data: {
        job,
        hasApplied,
        applicationStatus,
      },
    });
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Employers only)
router.post(
  "/",
  [
    auth,
    requireUserType("employer"),
    body("title")
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Title must be between 5 and 100 characters"),
    body("description")
      .trim()
      .isLength({ min: 50, max: 5000 })
      .withMessage("Description must be between 50 and 5000 characters"),
    body("location")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Location must be between 2 and 100 characters"),
    body("jobType")
      .isIn(["full-time", "part-time", "contract", "internship", "freelance"])
      .withMessage("Invalid job type"),
    body("workMode")
      .isIn(["remote", "onsite", "hybrid"])
      .withMessage("Invalid work mode"),
    body("experienceLevel")
      .isIn(["entry", "mid", "senior", "executive"])
      .withMessage("Invalid experience level"),
    body("category")
      .isIn([
        "technology",
        "marketing",
        "sales",
        "design",
        "finance",
        "hr",
        "operations",
        "customer-service",
        "healthcare",
        "education",
        "legal",
        "other",
      ])
      .withMessage("Invalid category"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("requirements")
      .optional()
      .isArray()
      .withMessage("Requirements must be an array"),
    body("responsibilities")
      .optional()
      .isArray()
      .withMessage("Responsibilities must be an array"),
    body("benefits")
      .optional()
      .isArray()
      .withMessage("Benefits must be an array"),
    body("salary.min")
      .optional()
      .isNumeric()
      .withMessage("Minimum salary must be a number"),
    body("salary.max")
      .optional()
      .isNumeric()
      .withMessage("Maximum salary must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      // Fetch complete user data to get company name
      const user = await require("../models/User").findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Determine company name based on user type
      let companyName;
      if (user.userType === "employer" && user.employerProfile?.companyName) {
        companyName = user.employerProfile.companyName;
      } else {
        companyName = `${user.firstName} ${user.lastName}`;
      }

      const jobData = {
        ...req.body,
        company: req.user.userId,
        companyName: companyName,
      };

      const job = new Job(jobData);
      await job.save();

      await job.populate(
        "company",
        "firstName lastName employerProfile.companyName employerProfile.companySize",
      );

      res.status(201).json({
        success: true,
        message: "Job posted successfully",
        data: { job },
      });
    } catch (error) {
      console.error("Create job error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   PUT /api/jobs/:id
// @desc    Update job posting
// @access  Private (Job owner only)
router.put(
  "/:id",
  [
    auth,
    requireUserType("employer"),
    body("title")
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Title must be between 5 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 50, max: 5000 })
      .withMessage("Description must be between 50 and 5000 characters"),
    body("location")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Location must be between 2 and 100 characters"),
    body("jobType")
      .optional()
      .isIn(["full-time", "part-time", "contract", "internship", "freelance"])
      .withMessage("Invalid job type"),
    body("workMode")
      .optional()
      .isIn(["remote", "onsite", "hybrid"])
      .withMessage("Invalid work mode"),
    body("experienceLevel")
      .optional()
      .isIn(["entry", "mid", "senior", "executive"])
      .withMessage("Invalid experience level"),
    body("status")
      .optional()
      .isIn(["draft", "active", "paused", "closed"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Check if user owns this job
      if (job.company.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only edit your own job postings.",
        });
      }

      // Update job
      Object.assign(job, req.body);
      await job.save();

      await job.populate(
        "company",
        "firstName lastName employerProfile.companyName employerProfile.companySize",
      );

      res.json({
        success: true,
        message: "Job updated successfully",
        data: { job },
      });
    } catch (error) {
      console.error("Update job error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   DELETE /api/jobs/:id
// @desc    Delete job posting
// @access  Private (Job owner only)
router.delete("/:id", [auth, requireUserType("employer")], async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user owns this job
    if (job.company.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own job postings.",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/jobs/employer/my-jobs
// @desc    Get employer's job postings
// @access  Private (Employers only)
router.get(
  "/employer/my-jobs",
  [auth, requireUserType("employer")],
  async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;

      const filters = { company: req.user.userId };
      if (status) filters.status = status;

      const skip = (page - 1) * limit;

      const jobs = await Job.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("company", "firstName lastName employerProfile.companyName");

      const total = await Job.countDocuments(filters);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalJobs: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get employer jobs error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/jobs/stats/categories
// @desc    Get job statistics by category
// @access  Public
router.get("/stats/categories", async (req, res) => {
  try {
    const stats = await Job.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get category stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
