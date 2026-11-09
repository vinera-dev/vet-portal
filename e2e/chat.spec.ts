import { expect, test, type Page } from "@playwright/test";
import { resetBackend, setChatFailure, signIn } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetBackend(request);
});

async function say(page: Page, text: string) {
  await page.getByLabel("Your message").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}

test("anonymous visitors are sent to sign in before the chat", async ({ page }) => {
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fchat$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("the chat API refuses anonymous calls", async ({ request }) => {
  const response = await request.post("/api/chat", { data: { message: "hello" } });
  expect(response.status()).toBe(401);
});

test("the conversation keeps its context across messages", async ({ page }) => {
  await signIn(page, "Alice");
  await say(page, "My dog is Rex");
  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log).toContainText("Mensagem 1 desta conversa: My dog is Rex");

  await say(page, "How old is he?");
  await expect(log).toContainText("Mensagem 2 desta conversa: My dog is Rex | How old is he?");
});

test("the session cookie is httpOnly and not readable by the page", async ({ page, context }) => {
  await signIn(page, "Alice");
  await say(page, "Hello");
  await expect(page.getByRole("log")).toContainText("Mensagem 1");
  const cookies = await context.cookies();
  const chat = cookies.find((cookie) => cookie.name === "vet_chat_session");
  expect(chat?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("vet_chat_session");
});

test("different users have separate conversations", async ({ browser }) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  await signIn(alice, "Alice");
  await signIn(bob, "Bob");

  await say(alice, "Alice only secret");
  await expect(alice.getByRole("log")).toContainText(
    "Mensagem 1 desta conversa: Alice only secret",
  );

  await say(bob, "Bob question");
  await expect(bob.getByRole("log")).toContainText("Mensagem 1 desta conversa: Bob question");
  await expect(bob.getByRole("log")).not.toContainText("Alice only secret");

  await alice.context().close();
  await bob.context().close();
});

test("a signed in user does not inherit another user's conversation in the same browser", async ({
  page,
}) => {
  await signIn(page, "Alice");
  await say(page, "Alice private note");
  await expect(page.getByRole("log")).toContainText("Mensagem 1");

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "Bob");
  await say(page, "Bob first message");
  await expect(page.getByRole("log")).toContainText("Mensagem 1 desta conversa: Bob first message");
  await expect(page.getByRole("log")).not.toContainText("Alice private note");
});

test("shows the sources of an answer", async ({ page }) => {
  await signIn(page, "Alice");
  await say(page, "Which vaccines do you give?");
  await expect(page.getByText("Sources", { exact: true })).toBeVisible();
  await expect(page.getByText("Vacinas (faq/vacinas.md)")).toBeVisible();
});

test("shows the emergency notice and escalates", async ({ page }) => {
  await signIn(page, "Alice");
  await say(page, "My dog was poisoned");
  const alert = page.getByRole("alert").filter({ hasText: "This may be an emergency." });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Call the clinic reception now");
});

test("shows a clear error when the assistant fails and recovers", async ({ page, request }) => {
  await signIn(page, "Alice");
  await setChatFailure(request, true);
  await say(page, "Hello there");
  const alert = page.getByRole("alert").filter({ hasText: "could not answer right now" });
  await expect(alert).toBeVisible();

  await setChatFailure(request, false);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("log")).toContainText("Mensagem 1 desta conversa: Hello there");
  await expect(alert).toHaveCount(0);
});

test("the conversation region is a polite live region", async ({ page }) => {
  await signIn(page, "Alice");
  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log).toHaveAttribute("aria-live", "polite");
});
