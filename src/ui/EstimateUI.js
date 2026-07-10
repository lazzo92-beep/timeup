/**
 * EstimateUI.js
 * Handles estimate input, setting manual values, and displaying project status
 */

import {
  formatDuration,
  parseTimeString,
  getRemainingTime,
} from "../utils/formatTime.js";
import TimerService from "../services/TimerService.js";
import ChecklistService from "../services/ChecklistService.js";
import { TimePickerUI } from "./TimePickerUI.js";

export class EstimateUI {
  constructor(t, elements, options = {}) {
    this.t = t;
    this.elements = elements;
    this.onRefresh = options.onRefresh;
    // Expected: row, input, btnSet, btnClear, display, progressBar, progressFill, remaining

    this.cachedChecklists = [];
    this.timePicker = options.timePicker;

    this._initListeners();
  }

  _initListeners() {
    if (this.elements.btnSet) {
      this.elements.btnSet.addEventListener("click", () => this._handleSet());
    }
    if (this.elements.btnClear) {
      this.elements.btnClear.addEventListener("click", () =>
        this._handleClear(),
      );
    }
    if (this.elements.input) {
      this.elements.input.addEventListener("click", (e) => {
        this.timePicker.show(this.elements.input, (ms) => {
          this.elements.input.value = formatDuration(ms, { compact: true });
          this._handleSet(); // Auto-save after picker
        });
      });
      this.elements.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.target.blur(); // Let blur/click actions handle it or just set
          e.preventDefault();
        }
      });
      this.elements.input.addEventListener("blur", () => this._handleSet());
    }
  }

  setChecklists(checklists) {
    this.cachedChecklists = checklists || [];
  }

  async _handleSet() {
    const value = this.elements.input.value.trim();
    const ms = parseTimeString(value);
    if (ms) {
      const result = await TimerService.setEstimate(this.t, ms);
      if (result.success && this.onRefresh) {
        this.onRefresh();
      } else if (!result.success) {
        alert(`Failed to set estimate: ${result.error}`);
      }
    } else if (value) {
      alert('Invalid time format. Try "2h" or "30m".');
    }
  }

  async _handleClear() {
    const result = await TimerService.setEstimate(this.t, null); // Clear manual override
    if (result.success && this.onRefresh) {
      this.onRefresh();
    } else if (!result.success) {
      alert(`Failed to clear estimate: ${result.error}`);
    }
  }

  update(timerData) {
    // Calculate effective estimate
    const effectiveEstimate = ChecklistService.getEffectiveEstimate(
      timerData,
      this.cachedChecklists,
    );
    const hasEstimate = effectiveEstimate && effectiveEstimate > 0;
    const hasManual =
      timerData.manualEstimateSet && timerData.estimatedTime > 0;

    // Visibility
    this.elements.display.hidden = !hasEstimate;
    this.elements.progressBar.hidden = !hasEstimate;
    this.elements.remaining.hidden = !hasEstimate;
    this.elements.btnClear.hidden = !hasManual;

    if (hasEstimate) {
      this.elements.display.textContent = formatDuration(effectiveEstimate, {
        compact: true,
        showSeconds: false,
      });

      // Progress Logic
      const remainingInfo = getRemainingTime(
        timerData.totalTime || 0,
        effectiveEstimate,
      );
      if (remainingInfo) {
        this._renderProgress(remainingInfo);
      }
    }
  }

  _renderProgress(info) {
    const fill = this.elements.progressFill;
    const text = this.elements.remaining;

    fill.style.width = `${info.percentComplete}%`;

    // Reset classes
    fill.className = "progress-bar__fill";
    text.className = "timer-remaining";

    if (info.isOverBudget) {
      fill.classList.add("progress-bar__fill--over");
      text.classList.add("timer-remaining--over");
      text.textContent = `${formatDuration(Math.abs(info.remaining), { compact: true, showSeconds: false })} over`;
    } else if (info.percentComplete >= 80) {
      fill.classList.add("progress-bar__fill--warning");
      text.classList.add("timer-remaining--warning");
      text.textContent = `${formatDuration(info.remaining, { compact: true, showSeconds: false })} left`;
    } else {
      text.textContent = `${formatDuration(info.remaining, { compact: true, showSeconds: false })} left`;
    }
  }
}
