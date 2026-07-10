/**
 * TimeUp - Time Formatting Utilities
 * Pure functions for formatting time values
 */

import { TIME } from "./constants.js";

/**
 * Pads a number with leading zeros to reach the desired length.
 * @param {number} num - The number to pad
 * @param {number} [length=2] - Desired string length
 * @returns {string} Zero-padded number string
 * @example
 * padZero(5) // "05"
 * padZero(123, 4) // "0123"
 */
export const padZero = (num, length = 2) => {
  return String(Math.floor(num)).padStart(length, "0");
};

/**
 * Formats milliseconds into a human-readable duration string.
 * @param {number} ms - Duration in milliseconds
 * @param {Object} [options={}] - Formatting options
 * @param {boolean} [options.showSeconds=true] - Include seconds in output
 * @param {boolean} [options.compact=false] - Use compact format (1h 30m vs 01:30:00)
 * @param {boolean} [options.showDays=false] - Show days for long durations
 * @returns {string} Formatted duration string
 * @example
 * formatDuration(8130000) // "02:15:30"
 * formatDuration(8130000, { compact: true }) // "2h 15m 30s"
 * formatDuration(90061000, { showDays: true }) // "1d 1h 1m 1s"
 */
export const formatDuration = (ms, options = {}) => {
  const { showSeconds = true, compact = false, showDays = false } = options;

  if (typeof ms !== "number" || ms < 0 || !Number.isFinite(ms)) {
    return compact ? "0m" : "00:00";
  }

  const totalSeconds = Math.floor(ms / TIME.SECOND);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  if (compact) {
    const parts = [];
    if (showDays && days > 0) parts.push(`${days}d`);
    if (hours > 0 || (showDays && days > 0)) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    if (showSeconds) parts.push(`${seconds}s`);
    return parts.join(" ");
  }

  // Standard format: HH:MM:SS or HH:MM
  if (showDays && days > 0) {
    return showSeconds
      ? `${days}d ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`
      : `${days}d ${padZero(hours)}:${padZero(minutes)}`;
  }

  const totalHours = days * 24 + hours;
  return showSeconds
    ? `${padZero(totalHours)}:${padZero(minutes)}:${padZero(seconds)}`
    : `${padZero(totalHours)}:${padZero(minutes)}`;
};

/**
 * Formats a timestamp to a localized time string.
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {Object} [options={}] - Formatting options
 * @param {boolean} [options.use24Hour=true] - Use 24-hour format
 * @param {boolean} [options.showDate=false] - Include date in output
 * @returns {string} Formatted time string
 * @example
 * formatTimestamp(1706367600000) // "14:30"
 * formatTimestamp(1706367600000, { use24Hour: false }) // "2:30 PM"
 */
export const formatTimestamp = (timestamp, options = {}) => {
  const { use24Hour = true, showDate = false } = options;

  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return "--:--";
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "--:--";
  }

  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24Hour,
  };

  if (showDate) {
    timeOptions.year = "numeric";
    timeOptions.month = "short";
    timeOptions.day = "numeric";
  }

  return date.toLocaleString(undefined, timeOptions);
};

/**
 * Calculates the elapsed time from a start timestamp to now.
 * @param {number} startTime - Start timestamp in milliseconds
 * @returns {number} Elapsed time in milliseconds
 * @example
 * // If current time is 1000ms after startTime
 * getElapsedTime(Date.now() - 1000) // 1000
 */
export const getElapsedTime = (startTime) => {
  if (typeof startTime !== "number" || !Number.isFinite(startTime)) {
    return 0;
  }
  return Math.max(0, Date.now() - startTime);
};

/**
 * Sums up durations from an array of time entries.
 * @param {Array<{duration: number}>} entries - Array of time entries
 * @returns {number} Total duration in milliseconds
 * @example
 * sumDurations([{ duration: 1000 }, { duration: 2000 }]) // 3000
 */
export const sumDurations = (entries) => {
  if (!Array.isArray(entries)) {
    return 0;
  }

  return entries.reduce((total, entry) => {
    const duration = entry?.duration;
    if (
      typeof duration === "number" &&
      Number.isFinite(duration) &&
      duration > 0
    ) {
      return total + duration;
    }
    return total;
  }, 0);
};

/**
 * Calculates remaining time from an estimate minus spent time.
 * @param {number} totalTime - Total time spent in milliseconds
 * @param {number|null} estimatedTime - Estimated time in milliseconds
 * @returns {{remaining: number, isOverBudget: boolean, percentComplete: number}|null}
 * @example
 * getRemainingTime(1800000, 3600000) // { remaining: 1800000, isOverBudget: false, percentComplete: 50 }
 */
export const getRemainingTime = (totalTime, estimatedTime) => {
  if (typeof estimatedTime !== "number" || estimatedTime <= 0) {
    return null;
  }

  const remaining = estimatedTime - totalTime;
  const percentComplete = Math.min(
    100,
    Math.round((totalTime / estimatedTime) * 100),
  );

  return {
    remaining,
    isOverBudget: remaining < 0,
    percentComplete,
  };
};

/**
 * Parses a time string into milliseconds.
 * Supports formats: "1h 30m", "2h", "45m", "1.5h", "90", "1:30:00", "00:07:00", "7:00"
 * @param {string} timeStr - Time string to parse
 * @returns {number|null} Duration in milliseconds, or null if invalid
 * @example
 * parseTimeString("1h 30m") // 5400000
 * parseTimeString("2h") // 7200000
 * parseTimeString("45m") // 2700000
 * parseTimeString("90") // 5400000 (assumes minutes)
 * parseTimeString("1:30:00") // 5400000 (HH:MM:SS)
 * parseTimeString("7:00") // 420000 (MM:SS or M:SS)
 * parseTimeString("00:07:00") // 420000 (7 minutes)
 */
export const parseTimeString = (timeStr) => {
  if (typeof timeStr !== "string" || !timeStr.trim()) {
    return null;
  }

  const str = timeStr.trim().toLowerCase();

  // Try HH:MM:SS or H:MM:SS format first (e.g., "1:30:00", "00:07:00")
  const hhmmssMatch = str.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hhmmssMatch) {
    const hours = parseInt(hhmmssMatch[1], 10);
    const minutes = parseInt(hhmmssMatch[2], 10);
    const seconds = parseInt(hhmmssMatch[3], 10);
    if (minutes < 60 && seconds < 60) {
      return ((hours * 60 + minutes) * 60 + seconds) * 1000;
    }
  }

  // Try MM:SS or M:SS format (e.g., "7:00", "45:30")
  const mmssMatch = str.match(/^(\d{1,2}):(\d{1,2})$/);
  if (mmssMatch) {
    const minutes = parseInt(mmssMatch[1], 10);
    const seconds = parseInt(mmssMatch[2], 10);
    if (seconds < 60) {
      return (minutes * 60 + seconds) * 1000;
    }
  }

  // Try to match hours, minutes, and seconds with unit suffixes
  const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = str.match(/(\d+(?:\.\d+)?)\s*m/);
  const secMatch = str.match(/(\d+(?:\.\d+)?)\s*s/);

  if (hourMatch || minMatch || secMatch) {
    const hours = hourMatch ? parseFloat(hourMatch[1]) : 0;
    const minutes = minMatch ? parseFloat(minMatch[1]) : 0;
    const seconds = secMatch ? parseFloat(secMatch[1]) : 0;
    return Math.round(((hours * 60 + minutes) * 60 + seconds) * 1000);
  }

  // Try plain number (default to minutes) - only if string contains ONLY digits/decimals
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num) && num > 0) {
      return Math.round(num * 60 * 1000);
    }
  }

  return null;
};
