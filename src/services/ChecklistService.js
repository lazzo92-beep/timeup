/**
 * TimeUp - Checklist Service
 * Handles fetching checklists and calculating estimates from checklist items
 */

import { TIMER_STATE } from "../utils/constants.js";
import { AppConfig } from "../config/AppConfig.js";

/**
 * Fetches all checklists for the current card.
 * @param {Object} t - Trello Power-Up client
 * @returns {Promise<Array|null>} Array of checklists if successful/empty, or null if not authorized
 */
export const getChecklists = async (t) => {
  try {
    const context = t.getContext();
    const cardId = context.card;

    const restApi = t.getRestApi();
    const isAuthorized = await restApi.isAuthorized();

    if (!isAuthorized) {
      return null;
    }

    const token = await restApi.getToken();
    if (!token) {
      return [];
    }

    if (!cardId) {
      return [];
    }

    // Fetch directly from Trello API
    const response = await fetch(
      `https://api.trello.com/1/cards/${cardId}/checklists?key=${AppConfig.APP_KEY}&token=${token}`,
    );

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) || [];
  } catch (error) {
    return [];
  }
};

/**
 * Flattens all check items from all checklists.
 * @param {Array} checklists - Array of checklists
 * @returns {Array} Array of {id, name, state, checklistId, checklistName}
 */
export const getAllCheckItems = (checklists) => {
  if (!Array.isArray(checklists)) return [];

  return checklists.flatMap((checklist) =>
    (checklist.checkItems || []).map((item) => ({
      id: item.id,
      name: item.name,
      state: item.state,
      checklistId: checklist.id,
      checklistName: checklist.name,
    })),
  );
};

/**
 * Calculates total estimate from all checklist items.
 * @param {Object} timerData - Timer data with checklistTotals
 * @param {Array} checklists - Checklists from Trello
 * @returns {number} Total estimate in milliseconds
 */
export const calculateChecklistEstimate = (timerData, checklists) => {
  const allItems = getAllCheckItems(checklists);
  const checklistTotals = timerData?.checklistTotals || {};

  return allItems.reduce((total, item) => {
    const estimate = checklistTotals[item.id]?.estimatedTime;
    return total + (estimate > 0 ? estimate : 0);
  }, 0);
};

/**
 * Gets the effective estimate (manual override or calculated from checklists).
 * @param {Object} timerData - Timer data
 * @param {Array} checklists - Checklists from Trello
 * @returns {number|null} Effective estimate in milliseconds
 */
export const getEffectiveEstimate = (timerData, checklists) => {
  if (timerData?.manualEstimateSet && timerData.estimatedTime > 0) {
    return timerData.estimatedTime;
  }
  const derived = calculateChecklistEstimate(timerData, checklists);
  return derived > 0 ? derived : null;
};

/**
 * Gets data for a specific checklist item from checklistTotals.
 * @param {Object} timerData - Timer data
 * @param {string} checkItemId - Checklist item ID
 * @returns {Object} Checklist item data {totalTime, entryCount, estimatedTime, state, currentEntry}
 */
export const getCheckItemData = (timerData, checkItemId) => {
  return (
    timerData?.checklistTotals?.[checkItemId] || {
      totalTime: 0,
      entryCount: 0,
      estimatedTime: 0,
      state: TIMER_STATE.IDLE,
      currentEntry: null,
    }
  );
};

/**
 * Gets total time spent on a checklist item from aggregated data.
 * @param {Object} timerData - Global timer data
 * @param {string} itemId - Checklist item ID
 * @returns {number} Total time in milliseconds
 */
export const getCheckItemTotalTime = (timerData, itemId) => {
  return timerData?.checklistTotals?.[itemId]?.totalTime || 0;
};

/**
 * Checks if any checklist item has a running timer.
 * @param {Object} timerData - Timer data
 * @returns {{isRunning: boolean, itemId: string|null}}
 */
export const getRunningCheckItem = (timerData) => {
  const checklistTotals = timerData?.checklistTotals || {};
  // Object.entries + find is cleaner
  const found = Object.entries(checklistTotals).find(
    ([_, data]) => data.state === TIMER_STATE.RUNNING,
  );

  return found
    ? { isRunning: true, itemId: found[0] }
    : { isRunning: false, itemId: null };
};

const ChecklistService = {
  getChecklists,
  getAllCheckItems,
  calculateChecklistEstimate,
  getEffectiveEstimate,
  getCheckItemData,
  getCheckItemTotalTime,
  getRunningCheckItem,
};

export default ChecklistService;
