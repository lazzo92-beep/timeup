/**
 * TimerUI.js
 * Handles the main timer interface (display, start/stop, description)
 */

import { TIMER_STATE } from "../utils/constants.js";
import { formatDuration } from "../utils/formatTime.js";
import TimerService from "../services/TimerService.js";
import StorageService from "../services/StorageService.js";

export class TimerUI {
  constructor(t, elements, options = {}) {
    this.t = t;
    this.elements = elements;
    this.onRefresh = options.onRefresh;
    this.isBusy = false;
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
    if (this.isBusy) return;

    this.isBusy = true;
    if (this.elements.btnToggle) this.elements.btnToggle.disabled = true;

    try {
      const timerData = await StorageService.getTimerData(this.t);
      const isRunning =
        timerData.state === TIMER_STATE.RUNNING && timerData.currentEntry;

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
        await this.onRefresh();
      } else if (!result.success) {
        if (result.data) {
          this.update(result.data);
        }
        alert(`Timer action failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Timer error: ${error.message}`);
    } finally {
      this.isBusy = false;
      if (this.elements.btnToggle) this.elements.btnToggle.disabled = false;
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
