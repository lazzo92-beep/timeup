/**
 * ChecklistUI.js
 * Handles rendering of checklists with embedded timer controls
 */

import { TIMER_STATE } from "../utils/constants.js";
import { formatDuration, parseTimeString } from "../utils/formatTime.js";
import TimerService from "../services/TimerService.js";

export class ChecklistUI {
  constructor(t, containerId, { onRefresh, timePicker }) {
    this.t = t;
    this.container = document.getElementById(containerId);
    this.onRefresh = onRefresh;
    this.timePicker = timePicker;

    // Track rendered IDs to avoid expensive DOM trashing if possible
    // But for "Gold Standard" readability, we'll start with full re-render
    // unless performance dictates otherwise.
  }

  // Main render loop
  render(timerData, checklists) {
    if (!checklists || checklists.length === 0) {
      this.container.hidden = true;
      this.container.innerHTML = "";
      return;
    }

    // Check if we already have the same structure to avoid trashing focus
    const currentItemCount =
      this.container.querySelectorAll(".checklist-row").length;
    const newItemCount = checklists.reduce(
      (acc, cl) => acc + (cl.checkItems?.length || 0),
      0,
    );
    // Only re-render if structure changed or container is empty
    if (this.container.innerHTML === "" || currentItemCount !== newItemCount) {
      this.container.hidden = false;
      const html = checklists
        .map((cl) => this._renderChecklist(cl, timerData))
        .join("");
      this.container.innerHTML = html;
      this._attachListeners();
    } else {
      // Just update dynamic states (running colors, etc.) without trashing innerHTML
      this.updateLiveProgress(timerData);
    }
  }

  _renderChecklist(checklist, timerData) {
    if (!checklist.checkItems || checklist.checkItems.length === 0) return "";

    const itemsHtml = checklist.checkItems
      .map((item) => this._renderItem(item, timerData))
      .join("");

    if (!itemsHtml) return "";

    return `
      <div class="checklist-panel">
        <div class="checklist-panel__header">
          <div class="checklist-panel__title-group">
            <svg class="icon-checklist" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span class="checklist-panel__title">${this._escape(checklist.name)}</span>
          </div>
          <div class="checklist-panel__cols">
            <span class="col-header col-est">Estimate</span>
            <span class="col-header col-time">Tracked</span>
          </div>
        </div>
        <div class="checklist-table">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  _renderItem(item, timerData) {
    const itemData = timerData.checklistTotals?.[item.id];
    const isRunning = itemData?.state === TIMER_STATE.RUNNING;
    let totalTime = itemData?.totalTime || 0;

    if (isRunning && itemData) {
      totalTime += TimerService.getItemCurrentElapsed(itemData);
    }

    // Progress
    const estimate = itemData?.estimatedTime || 0;
    const isOver = estimate > 0 && totalTime > estimate;
    const progressPercent =
      estimate > 0
        ? Math.min(100, Math.floor((totalTime / estimate) * 100))
        : 0;

    const rowClasses = ["checklist-row"];
    if (isRunning) rowClasses.push("checklist-row--running");
    if (isOver) rowClasses.push("checklist-row--over");

    const icon = isRunning
      ? '<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>' // stop
      : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'; // play

    return `
      <div class="${rowClasses.join(" ")}" data-id="${item.id}">
        <div class="col-action">
          <button class="btn-item-toggle ${isRunning ? "btn-item-toggle--running" : ""}"
                  data-action="toggle" data-id="${item.id}"
                  title="${isRunning ? "Stop task timer" : "Start task timer"}">
            ${icon}
          </button>
        </div>
        <div class="col-task">
          <div class="task-name" title="${this._escape(item.name)}">${this._escape(item.name)}</div>
          <div class="progress-bar progress-bar--item" ${estimate > 0 ? "" : 'style="display:none"'} id="progress-bar-${item.id}">
            <div class="progress-bar__fill ${isOver ? "progress-bar__fill--over" : ""} item-progress-fill"
                 style="width: ${progressPercent}%" id="progress-fill-${item.id}"></div>
</div>
          ${isRunning ? '<span class="status-badge status-badge--running">Running</span>' : ""}
          ${isOver ? '<span class="status-badge status-badge--over">Over</span>' : ""}
        </div>
        <div class="col-est">
          <div class="input-wrapper">
            <input type="text" class="input-tiny"
                  value="${estimate > 0 ? formatDuration(estimate, { compact: true, showSeconds: false }) : ""}"
                  placeholder="-"
                  data-action="estimate" data-id="${item.id}">
          </div>
        </div>
        <div class="col-time ${isOver ? "text-over" : ""}">
          <span class="time-value item-time-value" id="time-value-${item.id}">${formatDuration(totalTime, { compact: true })}</span>
        </div>
      </div>
    `;
  }

  updateLiveProgress(timerData) {
    const active = document.activeElement;
    // Iterate over all checklist rows in DOM
    this.container.querySelectorAll(".checklist-row").forEach((row) => {
      const itemId = row.dataset.id;
      const itemData = timerData.checklistTotals?.[itemId];
      const isRunning = itemData?.state === TIMER_STATE.RUNNING;

      // Use totalTime from checklistTotals directly
      let totalTime = itemData?.totalTime || 0;
      if (isRunning && itemData) {
        totalTime += TimerService.getItemCurrentElapsed(itemData);
      }

      const estimate = itemData?.estimatedTime || 0;
      const isOver = estimate > 0 && totalTime > estimate;
      const progressPercent =
        estimate > 0
          ? Math.min(100, Math.floor((totalTime / estimate) * 100))
          : 0;

      // 1. Update Tracked Time
      const timeSpan = row.querySelector(".item-time-value");
      if (timeSpan) {
        const newTime = formatDuration(totalTime, { compact: true });
        if (timeSpan.textContent !== newTime) {
          timeSpan.textContent = newTime;
        }
      }

      // 2. Update Progress Bar
      const progressFill = row.querySelector(".item-progress-fill");
      const progressBar = row.querySelector(".progress-bar--item");
      if (progressBar) {
        progressBar.style.display = estimate > 0 ? "block" : "none";
      }
      if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
        progressFill.classList.toggle("progress-bar__fill--over", isOver);
      }

      // 3. Update Row States (running class)
      row.classList.toggle("checklist-row--running", isRunning);
      row.classList.toggle("checklist-row--over", isOver);

      // 4. Update Badge and Toggle Button only if changed to avoid unnecessary thrashing
      const toggleBtn = row.querySelector(".btn-item-toggle");
      if (toggleBtn) {
        const wasRunning = toggleBtn.classList.contains(
          "btn-item-toggle--running",
        );
        if (wasRunning !== isRunning) {
          toggleBtn.classList.toggle("btn-item-toggle--running", isRunning);
          toggleBtn.innerHTML = isRunning
            ? '<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
          // Also toggle badge visibility by just finding it or we skip for now as badge might be better managed by a total render
          // but we can try to find and update
          const taskCol = row.querySelector(".col-task");
          if (taskCol) {
            let runningBadge = taskCol.querySelector(".status-badge--running");
            if (isRunning && !runningBadge) {
              const badge = document.createElement("span");
              badge.className = "status-badge status-badge--running";
              badge.textContent = "Running";
              taskCol.appendChild(badge);
            } else if (!isRunning && runningBadge) {
              runningBadge.remove();
            }
          }
        }
      }

      // Update Over Budget badge
      const taskCol = row.querySelector(".col-task");
      if (taskCol) {
        let overBadge = taskCol.querySelector(".status-badge--over");
        if (isOver && !overBadge) {
          const badge = document.createElement("span");
          badge.className = "status-badge status-badge--over";
          badge.textContent = "Over";
          taskCol.appendChild(badge);
        } else if (!isOver && overBadge) {
          overBadge.remove();
        }
      }

      // 5. Update Estimate Input only if it's NOT focused
      const estInput = row.querySelector('[data-action="estimate"]');
      if (estInput && estInput !== active) {
        const estValue =
          estimate > 0
            ? formatDuration(estimate, { compact: true, showSeconds: false })
            : "";
        if (estInput.value !== estValue) {
          estInput.value = estValue;
        }
      }
    });
  }

  _attachListeners() {
    // Delegate events for efficiency
    this.container.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this._handleToggle(e.currentTarget.dataset.id),
      );
    });

    this.container
      .querySelectorAll('[data-action="estimate"]')
      .forEach((input) => {
        input.addEventListener("click", () => {
          this.timePicker.show(input, (ms) => {
            input.value = formatDuration(ms, { compact: true });
            this._handleEstimate(input.dataset.id, input.value);
          });
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.target.blur();
          }
        });
        // Keep blur for when user clicks away from input (manual typing)
        input.addEventListener("blur", (e) =>
          this._handleEstimate(e.target.dataset.id, e.target.value),
        );
      });
  }

  async _handleToggle(itemId) {
    // We need to know current state. We could pass it, or just try stop/start logic in Service
    // Ideally we check state first.
    // For now, let's optimize by asking the Service "toggle this" if it supports it,
    // or we need to peek at the last known data.
    // Let's rely on the service to handle the "smart" logic or use a helper.

    // We'll trust the button class state in DOM for this quick action to decide intent
    // (A bit simplified, but effective for UI controllers)
    const btn = this.container.querySelector(`button[data-id="${itemId}"]`);
    const isRunning = btn.classList.contains("btn-item-toggle--running");

    let result;
    if (isRunning) {
      result = await TimerService.stopItemTimer(this.t, itemId);
    } else {
      result = await TimerService.startItemTimer(this.t, itemId);
    }

    if (result.success) {
      if (this.onRefresh) this.onRefresh();
    } else {
      alert(`Failed to toggle timer: ${result.error}`);
    }
  }

  async _handleEstimate(itemId, value) {
    const ms = parseTimeString(value);
    if (ms || value === "") {
      // If empty string, we might want to clear it? Service handles null/0 usu.
      const result = await TimerService.setItemEstimate(
        this.t,
        itemId,
        ms || 0,
      );
      if (result.success) {
        if (this.onRefresh) this.onRefresh();
      } else {
        alert(`Failed to set estimate: ${result.error}`);
      }
    }
  }

  _escape(str) {
    if (!str) return "";
    return String(str).replace(
      /[<>&"']/g,
      (c) =>
        ({
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
}
