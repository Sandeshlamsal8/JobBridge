const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const PasswordReset = require("../models/PasswordReset");
const { auth } = require("../middleware/auth");
const {
  generatePIN,
  sendVerificationEmail,
  generateResetToken,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("../utils/emailService");
const {
  hashResetToken,
  hashPin,
  comparePin,
} = require("../utils/securityTokens");
const { createRateLimiter } = require("../middleware/rateLimit");

const router = express.Router();
const emailKey = (req) =>
  `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`;
const signupLimit = createRateLimiter({
  name: "signup",
  limit: 5,
  windowSeconds: 15 * 60,
  key: emailKey,
});
const loginLimit = createRateLimiter({
  name: "login",
  limit: 10,
  windowSeconds: 15 * 60,
  key: emailKey,
});
const verifyLimit = createRateLimiter({
  name: "verify-email",
  limit: 10,
  windowSeconds: 15 * 60,
  key: emailKey,
});
const resendLimit = createRateLimiter({
  name: "resend-pin",
  limit: 3,
  windowSeconds: 60 * 60,
  key: emailKey,
});
const forgotPasswordLimit = createRateLimiter({
  name: "password-reset",
  limit: 5,
  windowSeconds: 60 * 60,
  key: emailKey,
});
const resetPasswordLimit = createRateLimiter({
  name: "password-reset",
  limit: 5,
  windowSeconds: 60 * 60,
  key: (req) => req.ip,
});

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      tokenVersion: Number(user.tokenVersion || 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "15m" },
  );
}

function sendValidationErrors(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: errors.array(),
  });
  return true;
}

const passwordRules = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters long")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  );

router.post(
  "/signup",
  signupLimit,
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address"),
    passwordRules,
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    }),
    body("userType")
      .isIn(["jobseeker", "employer"])
      .withMessage("User type must be either jobseeker or employer"),
    body("agreeToTerms").custom((value) => {
      if (value !== true) throw new Error("You must agree to the terms and conditions");
      return true;
    }),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;
      const { firstName, lastName, email, password, userType } = req.body;
      let user = await User.findOne({ email });

      if (user?.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email address",
        });
      }

      if (user) {
        user.firstName = firstName;
        user.lastName = lastName;
        user.password = password;
        user.userType = userType;
        user.isActive = true;
      } else {
        user = new User({
          firstName,
          lastName,
          email,
          password,
          userType,
          isEmailVerified: false,
        });
      }
      await user.save();

      const pin = generatePIN();
      await EmailVerification.deleteMany({
        $or: [{ email }, { userId: user._id }],
      });
      await EmailVerification.create({
        userId: user._id,
        email,
        pinHash: await hashPin(pin),
      });

      const emailResult = await sendVerificationEmail(email, pin, firstName);
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email. Please try again.",
        });
      }

      return res.json({
        success: true,
        message: "Verification PIN sent to your email. Please check your inbox.",
        data: { email, expiresIn: "15 minutes" },
      });
    } catch (error) {
      console.error("Signup error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error during registration",
      });
    }
  },
);

router.post(
  "/verify-email",
  verifyLimit,
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address"),
    body("pin").isLength({ min: 6, max: 6 }).isNumeric().withMessage("PIN must be 6 digits"),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;
      const { email, pin } = req.body;
      const verification = await EmailVerification.findOne({ email });

      if (!verification) {
        return res.status(400).json({
          success: false,
          message: "Verification request not found or already used. Please sign up again.",
        });
      }
      if (verification.expiresAt < new Date()) {
        await verification.deleteOne();
        return res.status(400).json({
          success: false,
          message: "Verification PIN has expired. Please sign up again.",
        });
      }
      if (verification.attempts >= 5) {
        await verification.deleteOne();
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please sign up again.",
        });
      }
      if (!(await comparePin(pin, verification.pinHash))) {
        verification.attempts += 1;
        await verification.save();
        return res.status(400).json({
          success: false,
          message: `Invalid PIN. ${5 - verification.attempts} attempts remaining.`,
        });
      }

      const user = await User.findById(verification.userId);
      if (!user) {
        await verification.deleteOne();
        return res.status(400).json({
          success: false,
          message: "Registration no longer exists. Please sign up again.",
        });
      }

      user.isEmailVerified = true;
      await user.save();
      await verification.deleteOne();

      return res.status(201).json({
        success: true,
        message: "Email verified successfully! Your account has been created.",
        data: { user: user.toProfileJSON(), token: generateToken(user) },
      });
    } catch (error) {
      console.error("Verification error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error during verification",
      });
    }
  },
);

router.post(
  "/resend-pin",
  resendLimit,
  [body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address")],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;
      const verification = await EmailVerification.findOne({ email: req.body.email });
      if (!verification) {
        return res.status(400).json({
          success: false,
          message: "No pending verification found. Please sign up again.",
        });
      }

      const user = await User.findById(verification.userId);
      if (!user || user.isEmailVerified) {
        await verification.deleteOne();
        return res.status(400).json({
          success: false,
          message: "No pending verification found. Please sign up again.",
        });
      }

      const pin = generatePIN();
      verification.pinHash = await hashPin(pin);
      verification.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      verification.attempts = 0;
      await verification.save();

      const emailResult = await sendVerificationEmail(
        user.email,
        pin,
        user.firstName,
      );
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email. Please try again.",
        });
      }

      return res.json({ success: true, message: "New verification PIN sent to your email." });
    } catch (error) {
      console.error("Resend PIN error:", error.message);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

router.post(
  "/login",
  loginLimit,
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;
      const user = await User.findByEmail(req.body.email);
      if (!user || !(await user.comparePassword(req.body.password))) {
        if (user) await user.incLoginAttempts();
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: "Account is temporarily locked. Please try again later.",
        });
      }
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: "Account has been deactivated." });
      }
      if (!user.isEmailVerified) {
        return res.status(403).json({ success: false, message: "Verify your email before logging in." });
      }

      if (user.loginAttempts > 0) await user.resetLoginAttempts();
      await user.updateLastLogin();
      return res.json({
        success: true,
        message: "Login successful",
        data: { user: user.toProfileJSON(), token: generateToken(user) },
      });
    } catch (error) {
      console.error("Login error:", error.message);
      return res.status(500).json({ success: false, message: "Server error during login" });
    }
  },
);

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, data: { user: user.toProfileJSON() } });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/logout", auth, (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

router.post("/refresh", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.isActive) {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }
    return res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token: generateToken(user) },
    });
  } catch (error) {
    console.error("Token refresh error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(
  "/forgot-password",
  forgotPasswordLimit,
  [body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email address")],
  async (req, res) => {
    const successMessage =
      "If an account exists with this email, you will receive a password reset link shortly.";
    try {
      if (sendValidationErrors(req, res)) return;
      const user = await User.findOne({ email: req.body.email });
      if (!user?.isActive || !user.isEmailVerified) {
        return res.json({ success: true, message: successMessage });
      }

      await PasswordReset.deleteMany({ userId: user._id });
      const resetToken = generateResetToken();
      await PasswordReset.create({
        email: user.email,
        tokenHash: hashResetToken(resetToken),
        userId: user._id,
      });
      await sendPasswordResetEmail(user.email, resetToken, user.firstName);
      return res.json({ success: true, message: successMessage });
    } catch (error) {
      console.error("Forgot password error:", error.message);
      return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
  },
);

router.post(
  "/reset-password",
  resetPasswordLimit,
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    passwordRules,
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    }),
  ],
  async (req, res) => {
    try {
      if (sendValidationErrors(req, res)) return;
      const tokenHash = hashResetToken(req.body.token);
      const passwordReset = await PasswordReset.findOne({ tokenHash });
      if (!passwordReset || passwordReset.expiresAt < new Date()) {
        if (passwordReset) await passwordReset.deleteOne();
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token. Please request a new password reset.",
        });
      }

      const user = await User.findById(passwordReset.userId).select("+password");
      if (!user) {
        await passwordReset.deleteOne();
        return res.status(400).json({ success: false, message: "Invalid reset request." });
      }
      if (await user.comparePassword(req.body.password)) {
        return res.status(400).json({
          success: false,
          message: "New password must be different from your current password.",
        });
      }

      const consumed = await PasswordReset.findOneAndDelete({
        _id: passwordReset._id,
        tokenHash,
      });
      if (!consumed) {
        return res.status(400).json({ success: false, message: "Invalid reset request." });
      }

      user.password = req.body.password;
      user.tokenVersion = Number(user.tokenVersion || 0) + 1;
      await user.save();
      if (user.loginAttempts > 0) await user.resetLoginAttempts();

      sendPasswordResetConfirmation(user.email, user.firstName).catch((error) =>
        console.error("Password reset confirmation failed:", error.message),
      );
      return res.json({
        success: true,
        message: "Password reset successful! You can now log in with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error.message);
      return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
  },
);

router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const passwordReset = await PasswordReset.findOne({
      tokenHash: hashResetToken(req.params.token),
    });
    if (!passwordReset || passwordReset.expiresAt < new Date()) {
      if (passwordReset) await passwordReset.deleteOne();
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }
    return res.json({
      success: true,
      message: "Token is valid",
      data: { email: passwordReset.email },
    });
  } catch (error) {
    console.error("Verify reset token error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
