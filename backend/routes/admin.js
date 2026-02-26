const express = require("express");
const router = express.Router();
const { auth, requireAdmin } = require("../middleware/auth");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const JobReport = require("../models/JobReport");

// All admin routes require authentication and admin role
router.use(auth, requireAdmin);

// UC8: View Reports - Get system statistics
router.get("/reports/stats", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const createdAtFilter =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // User statistics
    const [
      totalUsers,
      activeUsers,
      jobSeekers,
      employers,
      verifiedUsers,
      newUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ userType: "jobseeker" }),
      User.countDocuments({ userType: "employer" }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments(createdAtFilter),
    ]);

    // Job statistics
    const [totalJobs, activeJobs, closedJobs, newJobs] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: "active" }),
      Job.countDocuments({ status: "closed" }),
      Job.countDocuments(createdAtFilter),
    ]);

    // Application statistics
    const [
      totalApplications,
      pendingApplications,
      reviewedApplications,
      acceptedApplications,
      rejectedApplications,
      newApplications,
    ] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: "pending" }),
      Application.countDocuments({ status: "reviewed" }),
      Application.countDocuments({ status: "accepted" }),
      Application.countDocuments({ status: "rejected" }),
      Application.countDocuments(createdAtFilter),
    ]);

    // Recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email userType createdAt isEmailVerified")
      .lean();

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("company", "firstName lastName employerProfile.companyName")
      .select("title companyName location status createdAt")
      .lean();

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          jobSeekers,
          employers,
          verified: verifiedUsers,
          new: newUsers,
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
          closed: closedJobs,
          new: newJobs,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          reviewed: reviewedApplications,
          accepted: acceptedApplications,
          rejected: rejectedApplications,
          new: newApplications,
        },
        recentActivity: {
          users: recentUsers,
          jobs: recentJobs,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// UC8: View Reports - Get user growth data
router.get("/reports/user-growth", async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let groupBy;
    if (period === "day") {
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (period === "week") {
      groupBy = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
    } else {
      groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    }

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: groupBy,
          jobSeekers: {
            $sum: { $cond: [{ $eq: ["$userType", "jobseeker"] }, 1, 0] },
          },
          employers: {
            $sum: { $cond: [{ $eq: ["$userType", "employer"] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: userGrowth,
    });
  } catch (error) {
    console.error("Error fetching user growth:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user growth data",
    });
  }
});

// UC9: Manage Users - Get all users with filters
router.get("/users", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userType,
      isActive,
      isEmailVerified,
      search,
    } = req.query;

    const filter = {};
    if (userType) filter.userType = userType;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isEmailVerified !== undefined)
      filter.isEmailVerified = isEmailVerified === "true";

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// UC9: Manage Users - Get single user details
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's jobs if employer
    let jobs = [];
    if (user.userType === "employer") {
      jobs = await Job.find({ company: user._id })
        .select("title status createdAt")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // Get user's applications if job seeker
    let applications = [];
    if (user.userType === "jobseeker") {
      applications = await Application.find({ applicant: user._id })
        .populate("job", "title company")
        .select("status createdAt")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      data: {
        user,
        jobs,
        applications,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
    });
  }
});

// UC9: Manage Users - Update user status
router.patch("/users/:userId/status", async (req, res) => {
  try {
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: "isActive field is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: { user },
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
});

// UC9: Manage Users - Delete user
router.delete("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting admin users
    if (user.userType === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    // Delete related data
    if (user.userType === "employer") {
      await Job.deleteMany({ company: user._id });
    } else if (user.userType === "jobseeker") {
      await Application.deleteMany({ applicant: user._id });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

// Get all jobs with filters
router.get("/jobs", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicationCount: { $size: "$applications" },
        },
      },
      {
        $project: {
          applications: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const total = await Job.countDocuments(filter);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
});

// Get single job details with application stats
router.get("/jobs/:jobId", async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Get employer info
    const employer = await User.findById(job.company).select(
      "firstName lastName email",
    );

    // Get application statistics
    const applications = await Application.find({ job: job._id });
    const applicationStats = {
      total: applications.length,
      pending: applications.filter((app) => app.status === "pending").length,
      reviewed: applications.filter((app) => app.status === "reviewed").length,
      accepted: applications.filter((app) => app.status === "accepted").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    };

    res.json({
      success: true,
      data: {
        job,
        employer,
        applicationStats,
      },
    });
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
    });
  }
});

// Get all job reports
router.get("/reports", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await JobReport.find(filter)
      .populate("job", "title companyName location status")
      .populate("reporter", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobReport.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
});

// Get single report details
router.get("/reports/:reportId", async (req, res) => {
  try {
    const report = await JobReport.findById(req.params.reportId)
      .populate("job")
      .populate("reporter", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Get employer info
    const employer = await User.findById(report.job.company).select(
      "firstName lastName email",
    );

    res.json({
      success: true,
      data: {
        report,
        employer,
      },
    });
  } catch (error) {
    console.error("Error fetching report details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report details",
    });
  }
});

// Update report status and take action
router.patch("/reports/:reportId", async (req, res) => {
  try {
    const { status, adminNotes, actionTaken } = req.body;

    const report = await JobReport.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Update report
    report.status = status || report.status;
    report.adminNotes = adminNotes || report.adminNotes;
    report.actionTaken = actionTaken || report.actionTaken;
    report.reviewedBy = req.user.userId;
    report.reviewedAt = new Date();

    // Take action on the job if specified
    if (actionTaken === "job-removed") {
      await Job.findByIdAndUpdate(report.job, { status: "closed" });
    }

    await report.save();

    res.json({
      success: true,
      message: "Report updated successfully",
      data: { report },
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update report",
    });
  }
});

module.exports = router;
