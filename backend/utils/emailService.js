const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP)
  // For production, use real SMTP service (Gmail, SendGrid, etc.)

  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development mode - use Gmail or configure your own
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
      },
    });
  }
};

// Generate random 6-digit PIN
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, pin, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"JobBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - JobBridge",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .pin-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .pin { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to JobBridge!</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
              
              <div class="pin-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your Verification PIN</p>
                <div class="pin">${pin}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> This PIN will expire in 15 minutes. If you didn't request this, please ignore this email.
              </div>

              <p>Enter this PIN on the verification page to activate your account.</p>
              
              <p>Best regards,<br>The JobBridge Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} JobBridge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};

// Generate secure reset token
const generateResetToken = () => {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  try {
    const transporter = createTransporter();

    // Create reset URL - adjust this based on your frontend URL
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"JobBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - JobBridge",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
            .danger { background: #f8d7da; border-left: 4px solid #dc3545; padding: 10px; margin: 15px 0; }
            .link-box { background: white; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>We received a request to reset your password for your JobBridge account.</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
              </p>

              <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:</p>
              <div class="link-box">
                <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
              </div>

              <div class="danger">
                <strong>🛡️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged. Someone may have entered your email address by mistake.
              </div>

              <p>Best regards,<br>The JobBridge Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} JobBridge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Password reset email error:", error);
    return { success: false, error: error.message };
  }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (email, firstName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"JobBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Changed Successfully - JobBridge",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 10px; margin: 15px 0; }
            .danger { background: #f8d7da; border-left: 4px solid #dc3545; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              
              <div class="success">
                <strong>Success!</strong> Your password has been changed successfully.
              </div>

              <p>Your JobBridge account password was recently changed. You can now log in with your new password.</p>

              <div class="danger">
                <strong>🛡️ Security Alert:</strong> If you didn't make this change, please contact our support team immediately at jobbridge123@gmail.com
              </div>

              <p>Best regards,<br>The JobBridge Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} JobBridge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Password reset confirmation email error:", error);
    return { success: false, error: error.message };
  }
};

// Send notification email
const sendNotificationEmail = async (
  email,
  firstName,
  title,
  message,
  actionUrl = null
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"JobBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${title} - JobBridge`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .notification-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 ${title}</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              
              <div class="notification-box">
                <p style="margin: 0; font-size: 16px;">${message}</p>
              </div>

              ${
                actionUrl
                  ? `
                <p style="text-align: center;">
                  <a href="${
                    process.env.FRONTEND_URL || "http://localhost:5173"
                  }${actionUrl}" class="button">View Details</a>
                </p>
              `
                  : ""
              }

              <p>You can manage your notification preferences in your account settings.</p>
              
              <p>Best regards,<br>The JobBridge Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} JobBridge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Notification email error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generatePIN,
  sendVerificationEmail,
  generateResetToken,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
};

module.exports = {
  generatePIN,
  sendVerificationEmail,
  generateResetToken,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendNotificationEmail,
};
