/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { TIMER_STATE } from "../../src/utils/constants.js";

// Define mock
const mockTimerService = {
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  getCurrentElapsed: jest.fn(),
};

jest.unstable_mockModule("../../src/services/TimerService.js", () => ({
  default: mockTimerService,
}));

// Import after mock
const { TimerUI } = await import("../../src/ui/TimerUI.js");
const { default: TimerService } =
  await import("../../src/services/TimerService.js");

describe("TimerUI", () => {
  let t;
  let elements;
  let timerUI;

  beforeEach(() => {
    // Mock Trello client
    t = {
      sizeTo: jest.fn(),
    };

    // Mock DOM elements
    document.body.innerHTML = `
            <div id="display">00:00</div>
            <button id="btn-toggle"></button>
            <span id="btn-text"></span>
            <span id="icon-play"></span>
            <span id="icon-stop"></span>
            <input id="description" />
        `;

    elements = {
      display: document.getElementById("display"),
      btnToggle: document.getElementById("btn-toggle"),
      btnText: document.getElementById("btn-text"),
      iconPlay: document.getElementById("icon-play"),
      iconStop: document.getElementById("icon-stop"),
      description: document.getElementById("description"),
    };

    // Clear mocks
    jest.clearAllMocks();

    // Initialize UI
    timerUI = new TimerUI(t, elements);
  });

  test("update renders idle state correctly", () => {
    const timerData = { state: TIMER_STATE.IDLE };
    TimerService.getCurrentElapsed.mockReturnValue(0);

    timerUI.update(timerData);

    expect(elements.display.textContent).toBe("00:00:00"); // formatDuration puts 00:00:00
    expect(elements.btnText.textContent).toBe("Start");
    expect(elements.btnToggle.className).not.toContain("running");
    expect(elements.iconPlay.hidden).toBe(false);
    expect(elements.iconStop.hidden).toBe(true);
    expect(elements.description.hidden).toBe(true);
  });

  test("update renders running state correctly", () => {
    const timerData = {
      state: TIMER_STATE.RUNNING,
      currentEntry: { description: "Test Task" },
    };
    TimerService.getCurrentElapsed.mockReturnValue(10000); // 10s

    timerUI.update(timerData);

    expect(elements.display.textContent).toBe("00:00:10");
    expect(elements.btnText.textContent).toBe("Stop");
    expect(elements.btnToggle.className).toContain("running");
    expect(elements.iconPlay.hidden).toBe(true);
    expect(elements.iconStop.hidden).toBe(false);
    expect(elements.description.hidden).toBe(false);
    expect(elements.description.value).toBe("Test Task");
  });

  test("clicking toggle calls startTimer when idle", async () => {
    // Setup initial state (idle)
    elements.btnToggle.classList.remove("btn-toggle--running");
    TimerService.startTimer.mockResolvedValue({ success: true });

    // Click
    elements.btnToggle.click();

    expect(TimerService.startTimer).toHaveBeenCalledWith(t);
  });

  test("clicking toggle calls stopTimer when running", async () => {
    // Setup initial state (running)
    elements.btnToggle.classList.add("btn-toggle--running");
    elements.description.value = "My Description";
    TimerService.stopTimer.mockResolvedValue({ success: true });

    // Click
    elements.btnToggle.click();

    expect(TimerService.stopTimer).toHaveBeenCalledWith(t, "My Description");
  });

  test("alerts on timer error", async () => {
    window.alert = jest.fn();
    elements.btnToggle.classList.remove("btn-toggle--running");
    TimerService.startTimer.mockResolvedValue({
      success: false,
      error: "Fail",
    });

    await timerUI._handleToggle();

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining("Timer action failed"),
    );
  });
});
