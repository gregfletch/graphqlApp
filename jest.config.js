const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'jest-preset-angular',
  roots: ['<rootDir>/src/'],
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/src/test.ts'],
  collectCoverage: true,
  coverageReporters: ['json', 'lcov', 'text', 'html'],
  coverageDirectory: 'coverage/graphqlApp',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/'
  }),
  modulePaths: ['<rootDir>'],
  testRunner: 'jest-jasmine2'
};
