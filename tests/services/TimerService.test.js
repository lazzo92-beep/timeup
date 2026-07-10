/**
 * Tests for TimerService.js
 * Updated for aggregated totals architecture (totalTime, recentEntries, checklistTotals)
 */

import { jest } from "@jest/globals";
import TimerService from "../../src/services/TimerService.js";
import StorageService from "../../src/services/StorageService.js";
import TrelloService from "../../src/services/TrelloService.js";
import { TIMER_STATE, DEFAULTS, VALIDATION } from "../../src/utils/constants.js";

// Mock StorageService
jest.mock("../../src/services/StorageService.js");

// Mock TrelloService
jest.mock("../../src/services/TrelloService.js");

describe("TimerService", () => {
  let tMock;

  // Helper to generate fresh mock data matching new structure
  const getMockData = (overrides = {}) => ({
    state: TIMER_STATE.IDLE,
    currentEntry: null,
    estimatedTime: null,
    manualEstimateSet: false,
    totalTime: 0,
    recentEntries: [],
    checklistTotals: {},
    ...overrides,
  });

  beforeEach(() => {
    tMock = { t: "mock" };

    // Mock methods on the default export object
    StorageService.getTimerData = jest.fn().mockResolvedValue(getMockData());
    StorageService.setTimerData = jest
      .fn()
      .mockResolvedValue({ success: true });
    StorageService.setData = jest.fn().mockResolvedValue({ success: true });
    StorageService.getData = jest.fn().mockResolvedValue(null);

    // Mock TrelloService for member attribution
    TrelloService.getMember = jest.fn().mockResolvedValue({
      id: "test-member-id",
      fullName: "Test User",
      username: "testuser",
    });

    jest.clearAllMocks();
  });

  describe("startTimer (Global)", () => {
    test("should start timer if idle", async () => {
      const result = await TimerService.startTimer(tMock);

      expect(result.success).toBe(true);
      expect(result.data.state).toBe(TIMER_STATE.RUNNING);
      expect(result.data.currentEntry).toBeDefined();
      expect(StorageService.setTimerData).toHaveBeenCalled();
    });

    test("should fail if already running", async () => {
      StorageService.getTimerData.mockResolvedValue({
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
      });

      const result = await TimerService.startTimer(tMock);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Timer already running");
    });

    test("should start timer without affecting checklist items", async () => {
      // startTimer only starts global timer, doesn't stop checklist items
      const dataWithItem = {
        ...getMockData(),
        checklistTotals: {
          item1: {
            state: TIMER_STATE.RUNNING,
            currentEntry: { startTime: Date.now() - 1000, pausedDuration: 0 },
            totalTime: 0,
            entryCount: 0,
          },
        },
      };
      StorageService.getTimerData.mockResolvedValue(dataWithItem);

      const result = await TimerService.startTimer(tMock);

      expect(result.success).toBe(true);
      // Global should be running now
      expect(result.data.state).toBe(TIMER_STATE.RUNNING);
      // Checklist item should be stopped (single timer constraint)
      expect(result.data.checklistTotals.item1.state).toBe(TIMER_STATE.IDLE);
      expect(result.data.checklistTotals.item1.currentEntry).toBeNull();
      expect(result.data.checklistTotals.item1.totalTime).toBeGreaterThan(0);
    });

    test("should stop multiple running checklist items when starting global timer", async () => {
      const dataWithMultipleItems = {
        ...getMockData(),
        checklistTotals: {
          item1: {
            state: TIMER_STATE.RUNNING,
            currentEntry: { startTime: Date.now() - 2000, pausedDuration: 0 },
            totalTime: 5000,
            entryCount: 1,
          },
          item2: {
            state: TIMER_STATE.RUNNING,
            currentEntry: { startTime: Date.now() - 1000, pausedDuration: 0 },
            totalTime: 0,
            entryCount: 0,
          },
          item3: {
            state: TIMER_STATE.IDLE,
            currentEntry: null,
            totalTime: 3000,
            entryCount: 1,
          },
        },
      };
      StorageService.getTimerData.mockResolvedValue(dataWithMultipleItems);

      const result = await TimerService.startTimer(tMock);

      expect(result.success).toBe(true);
      // All checklist items should be idle
      expect(result.data.checklistTotals.item1.state).toBe(TIMER_STATE.IDLE);
      expect(result.data.checklistTotals.item2.state).toBe(TIMER_STATE.IDLE);
      expect(result.data.checklistTotals.item3.state).toBe(TIMER_STATE.IDLE);
      // Previously running items should have updated totalTime
      expect(result.data.checklistTotals.item1.totalTime).toBeGreaterThan(5000);
      expect(result.data.checklistTotals.item2.totalTime).toBeGreaterThan(0);
      // Idle item should remain unchanged
      expect(result.data.checklistTotals.item3.totalTime).toBe(3000);
    });
  });

  describe("stopTimer", () => {
    test("should stop running timer and create entry", async () => {
      const startTime = Date.now() - 5000; // 5 seconds ago
      StorageService.getTimerData.mockResolvedValue({
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime, pausedDuration: 0 },
      });

      const result = await TimerService.stopTimer(tMock, "Test description");

      expect(result.success).toBe(true);
      expect(result.data.state).toBe(TIMER_STATE.IDLE);
      expect(result.data.currentEntry).toBeNull();
      expect(result.entry).toBeDefined();
      expect(result.entry.description).toBe("Test description");
      expect(result.entry.duration).toBeGreaterThan(0);
      // totalTime should be updated
      expect(result.data.totalTime).toBeGreaterThan(0);
      // recentEntries should have the new entry
      expect(result.data.recentEntries.length).toBe(1);
    });

    test("should include memberId in entry when stopping timer", async () => {
      StorageService.getTimerData.mockResolvedValue({
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 1000, pausedDuration: 0 },
      });
      TrelloService.getMember.mockResolvedValue({
        id: "user-123",
        fullName: "John Doe",
      });

      const result = await TimerService.stopTimer(tMock, "");

      expect(result.success).toBe(true);
      expect(result.entry.memberId).toBe("user-123");
    });

    test("should handle null member gracefully", async () => {
      StorageService.getTimerData.mockResolvedValue({
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 1000, pausedDuration: 0 },
      });
      TrelloService.getMember.mockResolvedValue(null);

      const result = await TimerService.stopTimer(tMock, "");

      expect(result.success).toBe(true);
      expect(result.entry.memberId).toBeNull();
    });

    test("should fail if timer not running", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());

      const result = await TimerService.stopTimer(tMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No active timer");
    });

    test("should truncate long descriptions", async () => {
      StorageService.getTimerData.mockResolvedValue({
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 1000, pausedDuration: 0 },
      });

      const longDesc = "a".repeat(200);
      const result = await TimerService.stopTimer(tMock, longDesc);

      expect(result.success).toBe(true);
      expect(result.entry.description.length).toBe(120);
    });
  });

  describe("startItemTimer", () => {
    test("should start item timer and stop global timer", async () => {
      const runningGlobalData = {
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 1000, pausedDuration: 0 },
      };
      StorageService.getTimerData.mockResolvedValue(runningGlobalData);

      const result = await TimerService.startItemTimer(tMock, "item1");

      expect(result.success).toBe(true);
      // Global should be idle
      expect(result.data.state).toBe(TIMER_STATE.IDLE);
      // Item should be running
      expect(result.data.checklistTotals["item1"].state).toBe(
        TIMER_STATE.RUNNING,
      );
      // Global time should be added to totalTime
      expect(result.data.totalTime).toBeGreaterThan(0);
    });

    test("should start item timer when no global timer running", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());

      const result = await TimerService.startItemTimer(tMock, "item1");

      expect(result.success).toBe(true);
      expect(result.data.checklistTotals["item1"].state).toBe(
        TIMER_STATE.RUNNING,
      );
      expect(result.data.checklistTotals["item1"].currentEntry).toBeDefined();
    });

    test("should reject new item timer when at max checklist items limit", async () => {
      const checklistTotals = {};
      for (let i = 0; i < VALIDATION.MAX_CHECKLIST_ITEMS; i++) {
        checklistTotals[`existingItem${i}`] = {
          totalTime: 0,
          entryCount: 0,
          estimatedTime: null,
          state: TIMER_STATE.IDLE,
          currentEntry: null,
        };
      }
      StorageService.getTimerData.mockResolvedValue(
        getMockData({ checklistTotals }),
      );

      const result = await TimerService.startItemTimer(tMock, "newItem");

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        `Maximum ${VALIDATION.MAX_CHECKLIST_ITEMS}`,
      );
      expect(StorageService.setTimerData).not.toHaveBeenCalled();
    });

    test("should allow starting timer for existing item even at max limit", async () => {
      const checklistTotals = {};
      for (let i = 0; i < VALIDATION.MAX_CHECKLIST_ITEMS; i++) {
        checklistTotals[`existingItem${i}`] = {
          totalTime: 0,
          entryCount: 0,
          estimatedTime: null,
          state: TIMER_STATE.IDLE,
          currentEntry: null,
        };
      }
      StorageService.getTimerData.mockResolvedValue(
        getMockData({ checklistTotals }),
      );

      // Start timer on existing item - should succeed
      const result = await TimerService.startItemTimer(tMock, "existingItem5");

      expect(result.success).toBe(true);
      expect(result.data.checklistTotals["existingItem5"].state).toBe(
        TIMER_STATE.RUNNING,
      );
    });
  });

  describe("stopItemTimer", () => {
    test("should stop running item timer", async () => {
      const dataWithRunningItem = {
        ...getMockData(),
        checklistTotals: {
          item1: {
            state: TIMER_STATE.RUNNING,
            currentEntry: { startTime: Date.now() - 3000, pausedDuration: 0 },
            totalTime: 1000,
            entryCount: 1,
          },
        },
      };
      StorageService.getTimerData.mockResolvedValue(dataWithRunningItem);

      const result = await TimerService.stopItemTimer(tMock, "item1");

      expect(result.success).toBe(true);
      expect(result.data.checklistTotals["item1"].state).toBe(TIMER_STATE.IDLE);
      // totalTime should be increased
      expect(result.data.checklistTotals["item1"].totalTime).toBeGreaterThan(
        1000,
      );
      // entryCount should be incremented
      expect(result.data.checklistTotals["item1"].entryCount).toBe(2);
    });

    test("should fail if item not running", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());

      const result = await TimerService.stopItemTimer(tMock, "item1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("No active timer");
    });

    test("should include memberId in entry when stopping item timer", async () => {
      const dataWithRunningItem = {
        ...getMockData(),
        checklistTotals: {
          item1: {
            state: TIMER_STATE.RUNNING,
            currentEntry: { startTime: Date.now() - 1000, pausedDuration: 0 },
            totalTime: 0,
            entryCount: 0,
          },
        },
      };
      StorageService.getTimerData.mockResolvedValue(dataWithRunningItem);
      TrelloService.getMember.mockResolvedValue({
        id: "user-456",
        fullName: "Jane Doe",
      });

      const result = await TimerService.stopItemTimer(tMock, "item1", "");

      expect(result.success).toBe(true);
      expect(result.entry.memberId).toBe("user-456");
      expect(result.entry.checklistItemId).toBe("item1");
    });
  });

  describe("deleteEntry", () => {
    test("should delete entry and update totalTime", async () => {
      const entryToDelete = {
        id: "e1",
        duration: 5000,
        startTime: Date.now() - 10000,
        endTime: Date.now() - 5000,
      };
      const dataWithEntry = {
        ...getMockData(),
        totalTime: 10000,
        recentEntries: [entryToDelete],
      };
      StorageService.getTimerData.mockResolvedValue(dataWithEntry);

      const result = await TimerService.deleteEntry(tMock, "e1");

      expect(result.success).toBe(true);
      expect(result.data.recentEntries.length).toBe(0);
      // totalTime should be reduced by the deleted entry's duration
      expect(result.data.totalTime).toBe(5000);
    });

    test("should return error when entry not found", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());

      const result = await TimerService.deleteEntry(tMock, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Entry not found in recent entries");
    });

    test("should not affect checklistTotals when deleting linked entry", async () => {
      // deleteEntry only updates totalTime and recentEntries
      // checklistTotals is not affected (it's already aggregated)
      const entryToDelete = {
        id: "e1",
        duration: 3000,
        checklistItemId: "item1",
        startTime: Date.now() - 10000,
        endTime: Date.now() - 7000,
      };
      const dataWithLinkedEntry = {
        ...getMockData(),
        totalTime: 3000,
        recentEntries: [entryToDelete],
        checklistTotals: {
          item1: { totalTime: 3000, entryCount: 1, state: TIMER_STATE.IDLE },
        },
      };
      StorageService.getTimerData.mockResolvedValue(dataWithLinkedEntry);

      const result = await TimerService.deleteEntry(tMock, "e1");

      expect(result.success).toBe(true);
      // totalTime is reduced
      expect(result.data.totalTime).toBe(0);
      // recentEntries is cleared
      expect(result.data.recentEntries.length).toBe(0);
      // checklistTotals is NOT affected - it remains as aggregated
      expect(result.data.checklistTotals["item1"].totalTime).toBe(3000);
    });
  });

  describe("updateEntry", () => {
    test("should update entry description", async () => {
      const existingEntry = {
        id: "e1",
        duration: 5000,
        description: "Old description",
        startTime: Date.now() - 10000,
        endTime: Date.now() - 5000,
      };
      const dataWithEntry = {
        ...getMockData(),
        totalTime: 5000,
        recentEntries: [existingEntry],
      };
      StorageService.getTimerData.mockResolvedValue(dataWithEntry);

      const result = await TimerService.updateEntry(tMock, "e1", {
        description: "New description",
      });

      expect(result.success).toBe(true);
      expect(result.entry.description).toBe("New description");
    });

    test("should update entry duration and adjust totalTime", async () => {
      const existingEntry = {
        id: "e1",
        duration: 5000,
        description: "Test",
        startTime: Date.now() - 10000,
        endTime: Date.now() - 5000,
      };
      const dataWithEntry = {
        ...getMockData(),
        totalTime: 5000,
        recentEntries: [existingEntry],
      };
      StorageService.getTimerData.mockResolvedValue(dataWithEntry);

      const result = await TimerService.updateEntry(tMock, "e1", {
        duration: 10000,
      });

      expect(result.success).toBe(true);
      expect(result.entry.duration).toBe(10000);
      // totalTime should be adjusted: 5000 - 5000 (old) + 10000 (new) = 10000
      expect(result.data.totalTime).toBe(10000);
    });

    test("should return error for nonexistent entry", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());

      const result = await TimerService.updateEntry(tMock, "fake-id", {
        description: "Updated",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Entry not found in recent entries");
    });

    test("should update entry with new description", async () => {
      const existingEntry = {
        id: "e1",
        duration: 1000,
        description: "Old",
        startTime: 1000,
        endTime: 2000,
      };
      StorageService.getTimerData.mockResolvedValue({
        ...getMockData(),
        totalTime: 1000,
        recentEntries: [existingEntry],
      });

      const result = await TimerService.updateEntry(tMock, "e1", {
        description: "Updated description",
      });

      expect(result.success).toBe(true);
      expect(result.entry.description).toBe("Updated description");
    });
  });

  describe("setEstimate", () => {
    test("should set manual estimate", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());

      const result = await TimerService.setEstimate(tMock, 3600000);

      expect(result.success).toBe(true);
      expect(result.data.estimatedTime).toBe(3600000);
      expect(result.data.manualEstimateSet).toBe(true);
    });

    test("should clear manual estimate when set to null", async () => {
      StorageService.getTimerData.mockResolvedValue({
        ...getMockData(),
        estimatedTime: 3600000,
        manualEstimateSet: true,
      });

      const result = await TimerService.setEstimate(tMock, null);

      expect(result.success).toBe(true);
      expect(result.data.estimatedTime).toBeNull();
      expect(result.data.manualEstimateSet).toBe(false);
    });
  });

  describe("setItemEstimate", () => {
    test("should set item estimate", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());

      const result = await TimerService.setItemEstimate(
        tMock,
        "item1",
        1800000,
      );

      expect(result.success).toBe(true);
      expect(result.data.checklistTotals["item1"].estimatedTime).toBe(1800000);
    });

    test("should reject new item when at max checklist items limit", async () => {
      // Create mock data with MAX_CHECKLIST_ITEMS already present
      const checklistTotals = {};
      for (let i = 0; i < VALIDATION.MAX_CHECKLIST_ITEMS; i++) {
        checklistTotals[`existingItem${i}`] = {
          totalTime: 0,
          entryCount: 0,
          estimatedTime: 3600000,
          state: TIMER_STATE.IDLE,
          currentEntry: null,
        };
      }
      StorageService.getTimerData.mockResolvedValue(
        getMockData({ checklistTotals }),
      );

      const result = await TimerService.setItemEstimate(
        tMock,
        "newItem",
        1800000,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        `Maximum ${VALIDATION.MAX_CHECKLIST_ITEMS}`,
      );
      expect(StorageService.setTimerData).not.toHaveBeenCalled();
    });

    test("should allow updating existing item even at max limit", async () => {
      const checklistTotals = {};
      for (let i = 0; i < VALIDATION.MAX_CHECKLIST_ITEMS; i++) {
        checklistTotals[`existingItem${i}`] = {
          totalTime: 0,
          entryCount: 0,
          estimatedTime: 3600000,
          state: TIMER_STATE.IDLE,
          currentEntry: null,
        };
      }
      StorageService.getTimerData.mockResolvedValue(
        getMockData({ checklistTotals }),
      );

      // Update an existing item - should succeed
      const result = await TimerService.setItemEstimate(
        tMock,
        "existingItem5",
        7200000,
      );

      expect(result.success).toBe(true);
      expect(result.data.checklistTotals["existingItem5"].estimatedTime).toBe(
        7200000,
      );
    });
  });

  describe("getCurrentElapsed", () => {
    test("should return 0 when idle", () => {
      const timerData = getMockData();
      const elapsed = TimerService.getCurrentElapsed(timerData);
      expect(elapsed).toBe(0);
    });

    test("should return elapsed time when running", () => {
      const timerData = {
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
        currentEntry: {
          startTime: Date.now() - 5000,
          pausedDuration: 0,
        },
      };

      const elapsed = TimerService.getCurrentElapsed(timerData);
      expect(elapsed).toBeGreaterThanOrEqual(4900);
      expect(elapsed).toBeLessThanOrEqual(5100);
    });

    test("should account for pausedDuration", () => {
      const timerData = {
        ...getMockData(),
        state: TIMER_STATE.RUNNING,
        currentEntry: {
          startTime: Date.now() - 10000,
          pausedDuration: 3000,
        },
      };

      const elapsed = TimerService.getCurrentElapsed(timerData);
      expect(elapsed).toBeGreaterThanOrEqual(6900);
      expect(elapsed).toBeLessThanOrEqual(7100);
    });
  });

  describe("getItemCurrentElapsed", () => {
    test("should return 0 when item not running", () => {
      const itemData = {
        state: TIMER_STATE.IDLE,
        currentEntry: null,
      };
      expect(TimerService.getItemCurrentElapsed(itemData)).toBe(0);
    });

    test("should return elapsed time when item running", () => {
      const itemData = {
        state: TIMER_STATE.RUNNING,
        currentEntry: {
          startTime: Date.now() - 3000,
          pausedDuration: 0,
        },
      };

      const elapsed = TimerService.getItemCurrentElapsed(itemData);
      expect(elapsed).toBeGreaterThanOrEqual(2900);
      expect(elapsed).toBeLessThanOrEqual(3100);
    });
  });

  describe("getStorageUsage", () => {
    test("should return usage info", () => {
      const timerData = getMockData();
      const usage = TimerService.getStorageUsage(timerData);

      expect(usage).toBeDefined();
      expect(usage.size).toBeGreaterThan(0);
      expect(usage.percent).toBeGreaterThanOrEqual(0);
      expect(usage.percent).toBeLessThanOrEqual(100);
    });
  });

  describe("Error Handling", () => {
    test("startTimer should handle storage errors", async () => {
      StorageService.getTimerData.mockRejectedValue(new Error("Storage error"));

      const result = await TimerService.startTimer(tMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Storage error");
    });

    test("stopTimer should handle storage errors", async () => {
      StorageService.getTimerData.mockRejectedValue(new Error("Read error"));

      const result = await TimerService.stopTimer(tMock, "Test");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Read error");
    });

    test("setEstimate should handle errors", async () => {
      StorageService.getTimerData.mockRejectedValue(new Error("Storage error"));

      const result = await TimerService.setEstimate(tMock, 3600000);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Storage error");
    });

    test("deleteEntry should handle storage errors", async () => {
      StorageService.getTimerData.mockRejectedValue(new Error("Delete error"));

      const result = await TimerService.deleteEntry(tMock, "entry1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete error");
    });

    test("updateEntry should handle storage errors", async () => {
      StorageService.getTimerData.mockRejectedValue(new Error("Update error"));

      const result = await TimerService.updateEntry(tMock, "entry1", {
        description: "Updated",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update error");
    });

    test("startItemTimer should handle storage errors", async () => {
      StorageService.getTimerData.mockRejectedValue(
        new Error("Checklist error"),
      );

      const result = await TimerService.startItemTimer(tMock, "item1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Checklist error");
    });

    test("stopItemTimer should handle storage errors", async () => {
      StorageService.getTimerData.mockRejectedValue(
        new Error("Stop item error"),
      );

      const result = await TimerService.stopItemTimer(tMock, "item1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Stop item error");
    });

    test("handleSaveResult should handle save errors", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());
      StorageService.setTimerData.mockResolvedValue({
        success: false,
        error: "Storage limit exceeded",
      });

      const result = await TimerService.startTimer(tMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Storage limit exceeded");
    });

    test("setItemEstimate should handle storage errors", async () => {
      StorageService.getTimerData.mockRejectedValue(
        new Error("Estimate error"),
      );

      const result = await TimerService.setItemEstimate(
        tMock,
        "item1",
        3600000,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Estimate error");
    });
  });

  describe("Edge Cases", () => {
    test("getCurrentElapsed returns 0 when state is not RUNNING", () => {
      const timerData = {
        state: "idle",
        currentEntry: { startTime: Date.now() - 5000, pausedDuration: 0 },
      };

      const elapsed = TimerService.getCurrentElapsed(timerData);
      expect(elapsed).toBe(0);
    });

    test("getCurrentElapsed returns 0 when state is paused", () => {
      const timerData = {
        state: "paused",
        currentEntry: { startTime: Date.now() - 5000, pausedDuration: 1000 },
      };

      const elapsed = TimerService.getCurrentElapsed(timerData);
      expect(elapsed).toBe(0);
    });

    test("getItemCurrentElapsed handles missing pausedDuration", () => {
      const itemTotal = {
        currentEntry: { startTime: Date.now() - 5000 },
      };

      const elapsed = TimerService.getItemCurrentElapsed(itemTotal);
      expect(elapsed).toBeGreaterThan(0);
    });

    test("stopTimer creates entry with empty description when not provided", async () => {
      const mockData = getMockData({
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 10000, pausedDuration: 0 },
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      const result = await TimerService.stopTimer(tMock);

      expect(result.success).toBe(true);
      const savedData = StorageService.setTimerData.mock.calls[0][1];
      expect(savedData.recentEntries[0].description).toBe("");
    });

    test("stopTimer handles null description", async () => {
      const mockData = getMockData({
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 5000, pausedDuration: 0 },
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      const result = await TimerService.stopTimer(tMock, null);

      expect(result.success).toBe(true);
      expect(result.data.recentEntries[0].description).toBe("");
    });

    test("stopTimer fails when setTimerData fails", async () => {
      const mockData = getMockData({
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 5000, pausedDuration: 0 },
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({
        success: false,
        error: "Storage full",
      });

      const result = await TimerService.stopTimer(tMock);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Storage full");
    });

    test("validateTimerData handles missing recentEntries", async () => {
      // Data without recentEntries array
      const malformedData = {
        state: TIMER_STATE.IDLE,
        currentEntry: null,
        recentEntries: "not-an-array",
        checklistTotals: {},
      };

      StorageService.getTimerData.mockResolvedValue(malformedData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      // startTimer should work because validateTimerData fixes it
      const result = await TimerService.startTimer(tMock);

      expect(result.success).toBe(true);
    });

    test("validateTimerData handles null checklistTotals", async () => {
      const malformedData = {
        state: TIMER_STATE.IDLE,
        currentEntry: null,
        recentEntries: [],
        checklistTotals: null,
      };

      StorageService.getTimerData.mockResolvedValue(malformedData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      const result = await TimerService.startTimer(tMock);

      expect(result.success).toBe(true);
      expect(result.data.checklistTotals).toEqual({});
    });

    test("stopTimer handles missing pausedDuration in currentEntry", async () => {
      const mockData = getMockData({
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 5000 }, // No pausedDuration
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      const result = await TimerService.stopTimer(tMock);

      expect(result.success).toBe(true);
      expect(result.data.recentEntries[0].duration).toBeGreaterThan(0);
    });

    test("startItemTimer stops global timer and creates entry", async () => {
      const mockData = getMockData({
        state: TIMER_STATE.RUNNING,
        currentEntry: { startTime: Date.now() - 10000, pausedDuration: 1000 },
        totalTime: 5000,
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      const result = await TimerService.startItemTimer(tMock, "item1");

      expect(result.success).toBe(true);
      // Global timer should be stopped
      expect(result.data.state).toBe(TIMER_STATE.IDLE);
      expect(result.data.currentEntry).toBeNull();
      // Entry should be created
      expect(result.data.recentEntries).toHaveLength(1);
      // Item timer should be running
      expect(result.data.checklistTotals["item1"].state).toBe(
        TIMER_STATE.RUNNING,
      );
    });

    test("stopItemTimer handles missing pausedDuration", async () => {
      const mockData = getMockData({
        checklistTotals: {
          item1: {
            totalTime: 0,
            entryCount: 0,
            estimatedTime: null,
            state: TIMER_STATE.RUNNING,
            currentEntry: { startTime: Date.now() - 5000 }, // No pausedDuration
          },
        },
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      const result = await TimerService.stopItemTimer(tMock, "item1");

      expect(result.success).toBe(true);
      expect(result.data.checklistTotals["item1"].totalTime).toBeGreaterThan(0);
    });

    test("stopItemTimer fails when setTimerData fails", async () => {
      const mockData = getMockData({
        checklistTotals: {
          item1: {
            totalTime: 0,
            entryCount: 0,
            estimatedTime: null,
            state: TIMER_STATE.RUNNING,
            currentEntry: { startTime: Date.now() - 5000, pausedDuration: 0 },
          },
        },
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({
        success: false,
        error: "Storage limit",
      });

      const result = await TimerService.stopItemTimer(tMock, "item1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Storage limit");
    });

    test("updateEntry without duration change keeps totalTime same", async () => {
      const mockData = getMockData({
        totalTime: 10000,
        recentEntries: [{ id: "entry1", duration: 5000, description: "Old" }],
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({ success: true });

      const result = await TimerService.updateEntry(tMock, "entry1", {
        description: "Updated",
      });

      expect(result.success).toBe(true);
      expect(result.data.totalTime).toBe(10000); // Unchanged
      expect(result.data.recentEntries[0].description).toBe("Updated");
    });

    test("updateEntry fails when setTimerData fails", async () => {
      const mockData = getMockData({
        recentEntries: [{ id: "entry1", duration: 5000, description: "Old" }],
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({
        success: false,
        error: "DB error",
      });

      const result = await TimerService.updateEntry(tMock, "entry1", {
        description: "New",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("DB error");
    });

    test("setEstimate fails when setTimerData fails", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());
      StorageService.setTimerData.mockResolvedValue({
        success: false,
        error: "Quota exceeded",
      });

      const result = await TimerService.setEstimate(tMock, 3600000);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Quota exceeded");
    });

    test("setItemEstimate fails when setTimerData fails", async () => {
      StorageService.getTimerData.mockResolvedValue(getMockData());
      StorageService.setTimerData.mockResolvedValue({
        success: false,
        error: "Item error",
      });

      const result = await TimerService.setItemEstimate(
        tMock,
        "item1",
        3600000,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Item error");
    });

    test("deleteEntry fails when setTimerData fails", async () => {
      const mockData = getMockData({
        totalTime: 10000,
        recentEntries: [{ id: "entry1", duration: 5000 }],
      });

      StorageService.getTimerData.mockResolvedValue(mockData);
      StorageService.setTimerData.mockResolvedValue({
        success: false,
        error: "Delete failed",
      });

      const result = await TimerService.deleteEntry(tMock, "entry1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
    });
  });
});
