const { getRedisClient } = require("../config/redis");

/**
 * WebSocket Connection Mapping Utilities
 * Key format: ws:user:{userId}
 * Value: socketId (string)
 * TTL: Session duration (default 24 hours)
 */

/**
 * Store WebSocket connection mapping
 * @param {string} userId - User ID
 * @param {string} socketId - Socket ID
 * @param {number} ttl - Time to live in seconds (default: 86400 = 24 hours)
 * @returns {Promise<void>}
 */
async function setWebSocketConnection(userId, socketId, ttl = 86400) {
  const client = getRedisClient();
  const key = `ws:user:${userId}`;
  await client.setEx(key, ttl, socketId);
}

/**
 * Get WebSocket connection for a user
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Socket ID or null if not connected
 */
async function getWebSocketConnection(userId) {
  const client = getRedisClient();
  const key = `ws:user:${userId}`;
  return await client.get(key);
}

/**
 * Remove WebSocket connection mapping
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function removeWebSocketConnection(userId) {
  const client = getRedisClient();
  const key = `ws:user:${userId}`;
  await client.del(key);
}

/**
 * Check if user is connected via WebSocket
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if connected
 */
async function isUserConnected(userId) {
  const socketId = await getWebSocketConnection(userId);
  return socketId !== null;
}

/**
 * Typing Indicator Utilities
 * Key format: typing:{conversationId}:{userId}
 * Value: timestamp
 * TTL: 3 seconds
 */

/**
 * Set typing indicator for a user in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function setTypingIndicator(conversationId, userId) {
  const client = getRedisClient();
  const key = `typing:${conversationId}:${userId}`;
  const timestamp = Date.now().toString();
  await client.setEx(key, 3, timestamp); // 3 second TTL
}

/**
 * Get typing indicator for a user in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Timestamp or null if not typing
 */
async function getTypingIndicator(conversationId, userId) {
  const client = getRedisClient();
  const key = `typing:${conversationId}:${userId}`;
  return await client.get(key);
}

/**
 * Remove typing indicator for a user in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function removeTypingIndicator(conversationId, userId) {
  const client = getRedisClient();
  const key = `typing:${conversationId}:${userId}`;
  await client.del(key);
}

/**
 * Check if user is typing in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if typing
 */
async function isUserTyping(conversationId, userId) {
  const timestamp = await getTypingIndicator(conversationId, userId);
  return timestamp !== null;
}

/**
 * Message Queue Utilities
 * Key format: queue:msg:{userId}
 * Value: JSON array of Message objects
 * TTL: 7 days
 */

/**
 * Queue a message for offline user
 * @param {string} userId - User ID
 * @param {Object} message - Message object
 * @returns {Promise<void>}
 */
async function queueMessage(userId, message) {
  const client = getRedisClient();
  const key = `queue:msg:${userId}`;

  // Get existing queue
  const existingQueue = await client.get(key);
  const queue = existingQueue ? JSON.parse(existingQueue) : [];

  // Add new message
  queue.push(message);

  // Store with 7 day TTL
  const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
  await client.setEx(key, ttl, JSON.stringify(queue));
}

/**
 * Get queued messages for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of queued messages
 */
async function getQueuedMessages(userId) {
  const client = getRedisClient();
  const key = `queue:msg:${userId}`;
  const queue = await client.get(key);
  return queue ? JSON.parse(queue) : [];
}

/**
 * Clear message queue for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function clearMessageQueue(userId) {
  const client = getRedisClient();
  const key = `queue:msg:${userId}`;
  await client.del(key);
}

/**
 * Get count of queued messages for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of queued messages
 */
async function getQueuedMessageCount(userId) {
  const messages = await getQueuedMessages(userId);
  return messages.length;
}

/**
 * Rate Limiting Utilities
 * Message rate limit: ratelimit:msg:{userId}:{conversationId}:{date}
 * Attachment rate limit: ratelimit:attach:{userId}:{hour}
 */

/**
 * Increment message count for rate limiting
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<number>} Current count
 */
async function incrementMessageCount(userId, conversationId) {
  const client = getRedisClient();
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key = `ratelimit:msg:${userId}:${conversationId}:${date}`;

  const count = await client.incr(key);

  // Set TTL to end of day (midnight UTC)
  if (count === 1) {
    const now = new Date();
    const endOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    const ttl = Math.floor((endOfDay - now) / 1000);
    await client.expire(key, ttl);
  }

  return count;
}

/**
 * Get message count for rate limiting
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<number>} Current count
 */
async function getMessageCount(userId, conversationId) {
  const client = getRedisClient();
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const key = `ratelimit:msg:${userId}:${conversationId}:${date}`;
  const count = await client.get(key);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Increment attachment count for rate limiting
 * @param {string} userId - User ID
 * @returns {Promise<number>} Current count
 */
async function incrementAttachmentCount(userId) {
  const client = getRedisClient();
  const now = new Date();
  const hour = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}-${String(now.getUTCHours()).padStart(2, "0")}`;
  const key = `ratelimit:attach:${userId}:${hour}`;

  const count = await client.incr(key);

  // Set TTL to 1 hour
  if (count === 1) {
    await client.expire(key, 3600); // 1 hour in seconds
  }

  return count;
}

/**
 * Get attachment count for rate limiting
 * @param {string} userId - User ID
 * @returns {Promise<number>} Current count
 */
async function getAttachmentCount(userId) {
  const client = getRedisClient();
  const now = new Date();
  const hour = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}-${String(now.getUTCHours()).padStart(2, "0")}`;
  const key = `ratelimit:attach:${userId}:${hour}`;
  const count = await client.get(key);
  return count ? parseInt(count, 10) : 0;
}

module.exports = {
  // WebSocket connection mapping
  setWebSocketConnection,
  getWebSocketConnection,
  removeWebSocketConnection,
  isUserConnected,

  // Typing indicators
  setTypingIndicator,
  getTypingIndicator,
  removeTypingIndicator,
  isUserTyping,

  // Message queues
  queueMessage,
  getQueuedMessages,
  clearMessageQueue,
  getQueuedMessageCount,

  // Rate limiting
  incrementMessageCount,
  getMessageCount,
  incrementAttachmentCount,
  getAttachmentCount,
};
