/**
 * TimeUp - Main Power-Up Initialization
 * Registers all Power-Up capabilities with Trello
 */

import { TIMER_STATE, APP_INFO, BADGE_COLORS } from "./utils/constants.js";
import { AppConfig } from "./config/AppConfig.js";
import { formatDuration, getRemainingTime } from "./utils/formatTime.js";
import StorageService from "./services/StorageService.js";
import TimerService from "./services/TimerService.js";
import { getRunningCheckItem } from "./services/ChecklistService.js";

// SVG clock icon (works well on dark backgrounds)
const ICON_TIMER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23b6c2cf" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  );

// SVG play icon for running timer badge (green fill)
const ICON_PLAY =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2361bd4f" stroke="none"><circle cx="12" cy="12" r="10" fill="%2361bd4f"/><polygon points="10,8 16,12 10,16" fill="white"/></svg>`,
  );

/**
 * Initializes the Trello Power-Up with all capabilities.
 */
/* global TrelloPowerUp */
TrelloPowerUp.initialize(
  {
    "board-buttons": async (t) => {
      return [
        {
          text: "Time Report",
          icon: {
            dark: ICON_TIMER,
            light: ICON_TIMER,
          },
          callback: (buttonT) =>
            buttonT.modal({
              title: "Time Report",
              url: buttonT.signUrl("./views/report.html?v=2"),
              fullscreen: true,
            }),
        },
      ];
    },

    "card-badges": async (t) => {
      try {
        const timerData = await StorageService.getTimerData(t);
        const badges = [];

        // Check if any timer is running (global or checklist)
        const isGlobalRunning = timerData.state === TIMER_STATE.RUNNING;
        const runningCheckItem = getRunningCheckItem(timerData);
        const isAnyTimerRunning = isGlobalRunning || runningCheckItem.isRunning;

        // Show play icon badge when a timer is running
        if (isAnyTimerRunning) {
          badges.push({
            text: "▶︎",
            color: "green",
          });
        }

        // Show remaining time if estimate is set
        const remainingInfo = getRemainingTime(
          timerData.totalTime,
          timerData.estimatedTime,
        );
        if (remainingInfo) {
          let color = BADGE_COLORS.DEFAULT;
          let text = "";
          if (remainingInfo.isOverBudget) {
            color = BADGE_COLORS.OVER_BUDGET;
            text = `${formatDuration(Math.abs(remainingInfo.remaining), { compact: true, showSeconds: false })} over`;
          } else if (remainingInfo.percentComplete >= 80) {
            color = BADGE_COLORS.WARNING;
            text = `${formatDuration(remainingInfo.remaining, { compact: true, showSeconds: false })} left`;
          } else {
            text = `${formatDuration(remainingInfo.remaining, { compact: true, showSeconds: false })} left`;
          }
          badges.push({ text, color });
        }

        return badges;
      } catch (error) {
        return [];
      }
    },

    "card-detail-badges": async (t) => {
      try {
        const timerData = await StorageService.getTimerData(t);

        // Only show saved totalTime (not live updates)
        if (timerData.totalTime === 0) {
          return [];
        }

        return [
          {
            title: "Total Time",
            text: formatDuration(timerData.totalTime, { compact: true }),
            color: null,
          },
        ];
      } catch (error) {
        return [];
      }
    },

    // Embed timer section directly inside the card
    "card-back-section": async (t) => {
      return {
        title: "Time Tracker",
        icon: ICON_TIMER,
        content: {
          type: "iframe",
          url: t.signUrl("./views/card-section.html?v=4"),
          height: 180,
        },
      };
    },
  },
  {
    appKey: AppConfig.APP_KEY,
    appName: AppConfig.APP_NAME,
  },
);
