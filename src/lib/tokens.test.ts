import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrastRatio } from "./contrast";

function readTokens(): Record<string, string> {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  const root = /:root\s*\{([^}]*)\}/.exec(css);
  if (!root) {
    throw new Error("No :root block");
  }
  const tokens: Record<string, string> = {};
  for (const match of root[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

const tokens = readTokens();

const textPairs: [string, string][] = [
  ["color-text", "color-bg"],
  ["color-text", "color-surface"],
  ["color-muted", "color-bg"],
  ["color-muted", "color-surface"],
  ["color-primary", "color-bg"],
  ["color-primary", "color-surface"],
  ["color-on-primary", "color-primary"],
  ["color-on-primary-soft", "color-primary-soft"],
  ["color-on-danger-soft", "color-danger-soft"],
  ["color-on-warning-soft", "color-warning-soft"],
  ["color-on-primary", "color-danger"],
  ["color-bg", "color-text"],
];

const nonTextPairs: [string, string][] = [
  ["color-border", "color-bg"],
  ["color-border", "color-surface"],
  ["color-focus", "color-bg"],
];

describe("contrast helper", () => {
  it("computes the extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });

  it("flags a low contrast pair", () => {
    expect(contrastRatio("#999999", "#ffffff")).toBeLessThan(4.5);
  });
});

describe("design tokens", () => {
  it.each(textPairs)("%s on %s meets 4.5:1 for text", (foreground, background) => {
    expect(contrastRatio(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(nonTextPairs)("%s on %s meets 3:1 for components", (foreground, background) => {
    expect(contrastRatio(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(3);
  });
});
