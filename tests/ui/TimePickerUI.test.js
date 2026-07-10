/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { TimePickerUI } from "../../src/ui/TimePickerUI.js";

describe("TimePickerUI", () => {
  let container;
  let input;
  let timePicker;
  let onSelectMock;
  let onCloseMock;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
            <div id="time-picker-container" hidden></div>
            <input id="estimate-input" type="text" />
        `;
    container = document.getElementById("time-picker-container");
    input = document.getElementById("estimate-input");

    onSelectMock = jest.fn();
    onCloseMock = jest.fn();

    timePicker = new TimePickerUI({
      containerId: "time-picker-container",
      onSelect: onSelectMock,
      onClose: onCloseMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("should be hidden by default", () => {
    // The container itself starts hidden in HTML
    expect(container.hidden).toBe(true);
  });

  test("should show when show() is called", () => {
    timePicker.show(input);
    expect(container.hidden).toBe(false);
    expect(timePicker.targetInput).toBe(input);
  });

  test("should hide when close button is clicked", () => {
    timePicker.show(input);
    const closeBtn = container.querySelector(".time-picker__close");
    closeBtn.click();

    expect(container.hidden).toBe(true);
    expect(onCloseMock).toHaveBeenCalled();
  });

  test("should hide when overlay is clicked", () => {
    timePicker.show(input);
    const overlay = container.querySelector(".time-picker__overlay");
    overlay.click();

    expect(container.hidden).toBe(true);
    expect(onCloseMock).toHaveBeenCalled();
  });

  test("should call onSelect and hide when Apply is clicked", () => {
    timePicker.show(input);

    // Simulate setting time: 1h 30m
    // We need to manually trigger input events on sliders because
    // programmatic .value change doesn't trigger 'input' event
    const hRange = container.querySelector("#tp-hours-range");
    const mRange = container.querySelector("#tp-mins-range");

    hRange.value = 1;
    hRange.dispatchEvent(new Event("input"));

    mRange.value = 30;
    mRange.dispatchEvent(new Event("input"));

    const applyBtn = container.querySelector("#tp-apply");
    applyBtn.click();

    expect(onSelectMock).toHaveBeenCalledWith(5400000, input); // 1.5 hours in ms
    expect(container.hidden).toBe(true);
  });

  test("should update input from presets", () => {
    timePicker.show(input);

    const preset5m = container.querySelector('[data-value="5m"]');
    preset5m.click(); // Should update internal state

    // Check input value (TimePicker updates targetInput.value live)
    expect(input.value).toBe("5m");
  });
});
