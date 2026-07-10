/**
 * TimeUp - Input Validators
 * Pure validation functions
 */

/**
 * Validates that a value is a positive number.
 * @param {*} value - Value to validate
 * @returns {boolean} True if valid positive number
 */
export const isPositiveNumber = (value) => {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
};

/**
 * Validates that a string is non-empty after trimming.
 * @param {*} value - Value to validate
 * @returns {boolean} True if non-empty string
 */
export const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Validates a time entry object.
 * @param {Object} entry - Entry to validate
 * @returns {boolean} True if valid entry
 */
export const isValidEntry = (entry) => {
  return (
    entry &&
    typeof entry === "object" &&
    isPositiveNumber(entry.startTime) &&
    isPositiveNumber(entry.endTime) &&
    entry.endTime > entry.startTime
  );
};
