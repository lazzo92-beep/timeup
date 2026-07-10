/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { EntryListUI } from "../../src/ui/EntryListUI.js";

// Mock TimerService
jest.unstable_mockModule("../../src/services/TimerService.js", () => ({
  default: {
    deleteEntry: jest.fn(),
  },
}));

// Mock Utils
jest.mock("../../src/utils/formatTime.js", () => ({
  formatDuration: (ms) => "10m",
  formatTimestamp: (ts) => "Jan 28, 7:50 PM",
  parseTimeString: (str) => 600000,
}));

describe("EntryListUI", () => {
  let container;
  let entryListUI;

  beforeEach(() => {
    document.body.innerHTML = '<div id="entries-container"></div>';
    container = document.getElementById("entries-container");
    entryListUI = new EntryListUI({}, "entries-container", {
      onRefresh: jest.fn(),
      getChecklists: () => [],
      getBoardMembers: () => [
        { id: "member-1", fullName: "Alice Smith" },
        { id: "member-2", fullName: "Bob Jones" },
      ],
    });
  });

  test("should render empty message when no entries", () => {
    entryListUI.render([]);
    expect(container.innerHTML).toContain("No time entries yet");
  });

  test("should render entries correctly", () => {
    const entries = [
      {
        id: "e1",
        startTime: Date.now(),
        duration: 600000,
        description: "Test Work",
      },
    ];
    entryListUI.render(entries);

    expect(container.querySelectorAll(".entry").length).toBe(1);
    expect(container.innerHTML).toContain("Test Work");
    expect(container.innerHTML).toContain("10m");
  });

  test("should display member name when entry has memberId", () => {
    const entries = [
      {
        id: "e1",
        startTime: Date.now(),
        duration: 600000,
        description: "Test Work",
        memberId: "member-1",
      },
    ];
    entryListUI.render(entries);

    expect(container.innerHTML).toContain("Alice Smith");
    expect(container.querySelector(".entry__member")).not.toBeNull();
  });

  test("should not display member element when no memberId", () => {
    const entries = [
      {
        id: "e1",
        startTime: Date.now(),
        duration: 600000,
        description: "Test Work",
        memberId: null,
      },
    ];
    entryListUI.render(entries);

    expect(container.querySelector(".entry__member")).toBeNull();
  });

  test("should enter edit mode on click", () => {
    const entries = [
      {
        id: "e1",
        startTime: Date.now(),
        duration: 600000,
        description: "Test Work",
      },
    ];
    entryListUI.render(entries);

    const entryEl = container.querySelector(".entry");
    entryEl.click();

    expect(container.querySelector(".entry--editing")).not.toBeNull();
    expect(container.querySelector("#edit-desc-input").value).toBe("Test Work");
  });
});
