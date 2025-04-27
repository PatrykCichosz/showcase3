module.exports = {
    preset: 'jest-expo',
    transform: {
      '^.+\\.tsx?$': 'babel-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: [
      'node_modules/(?!react-native|react-navigation|@react-native|expo)/',
    ],
  }
  