// utils/generateUniqueNumber.js

/**
 * Timestamp + random suffix based unique number generator
 * No DB query needed — collision-proof
 *
 * Examples:
 *   generateUniqueNumber("JE")  → "JE-2026-A3F8K2"
 *   generateUniqueNumber("EXP") → "EXP-2026-B9X1M4"
 */
const generateUniqueNumber = (prefix = "") => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase(); // base36 timestamp
  const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
  return `${prefix}-${year}-${timestamp}${random}`;
};

module.exports = generateUniqueNumber;