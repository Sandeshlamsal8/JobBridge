const express = require("express");
const router = express.Router();
const LocationService = require("../services/locationService");
const { auth } = require("../middleware/auth");

// @route   GET /api/location/search
// @desc    Search for locations
// @access  Private
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const locations = await LocationService.searchLocations(q);

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Location search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching locations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/location/detect
// @desc    Detect user location based on IP
// @access  Private
router.get("/detect", auth, async (req, res) => {
  try {
    // Get client IP
    const clientIP =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"];

    const location = await LocationService.getLocationByIP(clientIP);

    if (!location) {
      return res.json({
        success: true,
        data: null,
        message: "Could not detect location",
      });
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Location detection error:", error);
    res.status(500).json({
      success: false,
      message: "Error detecting location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
