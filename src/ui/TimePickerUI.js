/**
 * TimePickerUI.js
 * A popover component for selecting time durations (presets + sliders)
 */

import { formatDuration, parseTimeString } from "../utils/formatTime.js";

export class TimePickerUI {
  constructor({ containerId, onSelect, onClose }) {
    this.container = document.getElementById(containerId);
    this.onSelect = onSelect;
    this.onClose = onClose;
    this.targetInput = null;

    this.state = {
      hours: 0,
      minutes: 0,
    };

    if (this.container) {
      this._ensureRender();
    }
  }

  _ensureRender() {
    // Prevent double rendering if already initialized
    if (this.container.querySelector(".time-picker__content")) {
      this._attachGlobalListener();
      return;
    }

    this.container.innerHTML = `
            <div class="time-picker__overlay" data-action="close"></div>
            <div class="time-picker__content">
                <div class="time-picker__header">
                    <span class="time-picker__title">Set Duration</span>
                    <button class="time-picker__close" data-action="close">×</button>
                </div>

                <div class="time-picker__manual">
                    <input type="text" id="tp-manual-input" class="time-picker__manual-input" placeholder="e.g. 7:00, 1h 30m, 45m" autocomplete="off">
                    <span class="time-picker__manual-hint">Format: MM:SS, HH:MM:SS, or 1h 30m</span>
                </div>

                <div class="time-picker__presets">
                    <button class="btn-preset" data-action="preset" data-value="5m">5m</button>
                    <button class="btn-preset" data-action="preset" data-value="15m">15m</button>
                    <button class="btn-preset" data-action="preset" data-value="30m">30m</button>
                    <button class="btn-preset" data-action="preset" data-value="1h">1h</button>
                </div>

                <div class="time-picker__sliders">
                    <div class="time-picker__row">
                        <label>Hours <span class="time-picker__val" id="tp-hours-val">0h</span></label>
                        <input type="range" min="0" max="12" step="0.5" id="tp-hours-range" data-action="slider-h">
                    </div>
                    <div class="time-picker__row">
                        <label>Minutes <span class="time-picker__val" id="tp-mins-val">0m</span></label>
                        <input type="range" min="0" max="59" step="1" id="tp-mins-range" data-action="slider-m">
                    </div>
                </div>

                <div class="time-picker__actions">
                    <button class="btn-apply" id="tp-apply" data-action="apply">Set Duration</button>
                </div>
            </div>
        `;

    this._attachGlobalListener();
  }

  _attachGlobalListener() {
    // Use single listener for robustness
    this.container.onclick = (e) => {
      const target = e.target;
      const actionBtn = target.closest("[data-action]");
      const action = actionBtn ? actionBtn.dataset.action : null;

      if (action === "close") {
        this.hide();
      } else if (action === "preset") {
        const ms = parseTimeString(actionBtn.dataset.value);
        this._updateStateFromMs(ms);
        this._updateManualInput();
        this._updateInput();
      } else if (action === "apply") {
        this._handleApply();
      }
    };

    // Input listeners for sliders
    const hRange = this.container.querySelector("#tp-hours-range");
    const mRange = this.container.querySelector("#tp-mins-range");
    const manualInput = this.container.querySelector("#tp-manual-input");

    hRange.oninput = (e) => {
      this.state.hours = parseFloat(e.target.value);
      this.container.querySelector("#tp-hours-val").textContent =
        `${this.state.hours}h`;
      this._updateManualInput();
      this._updateInput();
    };

    mRange.oninput = (e) => {
      this.state.minutes = parseInt(e.target.value, 10);
      this.container.querySelector("#tp-mins-val").textContent =
        `${this.state.minutes}m`;
      this._updateManualInput();
      this._updateInput();
    };

    // Manual input listener
    manualInput.oninput = (e) => {
      const ms = parseTimeString(e.target.value);
      if (ms !== null && ms >= 0) {
        this._updateStateFromMs(ms);
      }
    };

    // Apply on Enter key in manual input
    manualInput.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this._handleApply();
      }
    };
  }

  _handleApply() {
    const ms = this.state.hours * 3600000 + this.state.minutes * 60000;
    if (this.currentSelectCallback) {
      this.currentSelectCallback(ms, this.targetInput);
    } else if (this.onSelect) {
      this.onSelect(ms, this.targetInput);
    }
    this.hide();
  }

  _updateStateFromMs(ms) {
    if (!ms && ms !== 0) return;

    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    this.state.hours = hours;
    this.state.minutes = minutes;

    // Update DOM
    const hRange = this.container.querySelector("#tp-hours-range");
    const mRange = this.container.querySelector("#tp-mins-range");

    if (hRange) hRange.value = this.state.hours;
    if (mRange) mRange.value = this.state.minutes;

    const hVal = this.container.querySelector("#tp-hours-val");
    const mVal = this.container.querySelector("#tp-mins-val");
    if (hVal) hVal.textContent = `${this.state.hours}h`;
    if (mVal) mVal.textContent = `${this.state.minutes}m`;
  }

  _updateManualInput() {
    const manualInput = this.container.querySelector("#tp-manual-input");
    if (!manualInput) return;
    // Don't update if user is actively typing
    if (document.activeElement === manualInput) return;
    const h = this.state.hours > 0 ? `${this.state.hours}h ` : "";
    const m = `${this.state.minutes}m`;
    manualInput.value = (h + m).trim();
  }

  _updateInput() {
    if (!this.targetInput) return;
    const h = this.state.hours > 0 ? `${this.state.hours}h ` : "";
    const m = `${this.state.minutes}m`;
    this.targetInput.value = (h + m).trim();
  }

  show(targetInput, onSelect) {
    this.targetInput = targetInput;
    this.currentSelectCallback = onSelect;
    this.container.style.display = "flex";
    this.container.hidden = false;

    const currentMs = parseTimeString(targetInput.value);
    this._updateStateFromMs(currentMs || 0);
  }

  hide() {
    if (this.container) {
      this.container.style.display = "none";
      this.container.hidden = true;
    }
    if (this.onClose) this.onClose();
  }
}
