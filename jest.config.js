/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js", "mjs"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/ui/**/*.js", // UI files require DOM, tested separately
    "!src/main.js", // Connector requires Trello SDK (browser global)
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ["text", "text-summary", "html"],
  verbose: true,
};
