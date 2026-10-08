/** Shared-logic is platform-free, so plain ts-jest in a node env is enough. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  collectCoverageFrom: ["lib/**/*.ts", "hooks/**/*.ts", "!**/*.d.ts"],
};
