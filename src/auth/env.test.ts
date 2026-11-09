import { githubConfigured, readAuthEnv } from "./env";

describe("readAuthEnv", () => {
  it("falls back to a development secret outside production", () => {
    const env = readAuthEnv({ NODE_ENV: "development" });
    expect(env.secret).toMatch(/development-only/);
    expect(env.production).toBe(false);
  });

  it("requires a real secret in production", () => {
    expect(readAuthEnv({ NODE_ENV: "production" }).secret).toBeUndefined();
    expect(readAuthEnv({ NODE_ENV: "production", AUTH_SECRET: "abc" }).secret).toBe("abc");
  });

  it("detects whether GitHub is configured", () => {
    expect(githubConfigured(readAuthEnv({}))).toBe(false);
    expect(githubConfigured(readAuthEnv({ GITHUB_ID: "id" }))).toBe(false);
    expect(githubConfigured(readAuthEnv({ GITHUB_ID: "id", GITHUB_SECRET: "secret" }))).toBe(true);
  });

  it("treats blank values as missing", () => {
    expect(githubConfigured(readAuthEnv({ GITHUB_ID: "", GITHUB_SECRET: "" }))).toBe(false);
  });

  it("enables the test provider only outside production", () => {
    expect(readAuthEnv({ E2E_AUTH: "1", NODE_ENV: "test" }).testMode).toBe(true);
    expect(readAuthEnv({ NODE_ENV: "test" }).testMode).toBe(false);
    expect(() => readAuthEnv({ E2E_AUTH: "1", NODE_ENV: "production" })).toThrow(/production/);
  });
});
