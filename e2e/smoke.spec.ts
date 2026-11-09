import { expect, test } from "@playwright/test";

test("the home page renders and links to booking", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Vet Portal");
  await expect(page.getByRole("heading", { level: 1, name: "Vet Portal" })).toBeVisible();
  await page.getByRole("link", { name: "Book an appointment" }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByRole("heading", { level: 1, name: "Book an appointment" })).toBeVisible();
});

test("the GraphQL endpoint answers through the running app", async ({ request }) => {
  const response = await request.post("/api/graphql", {
    data: { query: "{ clinic { name slotMinutes } }" },
  });
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({
    data: { clinic: { name: "Happy Paws Clinic", slotMinutes: 30 } },
  });
});
