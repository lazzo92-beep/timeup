/**
 * EntryListUI.js
 * Handles rendering time entries and editing logic
 */

import {
  formatDuration,
  formatTimestamp,
  parseTimeString,
} from "../utils/formatTime.js";
import TimerService from "../services/TimerService.js";
import { VALIDATION } from "../utils/constants.js";
import { escapeHtml } from "../utils/escapeHtml.js";

export class EntryListUI {
  constructor(t, containerId, { onRefresh, getChecklists, getBoardMembers }) {
    this.t = t;
    this.container = document.getElementById(containerId);
    this.onRefresh = onRefresh;
    this.getChecklists = getChecklists; // Function to get current checklists for dropdowns
    this.getBoardMembers = getBoardMembers; // Function to get board members for assignment

    this.editingId = null;
    this.currentEntries = [];
    this.itemNameCache = null; // Cache for O(1) checklist item lookups
    this.memberCache = null; // Cache for O(1) member lookups

    // No global listeners here, we attach per render for simplicity with the list items
  }

  /**
   * Builds a Map of memberId -> member for O(1) lookups.
   * @private
   */
  _buildMemberCache() {
    const members = this.getBoardMembers ? this.getBoardMembers() : [];
    this.memberCache = new Map();

    for (const member of members) {
      this.memberCache.set(member.id, member);
    }
  }

  /**
   * Builds a Map of checklistItemId -> itemName for O(1) lookups.
   * @private
   */
  _buildItemNameCache() {
    const checklists = this.getChecklists ? this.getChecklists() : [];
    this.itemNameCache = new Map();

    for (const cl of checklists) {
      for (const item of cl.checkItems || []) {
        this.itemNameCache.set(item.id, item.name);
      }
    }
  }

  render(entries) {
    this.currentEntries = entries || [];

    if (!this.currentEntries.length) {
      this.container.innerHTML =
        '<div class="empty-msg">No time entries yet</div>';
      return;
    }

    // Build caches for O(1) lookups
    this._buildItemNameCache();
    this._buildMemberCache();

    const sorted = [...this.currentEntries].reverse();
    const entriesHtml = sorted
      .map((entry) => {
        if (entry.id === this.editingId) {
          return this._renderEdit(entry);
        }
        return this._renderView(entry);
      })
      .join("");

    const html = `
      <div class="entries-header">Recent History (last 5)</div>
      ${entriesHtml}
    `;

    this.container.innerHTML = html;
    this._attachListeners();
  }

  _renderView(entry) {
    // O(1) lookup using pre-built caches
    const itemName =
      entry.checklistItemId && this.itemNameCache
        ? this.itemNameCache.get(entry.checklistItemId)
        : null;

    const member =
      entry.memberId && this.memberCache
        ? this.memberCache.get(entry.memberId)
        : null;

    const labelHtml = itemName
      ? `<span class="entry__label">☑ ${this._escape(itemName)}</span>`
      : "";
    const descHtml = entry.description
      ? `<span class="entry__desc">${this._escape(entry.description)}</span>`
      : "";
    const memberHtml = member
      ? `<span class="entry__member" title="${this._escape(member.fullName)}">👤 ${this._escape(member.fullName)}</span>`
      : "";

    return `
            <div class="entry ${itemName ? "entry--linked" : ""}"
                 data-id="${this._escape(entry.id)}" role="button" tabindex="0">
                <div class="entry__info">
                    <span class="entry__time">${this._escape(formatTimestamp(entry.startTime, { showDate: true }))}</span>
                    ${memberHtml}
                    ${labelHtml}
                    ${descHtml}
                </div>
                <div class="entry__right">
                    <span class="entry__duration">${this._escape(formatDuration(entry.duration, { compact: true }))}</span>
                    <button class="btn-delete" data-id="${this._escape(entry.id)}">×</button>
                </div>
            </div>
        `;
  }

  _renderEdit(entry) {
    const checklists = this.getChecklists ? this.getChecklists() : [];
    const members = this.getBoardMembers ? this.getBoardMembers() : [];

    // Flatten checklist items for select
    const checklistOptions = [];
    checklists.forEach((cl) => {
      (cl.checkItems || []).forEach((item) => {
        checklistOptions.push(
          `<option value="${this._escape(item.id)}" ${entry.checklistItemId === item.id ? "selected" : ""}>${this._escape(item.name)}</option>`,
        );
      });
    });

    // Build member options
    const memberOptions = members.map(
      (m) =>
        `<option value="${this._escape(m.id)}" ${entry.memberId === m.id ? "selected" : ""}>${this._escape(m.fullName)}</option>`,
    );

    return `
            <div class="entry entry--editing" data-id="${this._escape(entry.id)}">
                 <div class="entry__edit-row">
                    <span class="entry__edit-label">Duration:</span>
                    <input type="text" class="entry__edit-input" id="edit-duration-input" value="${this._escape(formatDuration(entry.duration, { compact: true }))}">
                 </div>
                 <div class="entry__edit-row">
                    <span class="entry__edit-label">Member:</span>
                    <select class="entry__edit-select" id="edit-member-select">
                        <option value="">— Unknown —</option>
                        ${memberOptions.join("")}
                    </select>
                 </div>
                 <div class="entry__edit-row">
                    <span class="entry__edit-label">Checklist:</span>
                    <select class="entry__edit-select" id="edit-checklist-select">
                        <option value="">— None —</option>
                        ${checklistOptions.join("")}
                    </select>
                 </div>
                 <div class="entry__edit-row">
                    <span class="entry__edit-label">Desc:</span>
                    <input type="text" class="entry__edit-input" id="edit-desc-input"
                           maxlength="${VALIDATION.MAX_DESCRIPTION_LENGTH}"
                           value="${this._escape(entry.description || "")}">
                 </div>
                 <div class="entry__edit-actions">
                    <button class="btn-cancel" id="btn-cancel-edit">Cancel</button>
                    <button class="btn-save" id="btn-save-edit">Save</button>
                </div>
            </div>
        `;
  }

  _attachListeners() {
    // Edit Mode Listeners
    if (this.editingId) {
      const saveBtn = this.container.querySelector("#btn-save-edit");
      const cancelBtn = this.container.querySelector("#btn-cancel-edit");

      if (saveBtn)
        saveBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this._handleSave();
        });
      if (cancelBtn)
        cancelBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.editingId = null;
          this.render(this.currentEntries);
        });
    }

    // View Mode Listeners (Click to edit)
    this.container
      .querySelectorAll(".entry:not(.entry--editing)")
      .forEach((el) => {
        el.addEventListener("click", (e) => {
          // Ignore if delete button clicked
          if (e.target.classList.contains("btn-delete")) return;
          this.editingId = el.dataset.id;
          this.render(this.currentEntries);
        });
      });

    // Delete Listeners
    this.container.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("Delete this entry?")) {
          const result = await TimerService.deleteEntry(this.t, btn.dataset.id);
          if (!result.success) {
            alert(`Failed to delete entry: ${result.error}`);
            return;
          }
          if (this.onRefresh) this.onRefresh();
        }
      });
    });
  }

  async _handleSave() {
    const durationInput = this.container.querySelector("#edit-duration-input");
    const descInput = this.container.querySelector("#edit-desc-input");
    const checklistSelect = this.container.querySelector(
      "#edit-checklist-select",
    );
    const memberSelect = this.container.querySelector("#edit-member-select");

    const ms = parseTimeString(durationInput.value);
    if (!ms) {
      alert("Invalid duration");
      return;
    }

    const updates = {
      duration: ms,
      description: descInput.value,
      checklistItemId: checklistSelect.value || null,
      memberId: memberSelect.value || null,
    };

    const result = await TimerService.updateEntry(
      this.t,
      this.editingId,
      updates,
    );
    if (result.success) {
      this.editingId = null;
      if (this.onRefresh) this.onRefresh();
    } else {
      alert("Update failed");
    }
  }

  _escape(str) {
    return escapeHtml(str ?? "");
  }
}
