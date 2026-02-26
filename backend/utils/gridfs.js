const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gridFSBucket;

/**
 * Initialize GridFS bucket for file storage
 * Must be called after MongoDB connection is established
 */
function initializeGridFS() {
  if (!mongoose.connection.db) {
    throw new Error(
      "MongoDB connection not established. Call this after mongoose.connect()",
    );
  }

  gridFSBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "attachments", // Collection prefix: attachments.files and attachments.chunks
  });

  console.log("✅ GridFS bucket initialized for attachments");
  return gridFSBucket;
}

/**
 * Get the GridFS bucket instance
 * @returns {GridFSBucket} The GridFS bucket instance
 */
function getGridFSBucket() {
  if (!gridFSBucket) {
    throw new Error(
      "GridFS bucket not initialized. Call initializeGridFS() first.",
    );
  }
  return gridFSBucket;
}

/**
 * Upload a file to GridFS
 * @param {Buffer|Stream} fileData - File data as Buffer or readable stream
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata to store with the file
 * @returns {Promise<ObjectId>} The GridFS file ID
 */
function uploadFile(fileData, filename, metadata = {}) {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadDate: new Date(),
      },
    });

    uploadStream.on("error", (error) => {
      reject(error);
    });

    uploadStream.on("finish", () => {
      resolve(uploadStream.id);
    });

    // Handle both Buffer and Stream inputs
    if (Buffer.isBuffer(fileData)) {
      uploadStream.end(fileData);
    } else if (fileData.pipe) {
      fileData.pipe(uploadStream);
    } else {
      reject(new Error("fileData must be a Buffer or readable stream"));
    }
  });
}

/**
 * Download a file from GridFS
 * @param {ObjectId} fileId - The GridFS file ID
 * @returns {Stream} Readable stream of the file
 */
function downloadFile(fileId) {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(fileId);
}

/**
 * Delete a file from GridFS
 * @param {ObjectId} fileId - The GridFS file ID
 * @returns {Promise<void>}
 */
function deleteFile(fileId) {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    bucket.delete(fileId, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get file metadata from GridFS
 * @param {ObjectId} fileId - The GridFS file ID
 * @returns {Promise<Object>} File metadata
 */
async function getFileMetadata(fileId) {
  const bucket = getGridFSBucket();

  return new Promise((resolve, reject) => {
    bucket.find({ _id: fileId }).toArray((error, files) => {
      if (error) {
        reject(error);
      } else if (files.length === 0) {
        reject(new Error("File not found in GridFS"));
      } else {
        resolve(files[0]);
      }
    });
  });
}

/**
 * Check if a file exists in GridFS
 * @param {ObjectId} fileId - The GridFS file ID
 * @returns {Promise<boolean>}
 */
async function fileExists(fileId) {
  try {
    await getFileMetadata(fileId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clean up orphaned GridFS files (files without corresponding Attachment records)
 * Should be run periodically as a maintenance task
 * @param {number} olderThanHours - Delete orphaned files older than this many hours (default: 24)
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupOrphanedFiles(olderThanHours = 24) {
  const Attachment = require("../models/Attachment");
  const bucket = getGridFSBucket();

  const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  // Get all GridFS files older than cutoff
  const allFiles = await bucket
    .find({
      uploadDate: { $lt: cutoffDate },
    })
    .toArray();

  // Get all attachment GridFS file IDs
  const attachmentFileIds = await Attachment.distinct("gridFsFileId");
  const attachmentFileIdStrings = attachmentFileIds.map((id) => id.toString());

  // Find orphaned files
  const orphanedFiles = allFiles.filter(
    (file) => !attachmentFileIdStrings.includes(file._id.toString()),
  );

  // Delete orphaned files
  let deletedCount = 0;
  for (const file of orphanedFiles) {
    try {
      await deleteFile(file._id);
      deletedCount++;
      console.log(`Deleted orphaned GridFS file: ${file._id}`);
    } catch (error) {
      console.error(`Failed to delete orphaned file ${file._id}:`, error);
    }
  }

  return deletedCount;
}

module.exports = {
  initializeGridFS,
  getGridFSBucket,
  uploadFile,
  downloadFile,
  deleteFile,
  getFileMetadata,
  fileExists,
  cleanupOrphanedFiles,
};
