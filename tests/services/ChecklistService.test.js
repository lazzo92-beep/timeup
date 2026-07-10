/**
 * Tests for ChecklistService.js
 */

import {
  getChecklists,
  getAllCheckItems,
  calculateChecklistEstimate,
  getEffectiveEstimate,
  getCheckItemData,
  getCheckItemTotalTime,
  getRunningCheckItem,
} from "../../src/services/ChecklistService.js";
import { TIMER_STATE } from "../../src/utils/constants.js";
import { jest } from "@jest/globals";
import { createTrelloMock, createErrorMock } from "../mocks/trelloMock.js";

describe("ChecklistService", () => {
  let mockT;

  beforeEach(() => {
    mockT = createTrelloMock();
    jest.clearAllMocks();
  });

  describe("getChecklists", () => {
    beforeEach(() => {
      // Mock Fetch
      global.fetch = jest.fn();

      // Mock Trello Context & REST API
      mockT.getContext = jest.fn().mockReturnValue({ card: "card123" });
      mockT.getRestApi = jest.fn().mockReturnValue({
        isAuthorized: jest.fn().mockResolvedValue(true),
        getToken: jest.fn().mockResolvedValue("test-token"),
        appKey: "test-key",
      });
    });

    test("returns checklists from REST API", async () => {
      const mockChecklists = [
        { id: "cl1", name: "Checklist 1", checkItems: [] },
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockChecklists,
      });

      const result = await getChecklists(mockT);

      expect(result).toEqual(mockChecklists);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("api.trello.com"),
      );
      expect(mockT.getRestApi).toHaveBeenCalled();
    });

    test("returns null when not authorized", async () => {
      mockT.getRestApi().isAuthorized.mockResolvedValue(false);

      const result = await getChecklists(mockT);
      expect(result).toBeNull();
    });

    test("returns empty array when token missing", async () => {
      mockT.getRestApi().getToken.mockResolvedValue(null);

      const result = await getChecklists(mockT);
      expect(result).toEqual([]);
    });

    test("returns empty array when cardId missing", async () => {
      mockT.getContext = jest.fn().mockReturnValue({ card: null });

      const result = await getChecklists(mockT);
      expect(result).toEqual([]);
    });

    test("returns empty array on API error", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Error",
      });

      const result = await getChecklists(mockT);
      expect(result).toEqual([]);
    });
  });

  describe("getAllCheckItems", () => {
    test("returns empty array for invalid input", () => {
      expect(getAllCheckItems(null)).toEqual([]);
      expect(getAllCheckItems(undefined)).toEqual([]);
      expect(getAllCheckItems("invalid")).toEqual([]);
    });

    test("returns empty array for empty checklists", () => {
      expect(getAllCheckItems([])).toEqual([]);
    });

    test("flattens check items from multiple checklists", () => {
      const checklists = [
        {
          id: "cl1",
          name: "Checklist 1",
          checkItems: [
            { id: "item1", name: "Item 1", state: "incomplete" },
            { id: "item2", name: "Item 2", state: "complete" },
          ],
        },
        {
          id: "cl2",
          name: "Checklist 2",
          checkItems: [{ id: "item3", name: "Item 3", state: "incomplete" }],
        },
      ];

      const items = getAllCheckItems(checklists);
      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({
        id: "item1",
        name: "Item 1",
        state: "incomplete",
        checklistId: "cl1",
        checklistName: "Checklist 1",
      });
    });

    test("handles checklists with no checkItems", () => {
      const checklists = [{ id: "cl1", name: "Empty" }];
      expect(getAllCheckItems(checklists)).toEqual([]);
    });
  });

  describe("calculateChecklistEstimate", () => {
    test("returns 0 for empty checklist items", () => {
      expect(calculateChecklistEstimate({}, [])).toBe(0);
    });

    test("sums estimates from all items", () => {
      const timerData = {
        checklistTotals: {
          item1: { estimatedTime: 3600000 },
          item2: { estimatedTime: 1800000 },
        },
      };
      const checklists = [
        {
          id: "cl1",
          checkItems: [
            { id: "item1", name: "A" },
            { id: "item2", name: "B" },
          ],
        },
      ];

      expect(calculateChecklistEstimate(timerData, checklists)).toBe(5400000);
    });

    test("ignores items without estimates", () => {
      const timerData = {
        checklistTotals: {
          item1: { estimatedTime: 3600000 },
          item2: { estimatedTime: null },
        },
      };
      const checklists = [
        {
          id: "cl1",
          checkItems: [
            { id: "item1", name: "A" },
            { id: "item2", name: "B" },
          ],
        },
      ];

      expect(calculateChecklistEstimate(timerData, checklists)).toBe(3600000);
    });
  });

  describe("getEffectiveEstimate", () => {
    const checklists = [
      {
        id: "cl1",
        checkItems: [{ id: "item1", name: "A" }],
      },
    ];

    test("returns manual estimate when set", () => {
      const timerData = {
        manualEstimateSet: true,
        estimatedTime: 7200000,
        checklistTotals: { item1: { estimatedTime: 3600000 } },
      };

      expect(getEffectiveEstimate(timerData, checklists)).toBe(7200000);
    });

    test("returns calculated estimate when manual not set", () => {
      const timerData = {
        manualEstimateSet: false,
        estimatedTime: null,
        checklistTotals: { item1: { estimatedTime: 3600000 } },
      };

      expect(getEffectiveEstimate(timerData, checklists)).toBe(3600000);
    });

    test("returns null when no estimates anywhere", () => {
      const timerData = {
        manualEstimateSet: false,
        checklistTotals: {},
      };

      expect(getEffectiveEstimate(timerData, checklists)).toBe(null);
    });
  });

  describe("getCheckItemData", () => {
    test("returns existing item data", () => {
      const timerData = {
        checklistTotals: {
          item1: {
            estimatedTime: 5000,
            state: TIMER_STATE.RUNNING,
            totalTime: 1000,
          },
        },
      };

      const data = getCheckItemData(timerData, "item1");
      expect(data.estimatedTime).toBe(5000);
      expect(data.state).toBe(TIMER_STATE.RUNNING);
      expect(data.totalTime).toBe(1000);
    });

    test("returns default for missing item", () => {
      const data = getCheckItemData({}, "missing");
      expect(data.state).toBe(TIMER_STATE.IDLE);
      expect(data.totalTime).toBe(0);
    });
  });

  describe("getCheckItemTotalTime", () => {
    test("returns 0 for empty checklistTotals", () => {
      expect(getCheckItemTotalTime({ checklistTotals: {} }, "item1")).toBe(0);
    });

    test("returns totalTime for specific item", () => {
      const timerData = {
        checklistTotals: {
          item1: { totalTime: 3000 },
          item2: { totalTime: 5000 },
        },
      };
      expect(getCheckItemTotalTime(timerData, "item1")).toBe(3000);
    });
  });

  describe("getRunningCheckItem", () => {
    test("returns isRunning false when no items running", () => {
      const timerData = {
        checklistTotals: {
          item1: { state: TIMER_STATE.IDLE },
        },
      };

      const result = getRunningCheckItem(timerData);
      expect(result.isRunning).toBe(false);
      expect(result.itemId).toBeNull();
    });

    test("returns running item ID", () => {
      const timerData = {
        checklistTotals: {
          item1: { state: TIMER_STATE.IDLE },
          item2: { state: TIMER_STATE.RUNNING },
        },
      };

      const result = getRunningCheckItem(timerData);
      expect(result.isRunning).toBe(true);
      expect(result.itemId).toBe("item2");
    });
  });
});
