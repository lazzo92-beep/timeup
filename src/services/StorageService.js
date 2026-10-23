import { STORAGE_KEYS, STORAGE_SCOPES, DEFAULTS } from "../utils/constants.js";
import { encodeTimerData, decodeTimerData } from "../utils/timerStorageCodec.js";

const STORAGE_LIMIT = 4096; // Card scope/visibility limit, including all keys.

/**
 * Gets data from Trello storage with error handling.
 * @param {Object} t - Trello Power-Up client instance
 * @param {string} scope - Storage scope ('card' | 'board' | 'member')
 * @param {string} visibility - Visibility ('shared' | 'private')
 * @param {string} key - Storage key
 * @param {*} [defaultValue=null] - Default value if key doesn't exist
 * @returns {Promise<*>} Retrieved data or default value
 * @example
 * const timerData = await getData(t, 'card', 'shared', STORAGE_KEYS.TIMER_DATA, DEFAULTS.TIMER_DATA);
 */
export const getData = async (
  t,
  scope,
  visibility,
  key,
  defaultValue = null,
) => {
  try {
    const data = await t.get(scope, visibility, key);
    return data ?? defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Saves data to Trello storage with size limit validation.
 * @param {Object} t - Trello Power-Up client instance
 * @param {string} scope - Storage scope ('card' | 'board' | 'member')
 * @param {string} visibility - Visibility ('shared' | 'private')
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {Promise<{success: boolean, size?: number, error?: string}>} Result object
 * @example
 * const result = await setData(t, 'card', 'shared', 'timerData', { state: 'idle' });
 * if (!result.success) alert(result.error);
 */
export const setData = async (t, scope, visibility, key, value) => {
  try {
    const jsonString = JSON.stringify(value);

    if (jsonString.length > STORAGE_LIMIT) {
      return {
        success: false,
        error: "LIMIT_EXCEEDED",
        size: jsonString.length,
      };
    }

    await t.set(scope, visibility, key, value);

    return { success: true, size: jsonString.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Calculates current storage usage percentage for a key.
 * @param {*} value - The value being stored
 * @returns {Object} { size, limit, percent, isNearLimit }
 */
export const calculateUsage = (value) => {
  const size = JSON.stringify(value).length;
  return {
    size,
    limit: STORAGE_LIMIT,
    percent: Math.round((size / STORAGE_LIMIT) * 100),
    isNearLimit: size > STORAGE_LIMIT * 0.8, // 80% threshold
  };
};

/**
 * Removes data from Trello storage.
 * @param {Object} t - Trello Power-Up client instance
 * @param {string} scope - Storage scope ('card' | 'board' | 'member')
 * @param {string} visibility - Visibility ('shared' | 'private')
 * @param {string} key - Storage key to remove
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const removeData = async (t, scope, visibility, key) => {
  try {
    await t.remove(scope, visibility, key);
    return true;
  } catch (error) {
    return false;
  }
};

// =============================================================================
// CARD-SPECIFIC OPERATIONS
// =============================================================================

/**
 * Gets timer data from card storage.
 * @param {Object} t - Trello Power-Up client instance
 * @returns {Promise<Object>} Timer data
 */
export const getTimerData = async (t, scope = "card") => {
  const storedData = await t.get(
    scope,
    STORAGE_SCOPES.CARD_SHARED,
    STORAGE_KEYS.TIMER_DATA,
  );
  const timerData = await decodeTimerData(storedData);

  // Ensure structure is valid
  return {
    ...DEFAULTS.TIMER_DATA,
    ...timerData,
  };
};

/**
 * Saves timer data to card storage.
 * @param {Object} t - Trello client
 * @param {Object} timerData - Complete timer data to save
 * @returns {Promise<{success: boolean, size?: number, error?: string}>}
 */
export const setTimerData = async (t, timerData) => {
  try {
    const encoded = await encodeTimerData(timerData);
    const existing = await t.get("card", STORAGE_SCOPES.CARD_SHARED);
    const size = JSON.stringify({ ...existing, [STORAGE_KEYS.TIMER_DATA]: encoded }).length;
    if (size > STORAGE_LIMIT) {
      return {
        success: false,
        error: "Card time history is full, even after compression. Export a backup before removing any entries. Nothing was saved or deleted.",
        size,
      };
    }
    return await setData(t, "card", STORAGE_SCOPES.CARD_SHARED, STORAGE_KEYS.TIMER_DATA, encoded);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============================================================================
// BOARD-SPECIFIC OPERATIONS
// =============================================================================

/**
 * Gets board-wide settings.
 * @param {Object} t - Trello Power-Up client instance
 * @returns {Promise<Object>} Board settings
 */
export const getBoardSettings = async (t) => {
  return getData(
    t,
    "board",
    STORAGE_SCOPES.CARD_SHARED,
    STORAGE_KEYS.BOARD_SETTINGS,
    { ...DEFAULTS.BOARD_SETTINGS },
  );
};

/**
 * Saves board-wide settings.
 * @param {Object} t - Trello Power-Up client instance
 * @param {Object} settings - Settings to save
 * @returns {Promise<boolean>} True if successful
 */
export const setBoardSettings = async (t, settings) => {
  return setData(
    t,
    "board",
    STORAGE_SCOPES.CARD_SHARED,
    STORAGE_KEYS.BOARD_SETTINGS,
    settings,
  );
};

// =============================================================================
// USER-SPECIFIC OPERATIONS
// =============================================================================

/**
 * Gets user preferences.
 * @param {Object} t - Trello Power-Up client instance
 * @returns {Promise<Object>} User preferences
 */
export const getUserPreferences = async (t) => {
  return getData(
    t,
    "member",
    STORAGE_SCOPES.CARD_PRIVATE,
    STORAGE_KEYS.USER_PREFERENCES,
    { ...DEFAULTS.USER_PREFERENCES },
  );
};

/**
 * Saves user preferences.
 * @param {Object} t - Trello Power-Up client instance
 * @param {Object} preferences - Preferences to save
 * @returns {Promise<boolean>} True if successful
 */
export const setUserPreferences = async (t, preferences) => {
  return setData(
    t,
    "member",
    STORAGE_SCOPES.CARD_PRIVATE,
    STORAGE_KEYS.USER_PREFERENCES,
    preferences,
  );
};

/**
 * StorageService default export - provides all storage operations
 */
const StorageService = {
  getData,
  setData,
  removeData,
  getTimerData,
  setTimerData,
  calculateUsage,
  getBoardSettings,
  setBoardSettings,
  getUserPreferences,
  setUserPreferences,
};

export default StorageService;
