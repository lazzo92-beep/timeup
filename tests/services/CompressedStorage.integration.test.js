import { jest } from "@jest/globals";
import { randomBytes } from "node:crypto";
import { createTrelloMock } from "../mocks/trelloMock.js";
import StorageService from "../../src/services/StorageService.js";
import TimerService from "../../src/services/TimerService.js";
import { DEFAULTS } from "../../src/utils/constants.js";
import { encodeTimerData } from "../../src/utils/timerStorageCodec.js";

const history = () => ({
  ...DEFAULTS.TIMER_DATA,
  totalTime: 35 * 3600000,
  recentEntries: Array.from({ length: 35 }, (_, index) => ({
    id: `entry_${index}`,
    startTime: 1700000000000 + index * 86400000,
    endTime: 1700003600000 + index * 86400000,
    duration: 3600000,
    description: `Task ${index}: \u010desk\u00fd popis`,
    memberId: "member-1",
    checklistItemId: null,
    createdAt: 1700003600000 + index * 86400000,
    extraField: { preserved: true },
  })),
});

test("starts and stops an oversized legacy history without losing entries or totals", async () => {
  const t = createTrelloMock();
  const original = history();
  expect(JSON.stringify(original).length).toBeGreaterThan(4096);
  t._setStorage("card", "shared", "timerData", original);
  expect((await TimerService.startTimer(t)).success).toBe(true);
  const stored = t._getStorage("card", "shared", "timerData");
  expect(stored.timeupHistory.encoding).toBe("gzip-base64-v1");
  expect(JSON.stringify({ timerData: stored }).length).toBeLessThanOrEqual(4096);
  expect((await StorageService.getTimerData(t)).recentEntries).toEqual(original.recentEntries);

  const stopped = await TimerService.stopTimer(t, "More work");
  expect(stopped.success).toBe(true);
  const restored = await StorageService.getTimerData(t);
  expect(restored.recentEntries.slice(1)).toEqual(original.recentEntries);
  expect(restored.recentEntries[0].description).toBe("More work");
  expect(restored.totalTime).toBe(original.totalTime + stopped.entry.duration);
  expect(restored.state).toBe("idle");
  expect(restored.currentEntry).toBeNull();
});

test("board reports can read a compressed card by its ID", async () => {
  const t = createTrelloMock();
  const original = history();
  t._setStorage("card-id", "shared", "timerData", await encodeTimerData(original));
  expect(await StorageService.getTimerData(t, "card-id")).toEqual(original);
});

test("refuses a save above the scope limit and leaves the original untouched", async () => {
  const t = createTrelloMock();
  const original = { ...DEFAULTS.TIMER_DATA, totalTime: 1234 };
  t._setStorage("card", "shared", "timerData", original);
  const result = await StorageService.setTimerData(t, {
    ...original, recentEntries: [{ description: randomBytes(7000).toString("base64") }],
  });
  expect(result.success).toBe(false);
  expect(result.error).toContain("full");
  expect(t.set).not.toHaveBeenCalled();
  expect(t._getStorage("card", "shared", "timerData")).toEqual(original);
});

test("counts other shared keys and the timerData key toward the limit", async () => {
  const t = createTrelloMock();
  t._setStorage("card", "shared", "other", "x".repeat(4000));
  expect((await StorageService.setTimerData(t, { ...DEFAULTS.TIMER_DATA })).success).toBe(false);
  expect(t.set).not.toHaveBeenCalled();
});

test("unreadable compressed history or failed reads never become an empty timer", async () => {
  const t = createTrelloMock();
  t._setStorage("card", "shared", "timerData", { timeupHistory: { encoding: "gzip-base64-v1", data: "bad" } });
  expect((await TimerService.startTimer(t)).success).toBe(false);
  expect(t.set).not.toHaveBeenCalled();
  t.get = jest.fn().mockRejectedValue(new Error("Network unavailable"));
  expect((await TimerService.startTimer(t)).success).toBe(false);
  expect(t.set).not.toHaveBeenCalled();
});

test("preserves entries added by a previously opened legacy client", async () => {
  const t = createTrelloMock();
  const original = history();
  const stored = await encodeTimerData(original);
  const newEntry = { id: "legacy-new", duration: 123, description: "New work" };
  t._setStorage("card", "shared", "timerData", {
    ...stored, totalTime: original.totalTime + 123, recentEntries: [newEntry],
  });
  const restored = await StorageService.getTimerData(t);
  expect(restored.recentEntries).toEqual([newEntry, ...original.recentEntries]);
  expect(restored.totalTime).toBe(original.totalTime + 123);
});
