const express = require("express");
const router = express.Router();
const { auth, requireUserType } = require("../middleware/auth");
const JobReport = require("../models/JobReport");
const Job = require("../models/Job");

// Job seeker reports a job
router.post("/", auth, requireUserType("jobseeker"), async (req, res) => {
  try {
    const { jobId, reason, description } = req.body;

    // Validate required fields
    if (!jobId || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: "Job ID, reason, and description are required",
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user already reported this job
    const existingReport = await JobReport.findOne({
      job: jobId,
      reporter: req.user.userId,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this job",
      });
    }

    // Create report
    const report = new JobReport({
      job: jobId,
      reporter: req.user.userId,
      reason,
      description,
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: "Job reported successfully. Our team will review it shortly.",
      data: { report },
    });
  } catch (error) {
    console.error("Error creating job report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit report",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user's reports
router.get(
  "/my-reports",
  auth,
  requireUserType("jobseeker"),
  async (req, res) => {
    try {
      const reports = await JobReport.find({ reporter: req.user.userId })
        .populate("job", "title companyName status")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { reports },
      });
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reports",
      });
    }
  },
);

module.exports = router;
