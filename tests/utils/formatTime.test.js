/**
 * Tests for formatTime.js utilities
 */

import {
  padZero,
  formatDuration,
  formatTimestamp,
  getElapsedTime,
  sumDurations,
  getRemainingTime,
  parseTimeString,
} from "../../src/utils/formatTime.js";

describe("padZero", () => {
  test("pads single digit numbers", () => {
    expect(padZero(0)).toBe("00");
    expect(padZero(5)).toBe("05");
    expect(padZero(9)).toBe("09");
  });

  test("does not pad double digit numbers", () => {
    expect(padZero(10)).toBe("10");
    expect(padZero(99)).toBe("99");
  });

  test("handles custom length", () => {
    expect(padZero(5, 3)).toBe("005");
    expect(padZero(123, 4)).toBe("0123");
  });

  test("handles numbers larger than length", () => {
    expect(padZero(1234, 2)).toBe("1234");
  });
});

describe("formatDuration", () => {
  describe("invalid inputs", () => {
    test("returns default for negative numbers", () => {
      expect(formatDuration(-1000)).toBe("00:00");
      expect(formatDuration(-1000, { compact: true })).toBe("0m");
    });

    test("returns default for non-numbers", () => {
      expect(formatDuration("invalid")).toBe("00:00");
      expect(formatDuration(null)).toBe("00:00");
      expect(formatDuration(undefined)).toBe("00:00");
    });

    test("returns default for NaN", () => {
      expect(formatDuration(NaN)).toBe("00:00");
    });

    test("returns default for Infinity", () => {
      expect(formatDuration(Infinity)).toBe("00:00");
    });
  });

  describe("standard format", () => {
    test("formats zero", () => {
      expect(formatDuration(0)).toBe("00:00:00");
    });

    test("formats seconds", () => {
      expect(formatDuration(1000)).toBe("00:00:01");
      expect(formatDuration(59000)).toBe("00:00:59");
    });

    test("formats minutes", () => {
      expect(formatDuration(60000)).toBe("00:01:00");
      expect(formatDuration(3599000)).toBe("00:59:59");
    });

    test("formats hours", () => {
      expect(formatDuration(3600000)).toBe("01:00:00");
      expect(formatDuration(8130000)).toBe("02:15:30");
    });

    test("formats without seconds", () => {
      expect(formatDuration(8130000, { showSeconds: false })).toBe("02:15");
    });
  });

  describe("compact format", () => {
    test("formats in compact style", () => {
      expect(formatDuration(0, { compact: true })).toBe("0m 0s");
      expect(formatDuration(60000, { compact: true })).toBe("1m 0s");
      expect(formatDuration(3661000, { compact: true })).toBe("1h 1m 1s");
    });

    test("compact without seconds", () => {
      expect(
        formatDuration(3661000, { compact: true, showSeconds: false }),
      ).toBe("1h 1m");
    });
  });

  describe("with days", () => {
    test("shows days when enabled", () => {
      const dayMs = 24 * 60 * 60 * 1000;
      expect(formatDuration(dayMs, { showDays: true })).toBe("1d 00:00:00");
      expect(formatDuration(dayMs + 3661000, { showDays: true })).toBe(
        "1d 01:01:01",
      );
    });

    test("compact with days", () => {
      const dayMs = 24 * 60 * 60 * 1000;
      expect(formatDuration(dayMs, { compact: true, showDays: true })).toBe(
        "1d 0h 0m 0s",
      );
    });
  });
});

describe("formatTimestamp", () => {
  // Use a fixed timestamp for testing: Jan 27, 2025 14:30:00
  const testTimestamp = new Date("2025-01-27T14:30:00").getTime();

  test("returns placeholder for invalid timestamp", () => {
    expect(formatTimestamp("invalid")).toBe("--:--");
    expect(formatTimestamp(null)).toBe("--:--");
    expect(formatTimestamp(NaN)).toBe("--:--");
  });

  test("formats with 24-hour by default", () => {
    const result = formatTimestamp(testTimestamp);
    expect(result).toMatch(/14:30/);
  });

  test("formats with 12-hour when specified", () => {
    const result = formatTimestamp(testTimestamp, { use24Hour: false });
    // Just verify it returns a non-placeholder time (locale-independent)
    expect(result).not.toBe("--:--");
    // Should be different from 24-hour format (which shows 14:30)
    expect(result).not.toMatch(/^14:30$/);
  });

  test("includes date when specified", () => {
    const result = formatTimestamp(testTimestamp, { showDate: true });
    expect(result).toMatch(/2025|Jan|27/);
  });
});

describe("getElapsedTime", () => {
  test("returns 0 for invalid inputs", () => {
    expect(getElapsedTime("invalid")).toBe(0);
    expect(getElapsedTime(null)).toBe(0);
    expect(getElapsedTime(NaN)).toBe(0);
  });

  test("returns elapsed time from past", () => {
    const pastTime = Date.now() - 5000;
    const elapsed = getElapsedTime(pastTime);
    expect(elapsed).toBeGreaterThanOrEqual(5000);
    expect(elapsed).toBeLessThan(6000);
  });

  test("returns 0 for future times", () => {
    const futureTime = Date.now() + 10000;
    expect(getElapsedTime(futureTime)).toBe(0);
  });
});

describe("sumDurations", () => {
  test("returns 0 for empty array", () => {
    expect(sumDurations([])).toBe(0);
  });

  test("returns 0 for non-array", () => {
    expect(sumDurations(null)).toBe(0);
    expect(sumDurations("invalid")).toBe(0);
  });

  test("sums valid durations", () => {
    const entries = [
      { duration: 1000 },
      { duration: 2000 },
      { duration: 3000 },
    ];
    expect(sumDurations(entries)).toBe(6000);
  });

  test("ignores invalid entries", () => {
    const entries = [
      { duration: 1000 },
      { duration: -500 },
      { duration: "invalid" },
      { duration: null },
      { nodurations: 1000 },
      { duration: 2000 },
    ];
    expect(sumDurations(entries)).toBe(3000);
  });

  test("handles entries without duration property", () => {
    const entries = [{ other: "data" }];
    expect(sumDurations(entries)).toBe(0);
  });
});

describe("getRemainingTime", () => {
  test("returns null if no estimate", () => {
    expect(getRemainingTime(0, null)).toBeNull();
    expect(getRemainingTime(0, 0)).toBeNull();
    expect(getRemainingTime(0, -100)).toBeNull();
  });

  test("calculates remaining time correctly", () => {
    const totalTime = 1800000; // 30 min
    const estimate = 3600000; // 1 hour

    const result = getRemainingTime(totalTime, estimate);
    expect(result.remaining).toBe(1800000);
    expect(result.isOverBudget).toBe(false);
    expect(result.percentComplete).toBe(50);
  });

  test("detects over budget", () => {
    const totalTime = 4000000;
    const estimate = 3600000;

    const result = getRemainingTime(totalTime, estimate);
    expect(result.remaining).toBeLessThan(0);
    expect(result.isOverBudget).toBe(true);
  });

  test("calculates percentage correctly", () => {
    const totalTime = 900000; // 15 min
    const estimate = 3600000; // 1 hour

    const result = getRemainingTime(totalTime, estimate);
    expect(result.percentComplete).toBe(25);
  });

  test("caps percentage at 100", () => {
    const totalTime = 7200000; // 2 hours
    const estimate = 3600000; // 1 hour

    const result = getRemainingTime(totalTime, estimate);
    expect(result.percentComplete).toBe(100);
  });
});

describe("parseTimeString", () => {
  test("returns null for invalid inputs", () => {
    expect(parseTimeString("")).toBeNull();
    expect(parseTimeString(null)).toBeNull();
    expect(parseTimeString("   ")).toBeNull();
    expect(parseTimeString("abc")).toBeNull();
  });

  test("parses hours only", () => {
    expect(parseTimeString("1h")).toBe(3600000);
    expect(parseTimeString("2h")).toBe(7200000);
    expect(parseTimeString("1.5h")).toBe(5400000);
  });

  test("parses minutes only", () => {
    expect(parseTimeString("30m")).toBe(1800000);
    expect(parseTimeString("45m")).toBe(2700000);
  });

  test("parses combined hours and minutes", () => {
    expect(parseTimeString("1h 30m")).toBe(5400000);
    expect(parseTimeString("2h 15m")).toBe(8100000);
    expect(parseTimeString("1h30m")).toBe(5400000);
  });

  test("parses plain number as minutes", () => {
    expect(parseTimeString("60")).toBe(3600000);
    expect(parseTimeString("90")).toBe(5400000);
  });

  test("is case insensitive", () => {
    expect(parseTimeString("1H 30M")).toBe(5400000);
    expect(parseTimeString("2H")).toBe(7200000);
  });

  test("handles whitespace", () => {
    expect(parseTimeString("  1h  30m  ")).toBe(5400000);
  });

  describe("HH:MM:SS format", () => {
    test("parses HH:MM:SS format", () => {
      expect(parseTimeString("1:30:00")).toBe(5400000); // 1h 30m
      expect(parseTimeString("0:07:00")).toBe(420000); // 7 minutes
      expect(parseTimeString("00:07:00")).toBe(420000); // 7 minutes
      expect(parseTimeString("2:00:00")).toBe(7200000); // 2 hours
    });

    test("parses MM:SS format", () => {
      expect(parseTimeString("7:00")).toBe(420000); // 7 minutes
      expect(parseTimeString("45:30")).toBe(2730000); // 45m 30s
      expect(parseTimeString("0:30")).toBe(30000); // 30 seconds
    });

    test("rejects invalid time components", () => {
      // Minutes >= 60 in HH:MM:SS should fail
      expect(parseTimeString("1:60:00")).toBeNull();
      // Seconds >= 60 in MM:SS should fail
      expect(parseTimeString("7:60")).toBeNull();
    });

    test("handles edge cases", () => {
      expect(parseTimeString("0:00:00")).toBe(0); // 0 time
      expect(parseTimeString("0:00")).toBe(0); // 0 time
      expect(parseTimeString("99:59:59")).toBe(359999000); // 99h 59m 59s
    });
  });
});
