const {
  getMessageCount,
  incrementMessageCount,
  getAttachmentCount,
  incrementAttachmentCount,
} = require("../utils/redisUtils");

/**
 * Rate Limiter Service
 *
 * Enforces rate limits for messages and attachments:
 * - Messages: 100 per conversation per day (resets at midnight UTC)
 * - Attachments: 10 uploads per hour (sliding window)
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

// Rate limit constants
const MESSAGE_LIMIT = 100; // Messages per conversation per day
const ATTACHMENT_LIMIT = 10; // Attachments per hour

/**
 * Check if user can send a message in a conversation
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<boolean>} True if under limit, false if limit exceeded
 */
async function checkMessageLimit(userId, conversationId) {
  const count = await getMessageCount(userId, conversationId);
  return count < MESSAGE_LIMIT;
}

/**
 * Check if user can upload an attachment
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if under limit, false if limit exceeded
 */
async function checkAttachmentLimit(userId) {
  const count = await getAttachmentCount(userId);
  return count < ATTACHMENT_LIMIT;
}

/**
 * Increment message count and return new count
 * Counter automatically expires at midnight UTC (daily reset)
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<number>} New message count
 */
async function incrementMessageCountWithLimit(userId, conversationId) {
  return await incrementMessageCount(userId, conversationId);
}

/**
 * Increment attachment count and return new count
 * Counter automatically expires after 1 hour (hourly reset)
 * @param {string} userId - User ID
 * @returns {Promise<number>} New attachment count
 */
async function incrementAttachmentCountWithLimit(userId) {
  return await incrementAttachmentCount(userId);
}

/**
 * Get remaining quota for a user
 * @param {string} userId - User ID
 * @param {string} limitType - Type of limit: "message" or "attachment"
 * @param {string} conversationId - Conversation ID (required for message limit)
 * @returns {Promise<number>} Remaining quota
 */
async function getRemainingQuota(userId, limitType, conversationId = null) {
  if (limitType === "message") {
    if (!conversationId) {
      throw new Error("conversationId is required for message limit type");
    }
    const count = await getMessageCount(userId, conversationId);
    return Math.max(0, MESSAGE_LIMIT - count);
  } else if (limitType === "attachment") {
    const count = await getAttachmentCount(userId);
    return Math.max(0, ATTACHMENT_LIMIT - count);
  } else {
    throw new Error(
      `Invalid limit type: ${limitType}. Must be "message" or "attachment"`,
    );
  }
}

/**
 * Get reset time for rate limit
 * @param {string} limitType - Type of limit: "message" or "attachment"
 * @returns {Date} Reset time
 */
function getResetTime(limitType) {
  const now = new Date();

  if (limitType === "message") {
    // Reset at midnight UTC
    const resetTime = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    return resetTime;
  } else if (limitType === "attachment") {
    // Reset at next hour
    const resetTime = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours() + 1,
        0,
        0,
        0,
      ),
    );
    return resetTime;
  } else {
    throw new Error(
      `Invalid limit type: ${limitType}. Must be "message" or "attachment"`,
    );
  }
}

module.exports = {
  MESSAGE_LIMIT,
  ATTACHMENT_LIMIT,
  checkMessageLimit,
  checkAttachmentLimit,
  incrementMessageCount: incrementMessageCountWithLimit,
  incrementAttachmentCount: incrementAttachmentCountWithLimit,
  getRemainingQuota,
  getResetTime,
};
