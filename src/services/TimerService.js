/**
 * TimeUp - Timer Service
 * Business logic for timer operations using aggregated totals
 */

import { TIMER_STATE, DEFAULTS, VALIDATION } from "../utils/constants.js";
import { getElapsedTime } from "../utils/formatTime.js";
import StorageService from "./StorageService.js";
import TrelloService from "./TrelloService.js";

const MAX_RECENT_ENTRIES = 5;

/**
 * Creates a new time entry.
 * @param {number} startTime - Start timestamp
 * @param {number} endTime - End timestamp
 * @param {string} [description=''] - Description
 * @param {string} [checklistItemId=null] - Optional checklist item ID
 * @param {string} [memberId=null] - ID of member who created the entry
 * @returns {Object} Time entry
 */
const createEntry = (
  startTime,
  endTime,
  description = "",
  checklistItemId = null,
  memberId = null,
) => {
  const truncatedDescription = (description || "").substring(
    0,
    VALIDATION.MAX_DESCRIPTION_LENGTH,
  );

  return {
    id: `e_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    startTime,
    endTime,
    duration: endTime - startTime,
    description: truncatedDescription,
    createdAt: endTime,
    checklistItemId,
    memberId,
  };
};

/**
 * Adds an entry to recent entries (max 5, newest first).
 * @param {Array} recentEntries - Current recent entries
 * @param {Object} newEntry - New entry to add
 * @returns {Array} Updated recent entries
 */
const addToRecentEntries = (recentEntries, newEntry) => {
  const updated = [newEntry, ...recentEntries];
  return updated.slice(0, MAX_RECENT_ENTRIES);
};

/**
 * Validates timer data structure.
 * @param {Object} data - Timer data
 * @returns {Object} Validated timer data
 */
const validateTimerData = (data) => ({
  ...DEFAULTS.TIMER_DATA,
  ...data,
  recentEntries: Array.isArray(data?.recentEntries) ? data.recentEntries : [],
  checklistTotals: data?.checklistTotals ?? {},
});

/**
 * Starts the global timer.
 * Stops any running checklist item timers first (single timer constraint).
 * @param {Object} t - Trello client
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const startTimer = async (t) => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));

    if (timerData.state === TIMER_STATE.RUNNING) {
      return {
        success: false,
        error: "Timer already running",
        data: timerData,
      };
    }

    // Stop any running checklist item timers first (single timer constraint)
    const now = Date.now();
    for (const [itemId, itemTotal] of Object.entries(
      timerData.checklistTotals,
    )) {
      if (itemTotal.state === TIMER_STATE.RUNNING && itemTotal.currentEntry) {
        const { startTime, pausedDuration = 0 } = itemTotal.currentEntry;
        const duration = now - startTime - pausedDuration;
        timerData.checklistTotals[itemId] = {
          ...itemTotal,
          totalTime: (itemTotal.totalTime || 0) + duration,
          entryCount: (itemTotal.entryCount || 0) + 1,
          state: TIMER_STATE.IDLE,
          currentEntry: null,
        };
      }
    }

    const updatedData = {
      ...timerData,
      state: TIMER_STATE.RUNNING,
      currentEntry: { startTime: Date.now(), pausedDuration: 0 },
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Stops the timer and saves entry.
 * @param {Object} t - Trello client
 * @param {string} [description=''] - Entry description
 * @returns {Promise<{success: boolean, data?: Object, entry?: Object, error?: string}>}
 */
export const stopTimer = async (t, description = "") => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));

    if (timerData.state === TIMER_STATE.IDLE || !timerData.currentEntry) {
      return { success: false, error: "No active timer", data: timerData };
    }

    const now = Date.now();
    const { startTime, pausedDuration = 0 } = timerData.currentEntry;

    // Get current member for attribution
    const member = await TrelloService.getMember(t);
    const memberId = member?.id || null;

    const newEntry = createEntry(
      startTime,
      now,
      description,
      null,
      memberId,
    );
    newEntry.duration = now - startTime - pausedDuration;

    const updatedData = {
      ...timerData,
      state: TIMER_STATE.IDLE,
      currentEntry: null,
      totalTime: timerData.totalTime + newEntry.duration,
      recentEntries: addToRecentEntries(timerData.recentEntries, newEntry),
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData, entry: newEntry }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Gets current elapsed time for running timer.
 * @param {Object} timerData - Timer data
 * @returns {number} Elapsed ms
 */
export const getCurrentElapsed = (timerData) => {
  if (!timerData?.currentEntry) return 0;
  const { startTime, pausedDuration = 0 } = timerData.currentEntry;
  if (timerData.state === TIMER_STATE.RUNNING)
    return getElapsedTime(startTime) - pausedDuration;
  return 0;
};

/**
 * Sets the time estimate for a card.
 * @param {Object} t - Trello client
 * @param {number|null} estimatedTimeMs - Estimated time in milliseconds
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const setEstimate = async (t, estimatedTimeMs) => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));
    const updatedData = {
      ...timerData,
      estimatedTime: estimatedTimeMs,
      manualEstimateSet: estimatedTimeMs !== null && estimatedTimeMs > 0,
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Deletes a recent entry by ID.
 * @param {Object} t - Trello client
 * @param {string} entryId - ID of the entry to delete
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const deleteEntry = async (t, entryId) => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));
    const entry = timerData.recentEntries.find((e) => e.id === entryId);

    if (!entry) {
      return { success: false, error: "Entry not found in recent entries" };
    }

    const updatedData = {
      ...timerData,
      recentEntries: timerData.recentEntries.filter((e) => e.id !== entryId),
      totalTime: Math.max(0, timerData.totalTime - entry.duration),
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Updates a recent entry.
 * @param {Object} t - Trello client
 * @param {string} entryId - Entry ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, data?: Object, entry?: Object, error?: string}>}
 */
export const updateEntry = async (t, entryId, updates) => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));
    const entryIndex = timerData.recentEntries.findIndex(
      (e) => e.id === entryId,
    );

    if (entryIndex === -1) {
      return { success: false, error: "Entry not found in recent entries" };
    }

    const oldEntry = timerData.recentEntries[entryIndex];
    const updatedEntry = { ...oldEntry, ...updates };

    // Adjust totalTime if duration changed
    const durationDelta =
      (updates.duration || oldEntry.duration) - oldEntry.duration;

    const updatedData = {
      ...timerData,
      recentEntries: timerData.recentEntries.map((e, i) =>
        i === entryIndex ? updatedEntry : e,
      ),
      totalTime: timerData.totalTime + durationDelta,
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData, entry: updatedEntry }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// =============================================================================
// CHECKLIST ITEM TIMER OPERATIONS
// =============================================================================

/**
 * Starts timer for a specific checklist item.
 * @param {Object} t - Trello client
 * @param {string} checkItemId - Checklist item ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const startItemTimer = async (t, checkItemId) => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));

    // Check if adding a new checklist item would exceed the limit
    const existingItems = Object.keys(timerData.checklistTotals);
    const isNewItem = !existingItems.includes(checkItemId);
    if (isNewItem && existingItems.length >= VALIDATION.MAX_CHECKLIST_ITEMS) {
      return {
        success: false,
        error: `Maximum ${VALIDATION.MAX_CHECKLIST_ITEMS} checklist items can have time tracking. Remove estimates from unused items first.`,
      };
    }

    // Stop global timer if running
    if (timerData.state === TIMER_STATE.RUNNING && timerData.currentEntry) {
      const now = Date.now();
      const { startTime, pausedDuration = 0 } = timerData.currentEntry;
      const duration = now - startTime - pausedDuration;

      // Get current member for attribution
      const member = await TrelloService.getMember(t);
      const memberId = member?.id || null;

      const newEntry = createEntry(startTime, now, "", null, memberId);
      newEntry.duration = duration;

      timerData.totalTime += duration;
      timerData.recentEntries = addToRecentEntries(
        timerData.recentEntries,
        newEntry,
      );
      timerData.state = TIMER_STATE.IDLE;
      timerData.currentEntry = null;
    }

    // Get or initialize checklist item total
    const itemTotal = timerData.checklistTotals[checkItemId] || {
      totalTime: 0,
      entryCount: 0,
      estimatedTime: null,
      state: TIMER_STATE.IDLE,
      currentEntry: null,
    };

    const updatedData = {
      ...timerData,
      checklistTotals: {
        ...timerData.checklistTotals,
        [checkItemId]: {
          ...itemTotal,
          state: TIMER_STATE.RUNNING,
          currentEntry: { startTime: Date.now(), pausedDuration: 0 },
        },
      },
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Stops timer for a specific checklist item.
 * @param {Object} t - Trello client
 * @param {string} checkItemId - Checklist item ID
 * @param {string} [description=''] - Entry description
 * @returns {Promise<{success: boolean, data?: Object, entry?: Object, error?: string}>}
 */
export const stopItemTimer = async (t, checkItemId, description = "") => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));
    const itemTotal = timerData.checklistTotals[checkItemId];

    if (!itemTotal?.currentEntry) {
      return { success: false, error: "No active timer for this item" };
    }

    const now = Date.now();
    const { startTime, pausedDuration = 0 } = itemTotal.currentEntry;
    const duration = now - startTime - pausedDuration;

    // Get current member for attribution
    const member = await TrelloService.getMember(t);
    const memberId = member?.id || null;

    const newEntry = createEntry(
      startTime,
      now,
      description,
      checkItemId,
      memberId,
    );
    newEntry.duration = duration;

    const updatedData = {
      ...timerData,
      totalTime: timerData.totalTime + duration,
      recentEntries: addToRecentEntries(timerData.recentEntries, newEntry),
      checklistTotals: {
        ...timerData.checklistTotals,
        [checkItemId]: {
          ...itemTotal,
          state: TIMER_STATE.IDLE,
          totalTime: itemTotal.totalTime + duration,
          entryCount: itemTotal.entryCount + 1,
          currentEntry: null,
        },
      },
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData, entry: newEntry }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sets estimate for a specific checklist item.
 * @param {Object} t - Trello client
 * @param {string} checkItemId - Checklist item ID
 * @param {number|null} estimatedTimeMs - Estimate in ms
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const setItemEstimate = async (t, checkItemId, estimatedTimeMs) => {
  try {
    const timerData = validateTimerData(await StorageService.getTimerData(t));

    // Check if adding a new checklist item would exceed the limit
    const existingItems = Object.keys(timerData.checklistTotals);
    const isNewItem = !existingItems.includes(checkItemId);
    if (isNewItem && existingItems.length >= VALIDATION.MAX_CHECKLIST_ITEMS) {
      return {
        success: false,
        error: `Maximum ${VALIDATION.MAX_CHECKLIST_ITEMS} checklist items can have estimates. Remove estimates from unused items first.`,
      };
    }

    const itemTotal = timerData.checklistTotals[checkItemId] || {
      totalTime: 0,
      entryCount: 0,
      estimatedTime: null,
      state: TIMER_STATE.IDLE,
      currentEntry: null,
    };

    const updatedData = {
      ...timerData,
      checklistTotals: {
        ...timerData.checklistTotals,
        [checkItemId]: {
          ...itemTotal,
          estimatedTime: estimatedTimeMs,
        },
      },
    };

    const result = await StorageService.setTimerData(t, updatedData);
    return result.success
      ? { success: true, data: updatedData }
      : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Gets current elapsed time for a checklist item.
 * @param {Object} itemTotal - Checklist item total data
 * @returns {number} Elapsed ms
 */
export const getItemCurrentElapsed = (itemTotal) => {
  if (!itemTotal?.currentEntry) return 0;
  const { startTime, pausedDuration = 0 } = itemTotal.currentEntry;
  return getElapsedTime(startTime) - pausedDuration;
};

/**
 * Gets storage usage stats.
 * @param {Object} timerData - Current timer data
 * @returns {Object} Usage stats
 */
export const getStorageUsage = (timerData) => {
  return StorageService.calculateUsage(timerData);
};

const TimerService = {
  startTimer,
  stopTimer,
  getCurrentElapsed,
  setEstimate,
  deleteEntry,
  updateEntry,
  startItemTimer,
  stopItemTimer,
  setItemEstimate,
  getItemCurrentElapsed,
  getStorageUsage,
};

export default TimerService;
