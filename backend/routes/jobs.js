const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { auth, requireUserType } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/jobs
// @desc    Get all active jobs with filtering and pagination
// @access  Public
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
    query('location').optional().isLength({ max: 100 }).withMessage('Location filter too long'),
    query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
    query('workMode').optional().isIn(['remote', 'onsite', 'hybrid']),
    query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'executive']),
    query('category').optional().isIn(['technology', 'marketing', 'sales', 'design', 'finance', 'hr', 'operations', 'customer-service', 'healthcare', 'education', 'legal', 'other'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
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
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filters = { status: 'active' };

        if (location) {
            filters.location = { $regex: location, $options: 'i' };
        }
        if (jobType) filters.jobType = jobType;
        if (workMode) filters.workMode = workMode;
        if (experienceLevel) filters.experienceLevel = experienceLevel;
        if (category) filters.category = category;

        let query;

        if (search) {
            // Text search
            query = Job.searchJobs(search, filters);
        } else {
            // Regular filtering
            query = Job.findActiveJobs(filters);
        }

        // Apply sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        query = query.sort(sortOptions);

        // Apply pagination
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(parseInt(limit));

        const jobs = await query;
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
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('company', 'firstName lastName employerProfile.companyName employerProfile.companySize employerProfile.companyDescription employerProfile.companyWebsite');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Increment view count
        await job.incrementViewCount();

        res.json({
            success: true,
            data: { job }
        });

    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Employers only)
router.post('/', [
    auth,
    requireUserType('employer'),
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('description').trim().isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
    body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
    body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']).withMessage('Invalid job type'),
    body('workMode').isIn(['remote', 'onsite', 'hybrid']).withMessage('Invalid work mode'),
    body('experienceLevel').isIn(['entry', 'mid', 'senior', 'executive']).withMessage('Invalid experience level'),
    body('category').isIn(['technology', 'marketing', 'sales', 'design', 'finance', 'hr', 'operations', 'customer-service', 'healthcare', 'education', 'legal', 'other']).withMessage('Invalid category'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('requirements').optional().isArray().withMessage('Requirements must be an array'),
    body('responsibilities').optional().isArray().withMessage('Responsibilities must be an array'),
    body('benefits').optional().isArray().withMessage('Benefits must be an array'),
    body('salary.min').optional().isNumeric().withMessage('Minimum salary must be a number'),
    body('salary.max').optional().isNumeric().withMessage('Maximum salary must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const jobData = {
            ...req.body,
            company: req.user.userId,
            companyName: req.user.companyName || `${req.user.firstName} ${req.user.lastName}`
        };

        const job = new Job(jobData);
        await job.save();

        await job.populate('company', 'firstName lastName employerProfile.companyName employerProfile.companySize');

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            data: { job }
        });

    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/jobs/:id
// @desc    Update job posting
// @access  Private (Job owner only)
router.put('/:id', [
    auth,
    requireUserType('employer'),
    body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('description').optional().trim().isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
    body('location').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
    body('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']).withMessage('Invalid job type'),
    body('workMode').optional().isIn(['remote', 'onsite', 'hybrid']).withMessage('Invalid work mode'),
    body('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'executive']).withMessage('Invalid experience level'),
    body('status').optional().isIn(['draft', 'active', 'paused', 'closed']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user owns this job
        if (job.company.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only edit your own job postings.'
            });
        }

        // Update job
        Object.assign(job, req.body);
        await job.save();

        await job.populate('company', 'firstName lastName employerProfile.companyName employerProfile.companySize');

        res.json({
            success: true,
            message: 'Job updated successfully',
            data: { job }
        });

    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job posting
// @access  Private (Job owner only)
router.delete('/:id', [auth, requireUserType('employer')], async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user owns this job
        if (job.company.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own job postings.'
            });
        }

        await Job.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });

    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/jobs/employer/my-jobs
// @desc    Get employer's job postings
// @access  Private (Employers only)
router.get('/employer/my-jobs', [auth, requireUserType('employer')], async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filters = { company: req.user.userId };
        if (status) filters.status = status;

        const skip = (page - 1) * limit;

        const jobs = await Job.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('company', 'firstName lastName employerProfile.companyName');

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
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get employer jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/jobs/stats/categories
// @desc    Get job statistics by category
// @access  Public
router.get('/stats/categories', async (req, res) => {
    try {
        const stats = await Job.aggregate([
            { $match: { status: 'active' } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('Get category stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;