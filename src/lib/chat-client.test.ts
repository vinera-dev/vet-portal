import { createFakeFetch } from "../../fake-backend/fetch.ts";
import { handleChatPost } from "@/server/chat";
import { createVetApi } from "@/server/vet-api/client";
import { ChatRequestError, resetChat, sendChatMessage } from "./chat-client";

function routeFetch(backend: typeof fetch) {
  const api = createVetApi({ baseUrl: "http://vet.test", fetch: backend });
  let cookie = "";
  return (async (_url: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request("http://127.0.0.1/api/chat", {
      ...init,
      headers: { ...(init?.headers as Record<string, string>), ...(cookie ? { cookie } : {}) },
    });
    const response = await handleChatPost(request, {
      api,
      secure: false,
      userId: "user-a",
      secret: "unit-test-secret",
    });
    const set = response.headers.get("set-cookie");
    if (set) {
      cookie = set.split(";")[0];
    }
    return response;
  }) as typeof fetch;
}

describe("chat client", () => {
  it("keeps context through the route handler cookie", async () => {
    const fetchImpl = routeFetch(createFakeFetch().fetch);
    await sendChatMessage("My dog is Rex", { fetch: fetchImpl });
    const second = await sendChatMessage("How old?", { fetch: fetchImpl });
    expect(second.reply).toContain("My dog is Rex | How old?");
  });

  it("returns sources and the escalation flag", async () => {
    const fetchImpl = routeFetch(createFakeFetch().fetch);
    const faq = await sendChatMessage("vaccines?", { fetch: fetchImpl });
    expect(faq.sources).toHaveLength(2);
    const emergency = await sendChatMessage("poison", { fetch: fetchImpl });
    expect(emergency.escalated).toBe(true);
  });

  it("raises a friendly error when the backend is down", async () => {
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const error = await sendChatMessage("hi", { fetch: routeFetch(down) }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ChatRequestError);
    expect(error).toMatchObject({ code: "assistant_unavailable" });
  });

  it("raises a network error when the portal itself is unreachable", async () => {
    const offline = (async () => {
      throw new TypeError("offline");
    }) as typeof fetch;
    await expect(sendChatMessage("hi", { fetch: offline })).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("rejects a malformed reply", async () => {
    const broken = (async () => Response.json({ nothing: true })) as typeof fetch;
    await expect(sendChatMessage("hi", { fetch: broken })).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("resets without throwing when offline", async () => {
    const offline = (async () => {
      throw new TypeError("offline");
    }) as typeof fetch;
    await expect(resetChat({ fetch: offline })).resolves.toBeUndefined();
  });
});
