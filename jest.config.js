/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only run the TypeScript sources under src/. Ignore the compiled output in
  // dist/ (produced by `build:js`) so duplicated *.test.js are never picked up.
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
