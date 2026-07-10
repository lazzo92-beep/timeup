/**
 * TimeUp - Application Constants
 * Central location for all app-wide constant values
 */

/**
 * Storage keys used with Trello's t.set() and t.get() API
 * @readonly
 * @enum {string}
 */
export const STORAGE_KEYS = {
  /** Timer data stored on each card (state, totalTime, recentEntries, checklistTotals) */
  TIMER_DATA: "timerData",
  /** Board-wide settings (hourly rate, categories) */
  BOARD_SETTINGS: "boardSettings",
  /** User preferences (display format, notifications) */
  USER_PREFERENCES: "userPreferences",
};

/**
 * Trello storage scopes
 * @readonly
 * @enum {string}
 */
export const STORAGE_SCOPES = {
  /** Visible to all users on the card */
  CARD_SHARED: "shared",
  /** Visible only to current user on the card */
  CARD_PRIVATE: "private",
};

/**
 * Timer states
 * @readonly
 * @enum {string}
 */
export const TIMER_STATE = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
};

/**
 * Time constants in milliseconds
 * @readonly
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

/**
 * Application metadata
 * @readonly
 */
export const APP_INFO = {
  NAME: "TimeUp",
  VERSION: "1.0.0",
  POWER_UP_NAME: "TimeUp - Time Tracker",
};

/**
 * Default values for timer data
 * @readonly
 */
export const DEFAULTS = {
  TIMER_DATA: {
    state: TIMER_STATE.IDLE,
    currentEntry: null,
    estimatedTime: null, // Estimated time in milliseconds (manual override)
    manualEstimateSet: false, // true = user set manually, false = calculated from checklists

    // Aggregated total time - ONE number for all time tracked
    totalTime: 0,

    // Only keep last 5 entries for display/editing
    recentEntries: [],

    // Checklist item totals (aggregated, not individual entries)
    checklistTotals: {}, // { [checkItemId]: { totalTime, entryCount, estimatedTime } }
  },
  BOARD_SETTINGS: {
    hourlyRate: null,
    currency: "USD",
    categories: [],
  },
  USER_PREFERENCES: {
    showSeconds: true,
    use24HourFormat: true,
    autoStartOnOpen: false,
  },
};

/**
 * Badge colors matching Trello's color scheme
 * @readonly
 */
export const BADGE_COLORS = {
  DEFAULT: "light-gray",
  RUNNING: "green",
  WARNING: "yellow",
  OVER_BUDGET: "red",
};

/**
 * Validation constraints
 * @readonly
 */
export const VALIDATION = {
  MAX_DESCRIPTION_LENGTH: 120,
  /** Maximum checklist items that can have time data (estimates/timers) due to storage limits */
  MAX_CHECKLIST_ITEMS: 15,
};
