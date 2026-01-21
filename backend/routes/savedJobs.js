const express = require("express");
const { body, validationResult } = require("express-validator");
const SavedJob = require("../models/SavedJob");
const Job = require("../models/Job");
const { auth, requireUserType } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/saved-jobs
// @desc    Save a job
// @access  Private (Job seekers only)
router.post(
  "/",
  [
    auth,
    requireUserType("jobseeker"),
    body("jobId").isMongoId().withMessage("Invalid job ID"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high"])
      .withMessage("Invalid priority"),
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

      const { jobId, notes = "", priority = "medium", tags = [] } = req.body;

      // Check if job exists
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      // Check if job is already saved
      const existingSavedJob = await SavedJob.findOne({
        user: req.user.userId,
        job: jobId,
      });

      if (existingSavedJob) {
        if (existingSavedJob.status === "saved") {
          return res.status(400).json({
            success: false,
            message: "Job is already saved",
          });
        } else {
          // Update existing record to saved status
          existingSavedJob.status = "saved";
          existingSavedJob.notes = notes;
          existingSavedJob.priority = priority;
          existingSavedJob.tags = tags;
          await existingSavedJob.save();

          await existingSavedJob.populate({
            path: "job",
            select: "title companyName location jobType workMode salary",
          });

          return res.json({
            success: true,
            message: "Job saved successfully",
            data: { savedJob: existingSavedJob },
          });
        }
      }

      // Create new saved job
      const savedJob = new SavedJob({
        user: req.user.userId,
        job: jobId,
        notes,
        priority,
        tags,
      });

      await savedJob.save();

      await savedJob.populate({
        path: "job",
        select: "title companyName location jobType workMode salary",
      });

      res.status(201).json({
        success: true,
        message: "Job saved successfully",
        data: { savedJob },
      });
    } catch (error) {
      console.error("Save job error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Job is already saved",
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/saved-jobs
// @desc    Get user's saved jobs
// @access  Private (Job seekers only)
router.get("/", [auth, requireUserType("jobseeker")], async (req, res) => {
  try {
    const {
      status = "saved",
      priority,
      limit = 20,
      skip = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const options = {
      status,
      priority,
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
      sortOrder: sortOrder === "desc" ? -1 : 1,
    };

    const savedJobs = await SavedJob.getUserSavedJobs(req.user.userId, options);
    const totalCount = await SavedJob.getSavedJobsCount(
      req.user.userId,
      status
    );

    res.json({
      success: true,
      data: {
        savedJobs,
        pagination: {
          currentPage: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(totalCount / limit),
          totalJobs: totalCount,
          hasNext: skip + limit < totalCount,
          hasPrev: skip > 0,
        },
      },
    });
  } catch (error) {
    console.error("Get saved jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/saved-jobs/check/:jobId
// @desc    Check if job is saved by user
// @access  Private (Job seekers only)
router.get(
  "/check/:jobId",
  [auth, requireUserType("jobseeker")],
  async (req, res) => {
    try {
      const savedJob = await SavedJob.isJobSavedByUser(
        req.user.userId,
        req.params.jobId
      );

      res.json({
        success: true,
        data: {
          isSaved: !!savedJob,
          savedJob: savedJob || null,
        },
      });
    } catch (error) {
      console.error("Check saved job error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/saved-jobs/:id
// @desc    Update saved job
// @access  Private (Job seekers only)
router.put(
  "/:id",
  [
    auth,
    requireUserType("jobseeker"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high"])
      .withMessage("Invalid priority"),
    body("status")
      .optional()
      .isIn(["saved", "applied", "not_interested"])
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

      const { notes, priority, status, tags } = req.body;

      const savedJob = await SavedJob.findOne({
        _id: req.params.id,
        user: req.user.userId,
      });

      if (!savedJob) {
        return res.status(404).json({
          success: false,
          message: "Saved job not found",
        });
      }

      // Update fields if provided
      if (notes !== undefined) savedJob.notes = notes;
      if (priority !== undefined) savedJob.priority = priority;
      if (status !== undefined) savedJob.status = status;
      if (tags !== undefined) savedJob.tags = tags;

      await savedJob.save();

      await savedJob.populate({
        path: "job",
        select: "title companyName location jobType workMode salary",
      });

      res.json({
        success: true,
        message: "Saved job updated successfully",
        data: { savedJob },
      });
    } catch (error) {
      console.error("Update saved job error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   DELETE /api/saved-jobs/:id
// @desc    Remove saved job
// @access  Private (Job seekers only)
router.delete(
  "/:id",
  [auth, requireUserType("jobseeker")],
  async (req, res) => {
    try {
      const savedJob = await SavedJob.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
      });

      if (!savedJob) {
        return res.status(404).json({
          success: false,
          message: "Saved job not found",
        });
      }

      res.json({
        success: true,
        message: "Job removed from saved list",
      });
    } catch (error) {
      console.error("Remove saved job error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/saved-jobs/stats
// @desc    Get saved jobs statistics
// @access  Private (Job seekers only)
router.get("/stats", [auth, requireUserType("jobseeker")], async (req, res) => {
  try {
    const stats = await SavedJob.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      saved: 0,
      applied: 0,
      not_interested: 0,
      total: 0,
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
    console.error("Get saved jobs stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
