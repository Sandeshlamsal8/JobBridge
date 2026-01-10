const express = require("express");
const { body, validationResult } = require("express-validator");
const Application = require("../models/Application");
const Job = require("../models/Job");
const {
  auth,
  requireUserType,
  requireAnyUserType,
} = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// @route   POST /api/applications
// @desc    Apply for a job
// @access  Private (Job seekers only)
router.post(
  "/",
  [
    auth,
    requireUserType("jobseeker"),
    upload.single('cv'), // Handle CV file upload
    body("jobId").isMongoId().withMessage("Invalid job ID"),
    body("coverLetter")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Cover letter cannot exceed 2000 characters"),
    body("expectedSalary.amount")
      .optional()
      .isNumeric()
      .withMessage("Expected salary must be a number"),
    body("expectedSalary.period")
      .optional()
      .isIn(["hourly", "monthly", "yearly"])
      .withMessage("Invalid salary period"),
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

      // Check if CV file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "CV file is required",
        });
      }

      const {
        jobId,
        coverLetter,
        expectedSalary,
        questionsAnswers,
      } = req.body;

      // Check if job exists and is active
      const job = await Job.findById(jobId).populate("company");
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      if (job.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "This job is no longer accepting applications",
        });
      }

      // Check if user already applied (excluding withdrawn applications)
      const existingApplication = await Application.findOne({
        job: jobId,
        applicant: req.user.userId,
        status: { $ne: "withdrawn" }, // Exclude withdrawn applications
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: "You have already applied for this job",
        });
      }

      // Create application with CV file info
      const application = new Application({
        job: jobId,
        applicant: req.user.userId,
        employer: job.company._id,
        coverLetter,
        resume: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          uploadedAt: new Date(),
        },
        expectedSalary: expectedSalary ? {
          amount: expectedSalary.amount,
          period: expectedSalary.period || 'yearly',
          currency: 'USD'
        } : undefined,
        questionsAnswers,
      });

      await application.save();

      // Increment job application count
      await job.incrementApplicationCount();

      // Populate application data
      await application.populate([
        { path: "job", select: "title companyName location jobType" },
        { path: "applicant", select: "firstName lastName email profile" },
      ]);

      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: { application },
      });
    } catch (error) {
      console.error("Apply for job error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/applications/my-applications
// @desc    Get job seeker's applications
// @access  Private (Job seekers only)
router.get(
  "/my-applications",
  [auth, requireUserType("jobseeker")],
  async (req, res) => {
    try {
      const { status, jobId, page = 1, limit = 10 } = req.query;

      const filters = { applicant: req.user.userId };
      if (status) filters.status = status;
      if (jobId) filters.job = jobId;

      const applications = await Application.getByApplicant(
        req.user.userId,
        filters
      )
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Application.countDocuments(filters);

      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalApplications: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get my applications error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/applications/employer/received
// @desc    Get applications received by employer
// @access  Private (Employers only)
router.get(
  "/employer/received",
  [auth, requireUserType("employer")],
  async (req, res) => {
    try {
      const { status, jobId, page = 1, limit = 10 } = req.query;

      const filters = { employer: req.user.userId };
      if (status) filters.status = status;
      if (jobId) filters.job = jobId;

      const applications = await Application.getByEmployer(
        req.user.userId,
        filters
      )
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Application.countDocuments(filters);

      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalApplications: total,
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get received applications error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/applications/stats/employer
// @desc    Get application statistics for employer
// @access  Private (Employers only)
router.get(
  "/stats/employer",
  [auth, requireUserType("employer")],
  async (req, res) => {
    try {
      const stats = await Application.getStats(req.user.userId);

      const formattedStats = {
        total: 0,
        pending: 0,
        reviewed: 0,
        shortlisted: 0,
        "interview-scheduled": 0,
        "interview-completed": 0,
        offered: 0,
        hired: 0,
        rejected: 0,
        withdrawn: 0,
      };

      stats.forEach((stat) => {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
      });

      res.json({
        success: true,
        data: { stats: formattedStats },
      });
    } catch (error) {
      console.error("Get application stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/applications/:id
// @desc    Get single application details
// @access  Private (Application owner or job owner)
router.get(
  "/:id",
  [auth, requireAnyUserType(["jobseeker", "employer"])],
  async (req, res) => {
    try {
      const application = await Application.findById(req.params.id)
        .populate(
          "job",
          "title companyName location jobType salary requirements responsibilities"
        )
        .populate(
          "applicant",
          "firstName lastName email profile jobSeekerProfile"
        )
        .populate("employer", "firstName lastName employerProfile.companyName")
        .populate("notes.author", "firstName lastName");

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // Check access permissions
      const isApplicant =
        application.applicant._id.toString() === req.user.userId;
      const isEmployer =
        application.employer._id.toString() === req.user.userId;

      if (!isApplicant && !isEmployer) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Filter private notes for job seekers
      if (isApplicant) {
        application.notes = application.notes.filter((note) => !note.isPrivate);
      }

      res.json({
        success: true,
        data: { application },
      });
    } catch (error) {
      console.error("Get application error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/applications/:id/status
// @desc    Update application status
// @access  Private (Employers only)
router.put(
  "/:id/status",
  [
    auth,
    requireUserType("employer"),
    body("status")
      .isIn([
        "pending",
        "reviewed",
        "shortlisted",
        "interview-scheduled",
        "interview-completed",
        "offered",
        "hired",
        "rejected",
      ])
      .withMessage("Invalid status"),
    body("note")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Note cannot exceed 500 characters"),
    body("rejectionReason")
      .optional()
      .isIn([
        "qualifications",
        "experience",
        "skills",
        "salary-expectations",
        "location",
        "availability",
        "cultural-fit",
        "position-filled",
        "other",
      ]),
    body("rejectionFeedback")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Rejection feedback cannot exceed 500 characters"),
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

      const { status, note, rejectionReason, rejectionFeedback } = req.body;

      const application = await Application.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // Check if user is the employer for this application
      if (application.employer.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Update application
      await application.updateStatus(status, req.user.userId, note);

      if (status === "rejected") {
        if (rejectionReason) application.rejectionReason = rejectionReason;
        if (rejectionFeedback)
          application.rejectionFeedback = rejectionFeedback;
        await application.save();
      }

      await application.populate([
        { path: "job", select: "title companyName" },
        { path: "applicant", select: "firstName lastName email" },
      ]);

      res.json({
        success: true,
        message: "Application status updated successfully",
        data: { application },
      });
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/applications/:id/notes
// @desc    Add note to application
// @access  Private (Employers only)
router.post(
  "/:id/notes",
  [
    auth,
    requireUserType("employer"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Note content must be between 1 and 1000 characters"),
    body("isPrivate")
      .optional()
      .isBoolean()
      .withMessage("isPrivate must be a boolean"),
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

      const { content, isPrivate = true } = req.body;

      const application = await Application.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // Check if user is the employer for this application
      if (application.employer.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      await application.addNote(req.user.userId, content, isPrivate);

      res.json({
        success: true,
        message: "Note added successfully",
      });
    } catch (error) {
      console.error("Add application note error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/applications/:id/withdraw
// @desc    Withdraw application
// @access  Private (Job seekers only - own applications)
router.put(
  "/:id/withdraw",
  [auth, requireUserType("jobseeker")],
  async (req, res) => {
    try {
      const application = await Application.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      // Check if user owns this application
      if (application.applicant.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if application can be withdrawn
      if (["hired", "rejected", "withdrawn"].includes(application.status)) {
        return res.status(400).json({
          success: false,
          message: "This application cannot be withdrawn",
        });
      }

      await application.updateStatus(
        "withdrawn",
        req.user.userId,
        "Application withdrawn by candidate"
      );

      res.json({
        success: true,
        message: "Application withdrawn successfully",
      });
    } catch (error) {
      console.error("Withdraw application error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
