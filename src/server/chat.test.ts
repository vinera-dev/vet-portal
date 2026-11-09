import { createFakeFetch } from "../../fake-backend/fetch.ts";
import { CHAT_COOKIE, handleChatPost, handleChatReset, readCookie } from "./chat";
import { createVetApi } from "./vet-api/client";

function setup(fetchImpl?: typeof fetch) {
  const fake = createFakeFetch();
  const api = createVetApi({ baseUrl: "http://vet.test", fetch: fetchImpl ?? fake.fetch });
  return { fake, api };
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
    const { api } = setup();
    const response = await handleChatPost(post({ message: "Hello" }), { api, secure: true });
    expect(response.status).toBe(200);
    const header = response.headers.get("set-cookie") ?? "";
    expect(header).toContain(`${CHAT_COOKIE}=session-1`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Secure");
    const payload = await response.json();
    expect(payload).not.toHaveProperty("session_id");
    expect(payload.reply).toContain("Mensagem 1");
  });

  it("keeps the context across messages through the cookie", async () => {
    const { api } = setup();
    const first = await handleChatPost(post({ message: "My dog is Rex" }), { api, secure: false });
    const cookie = cookieFrom(first);
    const second = await handleChatPost(post({ message: "How old?" }, cookie), {
      api,
      secure: false,
    });
    const payload = await second.json();
    expect(payload.reply).toContain("Mensagem 2");
    expect(payload.reply).toContain("My dog is Rex | How old?");
  });

  it("starts separate conversations without a cookie", async () => {
    const { api } = setup();
    await handleChatPost(post({ message: "One" }), { api, secure: false });
    const other = await handleChatPost(post({ message: "Two" }), { api, secure: false });
    expect((await other.json()).reply).toContain("Mensagem 1");
  });

  it("forwards sources and the escalation flag", async () => {
    const { api } = setup();
    const faq = await handleChatPost(post({ message: "Which vaccines?" }), {
      api,
      secure: false,
    });
    const faqPayload = await faq.json();
    expect(faqPayload.grounded).toBe(true);
    expect(faqPayload.sources[0]).toEqual({
      source: "faq/vacinas.md",
      title: "Vacinas",
      score: 0.91,
    });
    const emergency = await handleChatPost(post({ message: "He was poisoned" }), {
      api,
      secure: false,
    });
    const payload = await emergency.json();
    expect(payload).toMatchObject({ escalated: true, intent: "emergency" });
  });

  it("rejects an empty or oversized message", async () => {
    const { api } = setup();
    const empty = await handleChatPost(post({ message: "   " }), { api, secure: false });
    expect(empty.status).toBe(400);
    const huge = await handleChatPost(post({ message: "a".repeat(2001) }), { api, secure: false });
    expect(huge.status).toBe(400);
    const broken = await handleChatPost(post("not json"), { api, secure: false });
    expect(broken.status).toBe(400);
  });

  it("returns a friendly error when the backend is down", async () => {
    const { api } = setup((async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch);
    const response = await handleChatPost(post({ message: "Hello" }), { api, secure: false });
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

describe("readCookie", () => {
  it("finds a cookie among several", () => {
    expect(readCookie("a=1; vet_chat_session=abc%20d; b=2", CHAT_COOKIE)).toBe("abc d");
  });

  it("returns null when absent", () => {
    expect(readCookie(null, CHAT_COOKIE)).toBeNull();
    expect(readCookie("a=1", CHAT_COOKIE)).toBeNull();
  });
});
