const Attachment = require("../models/Attachment");
const { uploadFile, downloadFile, deleteFile } = require("../utils/gridfs");
const path = require("path");
const crypto = require("crypto");
const NodeClam = require("clamscan");

// Allowed file types with their MIME types
const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

// Maximum file size: 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10485760 bytes

// ClamAV instance (initialized lazily)
let clamavInstance = null;

/**
 * Reset ClamAV instance (for testing purposes)
 * @private
 */
function resetClamAVInstance() {
  clamavInstance = null;
}

/**
 * Initialize ClamAV scanner
 * @returns {Promise<Object>} ClamAV scanner instance
 */
async function initClamAV() {
  if (clamavInstance) {
    return clamavInstance;
  }

  try {
    const clamav = await new NodeClam().init({
      clamdscan: {
        host: process.env.CLAMAV_HOST || "localhost",
        port: parseInt(process.env.CLAMAV_PORT || "3310", 10),
        timeout: parseInt(process.env.CLAMAV_TIMEOUT || "60000", 10),
      },
      preference: "clamdscan", // Use clamd daemon for better performance
    });

    clamavInstance = clamav;
    console.log("ClamAV initialized successfully");
    return clamavInstance;
  } catch (error) {
    console.error("Failed to initialize ClamAV:", error);
    throw new Error("Malware scanner is unavailable");
  }
}

class AttachmentService {
  /**
   * Validate file type and size
   * @param {Object} file - File object with mimetype, size, and originalname
   * @returns {Object} Validation result with isValid and error message
   */
  static validateFile(file) {
    if (!file) {
      return {
        isValid: false,
        error: "No file provided",
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    if (file.size <= 0) {
      return {
        isValid: false,
        error: "File is empty",
      };
    }

    // Check MIME type
    const mimeType = file.mimetype?.toLowerCase();
    if (!mimeType || !ALLOWED_FILE_TYPES[mimeType]) {
      const allowedTypes = Object.keys(ALLOWED_FILE_TYPES)
        .map((mime) => ALLOWED_FILE_TYPES[mime].join(", "))
        .join(", ");
      return {
        isValid: false,
        error: `File type "${mimeType || "unknown"}" is not allowed. Allowed types: ${allowedTypes}`,
      };
    }

    // Verify MIME type matches file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension "${fileExtension}" does not match MIME type "${mimeType}". Expected extensions: ${allowedExtensions.join(", ")}`,
      };
    }

    return {
      isValid: true,
      error: null,
    };
  }

  /**
   * Sanitize filename to prevent path traversal attacks
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    if (!filename) {
      return `file_${Date.now()}`;
    }

    // Remove any path components (e.g., "../", "./", "C:\")
    let sanitized = path.basename(filename);

    // Remove any null bytes
    sanitized = sanitized.replace(/\0/g, "");

    // Replace any remaining dangerous characters with underscores
    sanitized = sanitized.replace(/[<>:"|?*]/g, "_");

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");

    // If filename is empty after sanitization, generate a random one
    if (!sanitized || sanitized.length === 0 || sanitized === ".") {
      const ext = path.extname(filename);
      const validExt = ext && ext !== "." ? ext : "";
      sanitized = `file_${Date.now()}${validExt}`;
    }

    // Limit filename length to 255 characters
    if (sanitized.length > 255) {
      const ext = path.extname(sanitized);
      const nameWithoutExt = sanitized.substring(0, 255 - ext.length);
      sanitized = nameWithoutExt + ext;
    }

    return sanitized;
  }

  /**
   * Upload attachment with validation and GridFS storage
   * @param {Object} file - File object from multer (buffer, mimetype, originalname, size)
   * @param {string} uploaderId - ID of the user uploading the file
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise<Object>} Created attachment document
   */
  static async uploadAttachment(file, uploaderId, conversationId) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(file.originalname);

      // Upload file to GridFS with chunked upload
      const gridFsFileId = await uploadFile(file.buffer, sanitizedFilename, {
        uploaderId,
        conversationId,
        fileType: file.mimetype,
        originalFilename: file.originalname,
      });

      // Create Attachment record
      const attachment = await Attachment.create({
        uploaderId,
        conversationId,
        filename: file.originalname,
        sanitizedFilename,
        fileType: file.mimetype,
        fileSize: file.size,
        gridFsFileId,
        malwareScanStatus: "pending",
      });

      return attachment;
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw error;
    }
  }

  /**
   * Scan file for malware using ClamAV
   * @param {string} attachmentId - ID of the attachment to scan
   * @returns {Promise<Object>} Scan result with status and details
   */
  static async scanForMalware(attachmentId) {
    try {
      // Get attachment record
      const attachment = await Attachment.findById(attachmentId);

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Check if already scanned
      if (attachment.malwareScanStatus !== "pending") {
        return {
          status: attachment.malwareScanStatus,
          message: `File already scanned with status: ${attachment.malwareScanStatus}`,
        };
      }

      // Initialize ClamAV
      const clamav = await initClamAV();

      // Download file from GridFS to a buffer for scanning
      const fileStream = downloadFile(attachment.gridFsFileId);
      const chunks = [];

      // Collect all chunks from the stream
      await new Promise((resolve, reject) => {
        fileStream.on("data", (chunk) => chunks.push(chunk));
        fileStream.on("end", resolve);
        fileStream.on("error", reject);
      });

      const fileBuffer = Buffer.concat(chunks);

      // Scan the buffer
      const { isInfected, viruses } = await clamav.scanBuffer(fileBuffer);

      if (isInfected) {
        // Mark as infected
        await attachment.markScanComplete("infected");

        // Delete infected file immediately
        await deleteFile(attachment.gridFsFileId);

        // Log security event
        console.error(
          `SECURITY: Malware detected in attachment ${attachmentId}`,
          {
            attachmentId: attachment._id,
            uploaderId: attachment.uploaderId,
            conversationId: attachment.conversationId,
            filename: attachment.filename,
            viruses: viruses,
            timestamp: new Date().toISOString(),
          },
        );

        return {
          status: "infected",
          message: "Malware detected in file",
          viruses: viruses,
        };
      } else {
        // Mark as clean
        await attachment.markScanComplete("clean");

        console.log(`Attachment ${attachmentId} passed malware scan`);

        return {
          status: "clean",
          message: "File is safe",
        };
      }
    } catch (error) {
      console.error("Error scanning attachment for malware:", error);

      // If ClamAV is unavailable, log error but don't mark as infected
      if (error.message.includes("unavailable")) {
        throw error;
      }

      // For other errors, rethrow
      throw new Error(`Malware scan failed: ${error.message}`);
    }
  }

  /**
   * Download attachment with access control
   * @param {string} attachmentId - ID of the attachment
   * @param {string} userId - ID of the user requesting download
   * @returns {Promise<Object>} Object with stream and attachment metadata
   */
  static async downloadAttachment(attachmentId, userId) {
    try {
      // Get attachment record
      const attachment =
        await Attachment.findById(attachmentId).populate("conversationId");

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Verify user is participant in the conversation
      const conversation = attachment.conversationId;
      if (!conversation) {
        throw new Error("Associated conversation not found");
      }

      const isParticipant =
        conversation.participants.jobSeeker.toString() === userId.toString() ||
        conversation.participants.employer.toString() === userId.toString();

      if (!isParticipant) {
        const error = new Error(
          "You do not have permission to access this attachment",
        );
        error.statusCode = 403;
        throw error;
      }

      // Check if file is safe to download
      if (!attachment.isSafeToDownload()) {
        throw new Error(
          "File has not passed malware scanning and cannot be downloaded",
        );
      }

      // Stream file from GridFS
      const fileStream = downloadFile(attachment.gridFsFileId);

      return {
        stream: fileStream,
        filename: attachment.filename,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
      };
    } catch (error) {
      console.error("Error downloading attachment:", error);
      throw error;
    }
  }

  /**
   * Delete attachment (both GridFS file and Attachment record)
   * @param {string} attachmentId - ID of the attachment
   * @param {string} userId - ID of the user requesting deletion
   * @returns {Promise<void>}
   */
  static async deleteAttachment(attachmentId, userId) {
    try {
      // Get attachment record
      const attachment =
        await Attachment.findById(attachmentId).populate("conversationId");

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Verify user is the uploader or conversation participant
      const conversation = attachment.conversationId;
      const isUploader = attachment.uploaderId.toString() === userId.toString();
      const isParticipant =
        conversation.participants.jobSeeker.toString() === userId.toString() ||
        conversation.participants.employer.toString() === userId.toString();

      if (!isUploader && !isParticipant) {
        const error = new Error(
          "You do not have permission to delete this attachment",
        );
        error.statusCode = 403;
        throw error;
      }

      // Delete from GridFS
      await deleteFile(attachment.gridFsFileId);

      // Delete Attachment record
      await Attachment.findByIdAndDelete(attachmentId);

      console.log(`Attachment ${attachmentId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      throw error;
    }
  }

  /**
   * Get attachments for a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {string} userId - ID of the user requesting attachments
   * @returns {Promise<Array>} Array of attachment documents
   */
  static async getConversationAttachments(conversationId, userId) {
    try {
      const Conversation = require("../models/Conversation");

      // Verify user is participant in the conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const isParticipant =
        conversation.participants.jobSeeker.toString() === userId.toString() ||
        conversation.participants.employer.toString() === userId.toString();

      if (!isParticipant) {
        const error = new Error(
          "You do not have permission to access this conversation",
        );
        error.statusCode = 403;
        throw error;
      }

      // Get attachments
      const attachments = await Attachment.findByConversation(conversationId);

      return attachments;
    } catch (error) {
      console.error("Error getting conversation attachments:", error);
      throw error;
    }
  }

  /**
   * Get allowed file types for client-side validation
   * @returns {Object} Object with MIME types and extensions
   */
  static getAllowedFileTypes() {
    return {
      mimeTypes: Object.keys(ALLOWED_FILE_TYPES),
      extensions: Object.values(ALLOWED_FILE_TYPES).flat(),
      maxSize: MAX_FILE_SIZE,
      maxSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    };
  }

  /**
   * Reset ClamAV instance (for testing purposes only)
   * @private
   */
  static _resetClamAVInstance() {
    resetClamAVInstance();
  }
}

module.exports = AttachmentService;
