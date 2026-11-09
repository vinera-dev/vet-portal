import type { APIRequestContext, Page } from "@playwright/test";

export const BACKEND_URL = "http://127.0.0.1:8765";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface TestDay {
  iso: string;
  label: string;
}

export function businessDay(offset: number): TestDay {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return {
    iso: `${date.getFullYear()}-${month}-${day}`,
    label: `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`,
  };
}

export async function resetBackend(request: APIRequestContext): Promise<void> {
  await request.post(`${BACKEND_URL}/__reset`);
}

export async function setChatFailure(request: APIRequestContext, on: boolean): Promise<void> {
  await request.post(`${BACKEND_URL}/__chat-failure?on=${on ? 1 : 0}`);
}

export async function signIn(page: Page, name: string, target = "/chat"): Promise<void> {
  await page.goto(`/sign-in?callbackUrl=${encodeURIComponent(target)}`);
  await page.getByLabel("Test user name").fill(name);
  await page.getByRole("button", { name: "Sign in as test user" }).click();
  await page.waitForURL(`**${target}`);
}
