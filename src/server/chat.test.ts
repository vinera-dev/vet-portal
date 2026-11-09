import { createFakeFetch } from "../../fake-backend/fetch.ts";
import { CHAT_COOKIE, handleChatPost, handleChatReset, readCookie } from "./chat";
import { openSession, sealSession } from "./session-binding";
import { createVetApi } from "./vet-api/client";

const SECRET = "unit-test-secret";

function setup(fetchImpl?: typeof fetch) {
  const fake = createFakeFetch();
  const api = createVetApi({ baseUrl: "http://vet.test", fetch: fetchImpl ?? fake.fetch });
  const options = (userId = "user-a", secure = false) => ({ api, secure, userId, secret: SECRET });
  return { fake, api, options };
}

function post(body: unknown, cookie?: string): Request {
  return new Request("http://127.0.0.1/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function cookieFrom(response: Response): string {
  const header = response.headers.get("set-cookie") ?? "";
  return header.split(";")[0];
}

describe("chat route handler", () => {
  it("sets an httpOnly session cookie and never exposes the session id", async () => {
    const { options } = setup();
    const response = await handleChatPost(post({ message: "Hello" }), options("user-a", true));
    expect(response.status).toBe(200);
    const header = response.headers.get("set-cookie") ?? "";
    expect(header).toContain(`${CHAT_COOKIE}=`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Secure");
    const payload = await response.json();
    expect(payload).not.toHaveProperty("session_id");
    expect(payload.reply).toContain("Mensagem 1");
  });

  it("keeps the context across messages through the cookie", async () => {
    const { options } = setup();
    const first = await handleChatPost(post({ message: "My dog is Rex" }), options());
    const cookie = cookieFrom(first);
    const second = await handleChatPost(post({ message: "How old?" }, cookie), options());
    const payload = await second.json();
    expect(payload.reply).toContain("Mensagem 2");
    expect(payload.reply).toContain("My dog is Rex | How old?");
  });

  it("gives different users separate conversations even with the same cookie", async () => {
    const { options } = setup();
    const first = await handleChatPost(post({ message: "Alice secret" }), options("user-a"));
    const cookie = cookieFrom(first);
    const other = await handleChatPost(post({ message: "Bob here" }, cookie), options("user-b"));
    const payload = await other.json();
    expect(payload.reply).toContain("Mensagem 1");
    expect(payload.reply).not.toContain("Alice secret");
  });

  it("ignores a tampered cookie", async () => {
    const { options } = setup();
    const first = await handleChatPost(post({ message: "One" }), options());
    const cookie = `${cookieFrom(first)}x`;
    const second = await handleChatPost(post({ message: "Two" }, cookie), options());
    expect((await second.json()).reply).toContain("Mensagem 1");
  });

  it("starts separate conversations without a cookie", async () => {
    const { options } = setup();
    await handleChatPost(post({ message: "One" }), options());
    const other = await handleChatPost(post({ message: "Two" }), options());
    expect((await other.json()).reply).toContain("Mensagem 1");
  });

  it("forwards sources and the escalation flag", async () => {
    const { options } = setup();
    const faq = await handleChatPost(post({ message: "Which vaccines?" }), options());
    const faqPayload = await faq.json();
    expect(faqPayload.grounded).toBe(true);
    expect(faqPayload.sources[0]).toEqual({
      source: "faq/vacinas.md",
      title: "Vacinas",
      score: 0.91,
    });
    const emergency = await handleChatPost(post({ message: "He was poisoned" }), options());
    const payload = await emergency.json();
    expect(payload).toMatchObject({ escalated: true, intent: "emergency" });
  });

  it("rejects an empty or oversized message", async () => {
    const { options } = setup();
    const empty = await handleChatPost(post({ message: "   " }), options());
    expect(empty.status).toBe(400);
    const huge = await handleChatPost(post({ message: "a".repeat(2001) }), options());
    expect(huge.status).toBe(400);
    const broken = await handleChatPost(post("not json"), options());
    expect(broken.status).toBe(400);
  });

  it("returns a friendly error when the backend is down", async () => {
    const { options } = setup((async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch);
    const response = await handleChatPost(post({ message: "Hello" }), options());
    expect(response.status).toBe(502);
    expect(response.headers.get("set-cookie")).toBeNull();
    const payload = await response.json();
    expect(payload.error.code).toBe("assistant_unavailable");
    expect(payload.error.message).toMatch(/try again/i);
  });

  it("clears the cookie on reset", () => {
    const response = handleChatReset({ secure: false });
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

describe("session binding", () => {
  it("opens a sealed session for the same user only", () => {
    const sealed = sealSession("user-a", "session-9", SECRET);
    expect(openSession(sealed, "user-a", SECRET)).toBe("session-9");
    expect(openSession(sealed, "user-b", SECRET)).toBeNull();
  });

  it("rejects a different secret, a missing value and garbage", () => {
    const sealed = sealSession("user-a", "session-9", SECRET);
    expect(openSession(sealed, "user-a", "other-secret")).toBeNull();
    expect(openSession(null, "user-a", SECRET)).toBeNull();
    expect(openSession("garbage", "user-a", SECRET)).toBeNull();
    expect(openSession("v1.a.b.c", "user-a", SECRET)).toBeNull();
  });

  it("handles user ids and session ids that contain dots", () => {
    const sealed = sealSession("test:Ana.Souza", "a.b.c", SECRET);
    expect(openSession(sealed, "test:Ana.Souza", SECRET)).toBe("a.b.c");
  });
});

describe("readCookie", () => {
  it("finds a cookie among several", () => {
    expect(readCookie("a=1; vet_chat_session=abc%20d; b=2", CHAT_COOKIE)).toBe("abc d");
  });

  it("returns null when absent", () => {
    expect(readCookie(null, CHAT_COOKIE)).toBeNull();
    expect(readCookie("a=1", CHAT_COOKIE)).toBeNull();
  });
});
