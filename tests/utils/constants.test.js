/**
 * Tests for constants.js
 */

import {
  STORAGE_KEYS,
  STORAGE_SCOPES,
  TIMER_STATE,
  TIME,
  APP_INFO,
  DEFAULTS,
  BADGE_COLORS,
  VALIDATION,
} from "../../src/utils/constants.js";

describe("Constants exports", () => {
  describe("STORAGE_KEYS", () => {
    test("has required keys", () => {
      expect(STORAGE_KEYS.TIMER_DATA).toBe("timerData");
      expect(STORAGE_KEYS.BOARD_SETTINGS).toBe("boardSettings");
      expect(STORAGE_KEYS.USER_PREFERENCES).toBe("userPreferences");
    });
  });

  describe("STORAGE_SCOPES", () => {
    test("has required scopes", () => {
      expect(STORAGE_SCOPES.CARD_SHARED).toBe("shared");
      expect(STORAGE_SCOPES.CARD_PRIVATE).toBe("private");
    });
  });

  describe("TIMER_STATE", () => {
    test("has all states", () => {
      expect(TIMER_STATE.IDLE).toBe("idle");
      expect(TIMER_STATE.RUNNING).toBe("running");
      expect(TIMER_STATE.PAUSED).toBe("paused");
    });
  });

  describe("TIME", () => {
    test("has correct millisecond values", () => {
      expect(TIME.SECOND).toBe(1000);
      expect(TIME.MINUTE).toBe(60000);
      expect(TIME.HOUR).toBe(3600000);
      expect(TIME.DAY).toBe(86400000);
    });
  });

  describe("APP_INFO", () => {
    test("has app metadata", () => {
      expect(APP_INFO.NAME).toBe("TimeUp");
      expect(APP_INFO.VERSION).toBeDefined();
      expect(APP_INFO.POWER_UP_NAME).toBeDefined();
    });
  });

  describe("DEFAULTS", () => {
    test("TIMER_DATA has correct structure", () => {
      expect(DEFAULTS.TIMER_DATA).toEqual({
        state: TIMER_STATE.IDLE,
        currentEntry: null,
        estimatedTime: null,
        manualEstimateSet: false,
        totalTime: 0,
        recentEntries: [],
        checklistTotals: {},
      });
    });

    test("BOARD_SETTINGS has correct structure", () => {
      expect(DEFAULTS.BOARD_SETTINGS).toEqual({
        hourlyRate: null,
        currency: "USD",
        categories: [],
      });
    });

    test("USER_PREFERENCES has correct structure", () => {
      expect(DEFAULTS.USER_PREFERENCES).toEqual({
        showSeconds: true,
        use24HourFormat: true,
        autoStartOnOpen: false,
      });
    });
  });

  describe("BADGE_COLORS", () => {
    test("has all badge colors", () => {
      expect(BADGE_COLORS.DEFAULT).toBe("light-gray");
      expect(BADGE_COLORS.RUNNING).toBe("green");
      expect(BADGE_COLORS.WARNING).toBe("yellow");
      expect(BADGE_COLORS.OVER_BUDGET).toBe("red");
    });
  });

  describe("VALIDATION", () => {
    test("has max description length", () => {
      expect(VALIDATION.MAX_DESCRIPTION_LENGTH).toBe(120);
    });

    test("has max checklist items limit", () => {
      expect(VALIDATION.MAX_CHECKLIST_ITEMS).toBe(15);
    });
  });
});
