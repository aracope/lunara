export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest-setup.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/app.js",
    "!src/config.js",
  ],
  transform: {},
};
