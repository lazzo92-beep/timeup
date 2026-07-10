/**
 * Tests for Trello API mock
 */

import { jest } from "@jest/globals";

/**
 * Creates a mock Trello client for testing.
 * @param {Object} overrides - Override default mock implementations
 * @returns {Object} Mock Trello client
 */
export const createTrelloMock = (overrides = {}) => {
  const storage = new Map();

  const mockT = {
    // Storage methods
    get: jest.fn(async (scope, visibility, key) => {
      if (key) {
        const storageKey = `${scope}:${visibility}:${key}`;
        return storage.get(storageKey) ?? null;
      } else {
        // Return all keys for this scope/visibility
        const result = {};
        const prefix = `${scope}:${visibility}:`;
        for (const [sKey, value] of storage.entries()) {
          if (sKey.startsWith(prefix)) {
            const actualKey = sKey.substring(prefix.length);
            result[actualKey] = value;
          }
        }
        return result;
      }
    }),

    set: jest.fn(async (scope, visibility, key, value) => {
      const storageKey = `${scope}:${visibility}:${key}`;
      storage.set(storageKey, value);
    }),

    remove: jest.fn(async (scope, visibility, key) => {
      const storageKey = `${scope}:${visibility}:${key}`;
      storage.delete(storageKey);
    }),

    // Card methods
    card: jest.fn(async () => ({
      id: "test-card-id",
      name: "Test Card",
      url: "https://trello.com/c/test",
    })),

    cards: jest.fn(async () => [
      { id: "card-1", name: "Card 1" },
      { id: "card-2", name: "Card 2" },
    ]),

    // Board methods
    board: jest.fn(async (...fields) => {
      const result = {
        id: "test-board-id",
        name: "Test Board",
        url: "https://trello.com/b/test",
      };
      // If requesting members field, include board members
      if (fields.includes("members")) {
        result.members = [
          { id: "member-1", fullName: "Alice Smith", username: "alice" },
          { id: "member-2", fullName: "Bob Jones", username: "bob" },
          { id: "test-member-id", fullName: "Test User", username: "testuser" },
        ];
      }
      return result;
    }),

    // Member methods
    member: jest.fn(async () => ({
      id: "test-member-id",
      fullName: "Test User",
      username: "testuser",
      avatar: null,
    })),

    // UI methods
    closePopup: jest.fn(async () => {}),
    sizeTo: jest.fn(async () => {}),
    popup: jest.fn(async () => {}),
    signUrl: jest.fn((url) => url),

    // Apply overrides
    ...overrides,
  };

  // Helper to set initial storage state
  mockT._setStorage = (scope, visibility, key, value) => {
    const storageKey = `${scope}:${visibility}:${key}`;
    storage.set(storageKey, value);
  };

  // Helper to get storage state
  mockT._getStorage = (scope, visibility, key) => {
    const storageKey = `${scope}:${visibility}:${key}`;
    return storage.get(storageKey);
  };

  // Helper to clear storage
  mockT._clearStorage = () => {
    storage.clear();
  };

  return mockT;
};

/**
 * Creates a mock that throws an error.
 * @param {string} message - Error message
 * @returns {Function} Mock function that throws
 */
export const createErrorMock = (message = "Mock error") => {
  return jest.fn(async () => {
    throw new Error(message);
  });
};
