const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists and is active
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Token is not valid - user not found",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated",
        });
      }

      // Add user info to request
      req.user = {
        id: decoded.userId,
        userId: decoded.userId, // Keep both for compatibility
        userType: user.userType,
        email: user.email,
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired",
          code: "TOKEN_EXPIRED",
        });
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Token is not valid",
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Middleware to check if user is a specific type
const requireUserType = (userType) => {
  return (req, res, next) => {
    if (req.user.userType !== userType) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${userType} account required.`,
      });
    }
    next();
  };
};

// Middleware to check if user is either jobseeker or employer
const requireAnyUserType = (userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. One of the following account types required: ${userTypes.join(
          ", "
        )}`,
      });
    }
    next();
  };
};

module.exports = {
  auth,
  requireUserType,
  requireAnyUserType,
};
