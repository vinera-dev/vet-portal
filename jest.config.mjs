import nextJest from "next/jest.js";

const createConfig = nextJest({ dir: "./" });

const shared = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/e2e/"],
};

const buildConfig = async () => {
  const web = await createConfig({
    ...shared,
    displayName: "web",
    testEnvironment: "jsdom",
    testMatch: ["<rootDir>/src/**/*.test.tsx"],
  })();
  const server = await createConfig({
    ...shared,
    displayName: "server",
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/*.test.ts"],
  })();
  return {
    projects: [web, server],
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/gql/**", "!src/**/*.d.ts"],
  };
};

export default buildConfig;
