import { DEFAULT_REDIRECT, safeRedirectPath } from "./access";

describe("safeRedirectPath", () => {
  it("keeps local paths", () => {
    expect(safeRedirectPath("/chat")).toBe("/chat");
    expect(safeRedirectPath("/appointment?code=apt-1")).toBe("/appointment?code=apt-1");
  });

  it("rejects external and malformed targets", () => {
    expect(safeRedirectPath("https://evil.example")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("//evil.example")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("/\\evil.example")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
  });
});
