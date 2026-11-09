import { expect, test } from "@playwright/test";
import { BACKEND_URL, businessDay, resetBackend } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

test("books, reschedules and cancels an appointment", async ({ page }) => {
  const day = businessDay(2);
  await page.goto("/book");

  await page.getByRole("radio", { name: day.label }).click();
  await page.getByRole("button", { name: "10:00", exact: true }).click();
  await page.getByLabel("Your name").fill("Ana Souza");
  await page.getByLabel("Pet's name").fill("Rex");
  await page.getByLabel("Service").selectOption({ label: "Vaccination" });
  await page.getByRole("button", { name: "Book appointment" }).click();

  await expect(page.getByRole("heading", { name: "Appointment booked" })).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Vaccination for Rex" })).toContainText(
    "at 10:00",
  );
  await expect(page.locator("strong")).toHaveText("apt-0001");
  await expect(page.getByRole("button", { name: "10:00, unavailable" })).toBeDisabled();

  await page.getByRole("link", { name: "Manage this appointment" }).click();
  await expect(page).toHaveURL(/\/appointment\?code=apt-0001$/);
  await expect(page.getByRole("heading", { name: "Your appointment" })).toBeVisible();
  await expect(page.getByText("Scheduled", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Reschedule" }).click();
  await page.getByRole("button", { name: "11:00", exact: true }).click();
  await page.getByRole("button", { name: "Confirm new time" }).click();
  await expect(page.getByText(/Appointment moved to .* at 11:00\./)).toBeVisible();

  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await page.getByRole("button", { name: "Yes, cancel it" }).click();
  await expect(page.getByText("Your appointment was cancelled.")).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reschedule" })).toHaveCount(0);
});

test("frees the time again after a cancellation", async ({ page }) => {
  const day = businessDay(2);
  await page.goto("/book");
  await page.getByRole("radio", { name: day.label }).click();
  await page.getByRole("button", { name: "09:00", exact: true }).click();
  await page.getByLabel("Your name").fill("Ana Souza");
  await page.getByLabel("Pet's name").fill("Rex");
  await page.getByLabel("Service").selectOption({ label: "Exam" });
  await page.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByRole("button", { name: "09:00, unavailable" })).toBeDisabled();

  await page.goto("/appointment?code=apt-0001");
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await page.getByRole("button", { name: "Yes, cancel it" }).click();
  await expect(page.getByText("Your appointment was cancelled.")).toBeVisible();

  await page.goto("/book");
  await page.getByRole("radio", { name: day.label }).click();
  await expect(page.getByRole("button", { name: "09:00", exact: true })).toBeEnabled();
});

test("the day selector works with the keyboard", async ({ page }) => {
  await page.goto("/book");
  const group = page.getByRole("radiogroup", { name: "Choose a day" });
  const checked = group.getByRole("radio", { checked: true });
  const first = await checked.getAttribute("aria-label");

  await checked.focus();
  await page.keyboard.press("ArrowRight");
  await expect(checked).not.toHaveAttribute("aria-label", first ?? "");
  await expect(checked).toBeFocused();

  await page.keyboard.press("ArrowLeft");
  await expect(checked).toHaveAttribute("aria-label", first ?? "");
});

test("shows a message for each invalid field", async ({ page }) => {
  await page.goto("/book");
  await page.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByText("Enter your name.")).toBeVisible();
  await expect(page.getByText("Enter your pet's name.")).toBeVisible();
  await expect(page.getByText("Choose a service.")).toBeVisible();
  await expect(page.getByText("Choose a time above before booking.")).toBeVisible();
});

test("explains a time that was taken in the meantime", async ({ page, request }) => {
  const day = businessDay(2);
  await page.goto("/book");
  await page.getByRole("radio", { name: day.label }).click();
  await page.getByRole("button", { name: "14:00", exact: true }).click();

  const taken = await request.post(`${BACKEND_URL}/appointments`, {
    data: {
      tutor_name: "Someone Else",
      pet_name: "Mia",
      service: "consulta",
      start: `${day.iso}T14:00:00`,
    },
  });
  expect(taken.status()).toBe(201);

  await page.getByLabel("Your name").fill("Ana Souza");
  await page.getByLabel("Pet's name").fill("Rex");
  await page.getByLabel("Service").selectOption({ label: "Consultation" });
  await page.getByRole("button", { name: "Book appointment" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "no longer available" })).toBeVisible();
  await expect(page.getByRole("button", { name: "14:00, unavailable" })).toBeDisabled();
});

test("reports an unknown appointment code", async ({ page }) => {
  await page.goto("/appointment");
  await page.getByLabel("Appointment code").fill("does-not-exist");
  await page.getByRole("button", { name: "Find appointment" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "could not find an appointment" }),
  ).toBeVisible();
});

test("shows Sundays as closed", async ({ page }) => {
  await page.goto("/book");
  const closed = page.getByRole("radio", { name: /, closed$/ });
  await expect(closed.first()).toBeDisabled();
});
