/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { ChecklistUI } from "../../src/ui/ChecklistUI.js";
import TimerService from "../../src/services/TimerService.js";
import { TIMER_STATE } from "../../src/utils/constants.js";

// Mock Utils
jest.mock("../../src/utils/formatTime.js", () => ({
  formatDuration: (ms) => {
    if (ms === 3600000) return "1h";
    if (ms === 1800000) return "30m";
    if (ms === 60000) return "1m";
    if (ms === 120000) return "2m";
    return "0m";
  },
  parseTimeString: () => 0,
}));

describe("ChecklistUI", () => {
  let container;
  let tMock;
  let checklistUI;

  beforeEach(() => {
    document.body.innerHTML = '<div id="checklists-container"></div>';
    container = document.getElementById("checklists-container");
    tMock = {
      t: "mock",
    };
    const mockTimePicker = {
      show: jest.fn(),
    };
    checklistUI = new ChecklistUI(tMock, "checklists-container", {
      onRefresh: jest.fn(),
      timePicker: mockTimePicker,
    });
  });

  test("should be able to keep focus during second render if structure is same (Smart Render)", () => {
    const checklists = [
      {
        id: "cl1",
        checkItems: [{ id: "item1", name: "Task 1", state: "incomplete" }],
      },
    ];
    const timerData = {};

    // First render - full
    checklistUI.render(timerData, checklists);
    const estInput = container.querySelector('input[data-action="estimate"]');

    // Track if element is replaced
    const firstInput = estInput;

    // Second render - should be smart
    checklistUI.render(timerData, checklists);
    const secondInput = container.querySelector(
      'input[data-action="estimate"]',
    );

    expect(firstInput).toBe(secondInput); // Same DOM node preserved
  });

  test("should update live progress without full re-render", () => {
    const checklists = [
      {
        id: "cl1",
        checkItems: [{ id: "item1", name: "Task 1", state: "incomplete" }],
      },
    ];
    const timerData1 = {
      checklistTotals: { item1: { state: TIMER_STATE.IDLE, totalTime: 0 } },
    };
    const timerData2 = {
      checklistTotals: { item1: { state: TIMER_STATE.IDLE, totalTime: 60000 } },
    };

    checklistUI.render(timerData1, checklists);
    const timeValue = container.querySelector(".item-time-value");
    expect(timeValue.textContent).toBe("0m 0s");

    // "Smart" update
    checklistUI.render(timerData2, checklists);
    expect(timeValue.textContent).toBe("1m 0s");
  });

  test("should render nothing if no checklists provided", () => {
    checklistUI.render({}, []);
    expect(container.hidden).toBe(true);
    expect(container.innerHTML).toBe("");
  });

  test("should render Control Panel table structure", () => {
    const checklists = [
      {
        id: "cl1",
        name: "Project Plan",
        checkItems: [{ id: "item1", name: "Task 1", state: "incomplete" }],
      },
    ];
    const timerData = {};

    checklistUI.render(timerData, checklists);

    expect(container.hidden).toBe(false);
    expect(container.querySelector(".checklist-panel")).not.toBeNull();
    expect(container.querySelector(".checklist-table")).not.toBeNull();
    // Check headers
    expect(container.textContent).toContain("Estimate");
    expect(container.textContent).toContain("Tracked");
  });

  test("should highlight running items", () => {
    const checklists = [
      {
        id: "cl1",
        checkItems: [
          { id: "item1", name: "Running Task", state: "incomplete" },
        ],
      },
    ];

    const timerData = {
      checklistTotals: {
        item1: { state: TIMER_STATE.RUNNING, totalTime: 0 },
      },
    };

    checklistUI.render(timerData, checklists);

    const row = container.querySelector(".checklist-row");
    expect(row.classList).toContain("checklist-row--running");
    expect(row.querySelector(".btn-item-toggle--running")).not.toBeNull();
  });

  test("should show estimate and total time", () => {
    const checklists = [
      {
        id: "cl1",
        checkItems: [
          { id: "item1", name: "Estimated Task", state: "incomplete" },
        ],
      },
    ];

    const timerData = {
      checklistTotals: {
        item1: {
          totalTime: 1800000, // 30m
          estimatedTime: 3600000, // 1h
        },
      },
    };

    checklistUI.render(timerData, checklists);

    // Scope to the row to avoid selecting the header
    const row = container.querySelector(".checklist-row");
    const estInput = row.querySelector('input[data-action="estimate"]');
    const timeDiv = row.querySelector(".col-time");

    expect(estInput.getAttribute("value")).toBe("1h 0m");
    expect(timeDiv.textContent.trim()).toBe("30m 0s");
  });

  test("should mark over-budget items", () => {
    const checklists = [
      {
        id: "cl1",
        checkItems: [{ id: "item1", name: "Over Task", state: "incomplete" }],
      },
    ];

    const timerData = {
      checklistTotals: {
        item1: {
          totalTime: 120000,
          estimatedTime: 60000,
        },
      },
    };

    checklistUI.render(timerData, checklists);

    const row = container.querySelector(".checklist-row");
    const timeDiv = row.querySelector(".col-time");

    expect(row.classList).toContain("checklist-row--over");
    expect(timeDiv.classList).toContain("text-over");
  });
});
