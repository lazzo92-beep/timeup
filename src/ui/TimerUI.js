/**
 * TimerUI.js
 * Handles the main timer interface (display, start/stop, description)
 */

import { TIMER_STATE } from "../utils/constants.js";
import { formatDuration } from "../utils/formatTime.js";
import TimerService from "../services/TimerService.js";

export class TimerUI {
  constructor(t, elements, options = {}) {
    this.t = t;
    this.elements = elements;
    this.onRefresh = options.onRefresh;
    // Expected elements:
    // display, btnToggle, btnText, iconPlay, iconStop, description, total,
    // storageStatus, storageFill, storageText

    this._initListeners();
  }

  _initListeners() {
    if (this.elements.btnToggle) {
      this.elements.btnToggle.addEventListener("click", () =>
        this._handleToggle(),
      );
    }
  }

  async _handleToggle() {
    const isRunning = this.elements.btnToggle.classList.contains(
      "btn-toggle--running",
    );
    try {
      let result;
      if (isRunning) {
        const description = this.elements.description.value.trim();
        result = await TimerService.stopTimer(this.t, description);
        if (result.success) {
          this.elements.description.value = "";
        }
      } else {
        result = await TimerService.startTimer(this.t);
      }

      if (result.success && this.onRefresh) {
        this.onRefresh();
      } else if (!result.success) {
        alert(`Timer action failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Timer error: ${error.message}`);
    }
  }

  update(timerData) {
    const isRunning = timerData.state === TIMER_STATE.RUNNING;
    const elapsed = TimerService.getCurrentElapsed(timerData);

    // Update Display
    this.elements.display.textContent = formatDuration(elapsed);
    this.elements.display.className = `timer-display timer-display--${isRunning ? "running" : "idle"}`;

    // Update Total
    if (this.elements.total) {
      const totalMs = timerData.totalTime || 0;
      this.elements.total.textContent = `Total: ${formatDuration(totalMs + (isRunning ? elapsed : 0), { compact: true })}`;
    }

    // Update Buttons
    this.elements.btnText.textContent = isRunning ? "Stop" : "Start";
    this.elements.btnToggle.className = `btn-toggle${isRunning ? " btn-toggle--running" : ""}`;
    this.elements.btnToggle.title = isRunning ? "Stop Timer" : "Start Timer";

    this.elements.iconPlay.hidden = isRunning;
    this.elements.iconStop.hidden = !isRunning;

    // Update Description
    this.elements.description.hidden = !isRunning;
    if (isRunning && timerData.currentEntry) {
      if (document.activeElement !== this.elements.description) {
        this.elements.description.value =
          timerData.currentEntry.description || "";
      }
    }
  }
}
