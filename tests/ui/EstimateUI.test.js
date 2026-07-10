/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const mockTimerService = {
  setEstimate: jest.fn(),
};
const mockChecklistService = {
  getEffectiveEstimate: jest.fn(),
};

jest.unstable_mockModule("../../src/services/TimerService.js", () => ({
  default: mockTimerService,
}));
jest.unstable_mockModule("../../src/services/ChecklistService.js", () => ({
  default: mockChecklistService,
}));

const { EstimateUI } = await import("../../src/ui/EstimateUI.js");
const { default: TimerService } =
  await import("../../src/services/TimerService.js");
const { default: ChecklistService } =
  await import("../../src/services/ChecklistService.js");

describe("EstimateUI", () => {
  let t;
  let elements;
  let estimateUI;

  beforeEach(() => {
    t = {};
    document.body.innerHTML = `
            <div id="row">
                <input id="input" />
                <button id="btnSet"></button>
                <button id="btnClear"></button>
                <span id="display"></span>
                <div id="progress"></div>
                <span id="remaining"></span>
            </div>
        `;

    elements = {
      row: document.getElementById("row"),
      input: document.getElementById("input"),
      btnSet: document.getElementById("btnSet"),
      btnClear: document.getElementById("btnClear"),
      display: document.getElementById("display"),
      progressBar: document.getElementById("progress"),
      progressFill: document.createElement("div"), // detached but ok
      remaining: document.getElementById("remaining"),
    };
    elements.progressBar.appendChild(elements.progressFill);

    jest.clearAllMocks();
    window.alert = jest.fn();

    const mockTimePicker = {
      show: jest.fn(),
    };
    estimateUI = new EstimateUI(t, elements, { timePicker: mockTimePicker });
  });

  test("handles set estimate click", async () => {
    elements.input.value = "2h";
    TimerService.setEstimate.mockResolvedValue({ success: true });

    elements.btnSet.click();

    // 2h = 7200000ms
    expect(TimerService.setEstimate).toHaveBeenCalledWith(t, 7200000);
  });

  test("handles enter key", async () => {
    elements.input.value = "30m";
    TimerService.setEstimate.mockResolvedValue({ success: true });

    const keyEvent = new KeyboardEvent("keydown", { key: "Enter" });
    elements.input.dispatchEvent(keyEvent);

    // Dispatch blur manually as JSDOM doesn't always trigger it from .blur() in same event loop
    const blurEvent = new Event("blur");
    elements.input.dispatchEvent(blurEvent);

    expect(TimerService.setEstimate).toHaveBeenCalledWith(t, 1800000);
  });

  test("handles invalid input", async () => {
    elements.input.value = "invalid";
    elements.btnSet.click();

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("Invalid time format"),
    );
    expect(TimerService.setEstimate).not.toHaveBeenCalled();
  });

  test("handles clear estimate", async () => {
    TimerService.setEstimate.mockResolvedValue({ success: true });
    elements.btnClear.click();
    expect(TimerService.setEstimate).toHaveBeenCalledWith(t, null);
  });

  test("update shows progress bar when estimate exists", () => {
    const timerData = {
      manualEstimateSet: true,
      estimatedTime: 3600000,
      entries: [],
    };
    ChecklistService.getEffectiveEstimate.mockReturnValue(3600000);

    estimateUI.update(timerData);

    expect(elements.progressBar.hidden).toBe(false);
    expect(elements.display.textContent).toBe("1h 0m");
  });

  test("update hides progress bar when no estimate", () => {
    const timerData = { entries: [] };
    ChecklistService.getEffectiveEstimate.mockReturnValue(0);

    estimateUI.update(timerData);

    expect(elements.progressBar.hidden).toBe(true);
  });
});
