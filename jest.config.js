export default {
  transform: {},
  globalSetup: "<rootDir>/tests/global-setup.js",
  globalTeardown: "<rootDir>/tests/global-teardown.js",
  setupFilesAfterEnv: [
    "<rootDir>/tests/setupFile.js"
  ]
};
