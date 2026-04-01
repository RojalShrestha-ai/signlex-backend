module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
  ],
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 10000,
};
