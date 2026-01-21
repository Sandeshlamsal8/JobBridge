const multer = require("multer");
const path = require("path");

// Configure memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter for CV uploads
const fileFilter = (req, file, cb) => {
  // Allow only PDF and Word documents for CV
  if (file.fieldname === "cv") {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF and Word documents are allowed for CV."
        ),
        false
      );
    }
  }
  // Allow images for profile pictures
  else if (file.fieldname === "profilePicture") {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for profile pictures."
        ),
        false
      );
    }
  } else {
    cb(new Error("Unknown field name"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
