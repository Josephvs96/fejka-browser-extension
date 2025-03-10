/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  moduleDirectories: ['node_modules'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel|@jest)/)'
  ]
};

export default config;