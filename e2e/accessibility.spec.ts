import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { businessDay, resetBackend, signIn } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }));
  expect(summary).toEqual([]);
}

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expectNoViolations(page);
});

test("booking page has no violations while loaded, with errors and after booking", async ({
  page,
}) => {
  const day = businessDay(2);
  await page.goto("/book");
  await page.getByRole("radio", { name: day.label }).click();
  await expect(page.getByRole("button", { name: "10:00", exact: true })).toBeEnabled();
  await expectNoViolations(page);

  await page.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByText("Enter your name.")).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByLabel("Your name").fill("Ana Souza");
  await page.getByLabel("Pet's name").fill("Rex");
  await page.getByLabel("Service").selectOption({ label: "Exam" });
  await page.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByRole("heading", { name: "Appointment booked" })).toBeVisible();
  await expectNoViolations(page);
});

test("appointment page has no violations empty, with details and with the reschedule view", async ({
  page,
}) => {
  const day = businessDay(2);
  await page.goto("/book");
  await page.getByRole("radio", { name: day.label }).click();
  await page.getByRole("button", { name: "09:30", exact: true }).click();
  await page.getByLabel("Your name").fill("Ana Souza");
  await page.getByLabel("Pet's name").fill("Rex");
  await page.getByLabel("Service").selectOption({ label: "Consultation" });
  await page.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByRole("heading", { name: "Appointment booked" })).toBeVisible();

  await page.goto("/appointment");
  await expectNoViolations(page);

  await page.goto("/appointment?code=apt-0001");
  await expect(page.getByRole("heading", { name: "Your appointment" })).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("button", { name: "Reschedule" }).click();
  await expect(page.getByRole("heading", { name: "Choose a new time" })).toBeVisible();
  await expectNoViolations(page);

  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await expectNoViolations(page);
});

test("sign in page has no violations", async ({ page }) => {
  await page.goto("/sign-in");
  await expectNoViolations(page);
});

test("chat page has no violations empty, with sources, and with the emergency notice", async ({
  page,
}) => {
  await signIn(page, "Alice");
  await expectNoViolations(page);

  await page.getByLabel("Your message").fill("Which vaccines do you give?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Sources", { exact: true })).toBeVisible();
  await expectNoViolations(page);

  await page.getByLabel("Your message").fill("My dog was poisoned");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("This may be an emergency.")).toBeVisible();
  await expectNoViolations(page);
});
