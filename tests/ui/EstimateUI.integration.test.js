/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { EstimateUI } from "../../src/ui/EstimateUI.js";
import TimerService from "../../src/services/TimerService.js";
import { TimePickerUI } from "../../src/ui/TimePickerUI.js";

// Mock TimerService
jest.mock("../../src/services/TimerService.js");

describe("EstimateUI Integration", () => {
  let tMock;
  let elements;
  let estimateUI;
  let timePicker;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
            <div id="estimate-row">
                <input id="estimate-input" type="text" />
                <button id="btn-set-estimate">Set</button>
                <button id="btn-clear-estimate">Clear</button>
                <span id="estimate-display"></span>
                <div id="progress-bar">
                    <div id="progress-fill"></div>
                </div>
                <span id="remaining"></span>
            </div>
            <div id="time-picker-container" hidden></div>
        `;

    elements = {
      row: document.getElementById("estimate-row"),
      input: document.getElementById("estimate-input"),
      btnSet: document.getElementById("btn-set-estimate"),
      btnClear: document.getElementById("btn-clear-estimate"),
      display: document.getElementById("estimate-display"),
      progressBar: document.getElementById("progress-bar"),
      progressFill: document.getElementById("progress-fill"),
      remaining: document.getElementById("remaining"),
    };

    tMock = {
      set: jest.fn(),
      get: jest.fn(),
    };

    // Setup Service Mocks
    TimerService.setEstimate = jest.fn();

    timePicker = new TimePickerUI({ containerId: "time-picker-container" });
    estimateUI = new EstimateUI(tMock, elements, { timePicker });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("should initialize TimePickerUI", () => {
    expect(estimateUI.timePicker).toBeDefined();
    // Container should exist and be hidden
    const pickerContainer = document.getElementById("time-picker-container");
    expect(pickerContainer.hidden).toBe(true);
  });

  test("should open TimePicker when input is clicked", () => {
    const pickerContainer = document.getElementById("time-picker-container");

    // Ensure show is not called immediately
    expect(pickerContainer.hidden).toBe(true);

    // Click Input
    elements.input.click();

    // Should be visible
    expect(pickerContainer.hidden).toBe(false);
  });

  test("should call TimerService.setEstimate when Set is clicked", async () => {
    elements.input.value = "2h";
    TimerService.setEstimate.mockResolvedValue({ success: true });

    elements.btnSet.click();

    // Wait for async handler
    await new Promise(process.nextTick);

    expect(TimerService.setEstimate).toHaveBeenCalledWith(tMock, 7200000);
  });
});
