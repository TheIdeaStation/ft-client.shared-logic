/** Shared-logic is platform-free, so plain ts-jest in a node env is enough. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  collectCoverageFrom: ["lib/**/*.ts", "hooks/**/*.ts", "!**/*.d.ts"],
};
