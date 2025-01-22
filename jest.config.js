// You can learn more about each option below in the Jest docs: https://jestjs.io/docs/configuration.

module.exports = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  moduleNameMapper: {
    // Mock the database module for testing
    "lib/db": "<rootDir>/test_utils/mock_db.js",
  },
  testEnvironment: "node",
  setupFiles: ["./jest.setup.js"],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'pages/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
    statements: 80,
    },
  },
  coverageReporters: ["json", "lcov", "text", "clover", "html"],
  coverageDirectory: "coverage",
};
