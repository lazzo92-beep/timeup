/**
 * Tests for validators.js utilities
 */

import {
  isPositiveNumber,
  isNonEmptyString,
  isValidEntry,
} from "../../src/utils/validators.js";

describe("isPositiveNumber", () => {
  test("returns true for positive numbers", () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.5)).toBe(true);
    expect(isPositiveNumber(1000000)).toBe(true);
  });

  test("returns false for zero", () => {
    expect(isPositiveNumber(0)).toBe(false);
  });

  test("returns false for negative numbers", () => {
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber(-0.5)).toBe(false);
  });

  test("returns false for non-numbers", () => {
    expect(isPositiveNumber("5")).toBe(false);
    expect(isPositiveNumber(null)).toBe(false);
    expect(isPositiveNumber(undefined)).toBe(false);
    expect(isPositiveNumber({})).toBe(false);
    expect(isPositiveNumber([])).toBe(false);
  });

  test("returns false for special number values", () => {
    expect(isPositiveNumber(NaN)).toBe(false);
    expect(isPositiveNumber(Infinity)).toBe(false);
    expect(isPositiveNumber(-Infinity)).toBe(false);
  });
});

describe("isNonEmptyString", () => {
  test("returns true for non-empty strings", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString("a")).toBe(true);
    expect(isNonEmptyString("  text  ")).toBe(true);
  });

  test("returns false for empty string", () => {
    expect(isNonEmptyString("")).toBe(false);
  });

  test("returns false for whitespace-only strings", () => {
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString("\t")).toBe(false);
    expect(isNonEmptyString("\n")).toBe(false);
  });

  test("returns false for non-strings", () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString({})).toBe(false);
    expect(isNonEmptyString([])).toBe(false);
  });
});

describe("isValidEntry", () => {
  test("returns true for valid entries", () => {
    const validEntry = {
      startTime: 1000,
      endTime: 2000,
    };
    expect(isValidEntry(validEntry)).toBe(true);
  });

  test("returns false if entry is null or undefined", () => {
    expect(isValidEntry(null)).toBeFalsy();
    expect(isValidEntry(undefined)).toBeFalsy();
  });

  test("returns false if entry is not an object", () => {
    expect(isValidEntry("string")).toBeFalsy();
    expect(isValidEntry(123)).toBeFalsy();
  });

  test("returns false if startTime is missing or invalid", () => {
    expect(isValidEntry({ endTime: 2000 })).toBeFalsy();
    expect(isValidEntry({ startTime: "invalid", endTime: 2000 })).toBeFalsy();
    expect(isValidEntry({ startTime: -1, endTime: 2000 })).toBeFalsy();
  });

  test("returns false if endTime is missing or invalid", () => {
    expect(isValidEntry({ startTime: 1000 })).toBe(false);
    expect(isValidEntry({ startTime: 1000, endTime: "invalid" })).toBe(false);
    expect(isValidEntry({ startTime: 1000, endTime: -1 })).toBe(false);
  });

  test("returns false if endTime is not after startTime", () => {
    expect(isValidEntry({ startTime: 2000, endTime: 1000 })).toBe(false);
    expect(isValidEntry({ startTime: 1000, endTime: 1000 })).toBe(false);
  });
});
