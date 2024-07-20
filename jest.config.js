export default {
  transform: {},
  collectCoverageFrom: ['src/**', '!src/admin/*', '!src/utils/*', '!src/config/*'],
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setupTests.js',
  ],
  reporters: [
    'default',
    ['jest-junit', { 'outputDirectory': './test-results', 'outputName': 'junit.xml' }],
  ],
};
