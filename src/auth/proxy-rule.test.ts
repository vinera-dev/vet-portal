import { isProtectedPath } from "./access";
import { applyAccess, type ProxyRequest } from "./proxy-rule";

function request(path: string, signedIn: boolean): ProxyRequest {
  return {
    auth: signedIn ? { user: { id: "user-1" } } : null,
    nextUrl: new URL(path, "http://127.0.0.1:3000"),
  };
}

describe("route protection", () => {
  it("redirects anonymous page visits to the sign in page and remembers the target", () => {
    const response = applyAccess(request("/chat", false));
    expect(response?.status).toBe(307);
    const location = new URL(response?.headers.get("location") ?? "");
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("callbackUrl")).toBe("/chat");
  });

  it("keeps the query string in the callback", () => {
    const response = applyAccess(request("/chat?topic=vaccines", false));
    const location = new URL(response?.headers.get("location") ?? "");
    expect(location.searchParams.get("callbackUrl")).toBe("/chat?topic=vaccines");
  });

  it("answers anonymous API calls with 401 instead of a redirect", async () => {
    const response = applyAccess(request("/api/chat", false));
    expect(response?.status).toBe(401);
    expect(response?.headers.get("location")).toBeNull();
    expect((await response?.json()).error.code).toBe("unauthenticated");
  });

  it("lets signed in users through", () => {
    expect(applyAccess(request("/chat", true))).toBeUndefined();
    expect(applyAccess(request("/api/chat", true))).toBeUndefined();
  });

  it("leaves public pages alone", () => {
    for (const path of [
      "/",
      "/book",
      "/appointment",
      "/sign-in",
      "/api/graphql",
      "/api/auth/session",
    ]) {
      expect(applyAccess(request(path, false))).toBeUndefined();
    }
  });

  it("knows which paths are protected", () => {
    expect(isProtectedPath("/chat")).toBe(true);
    expect(isProtectedPath("/chat/history")).toBe(true);
    expect(isProtectedPath("/api/chat")).toBe(true);
    expect(isProtectedPath("/chatter")).toBe(false);
    expect(isProtectedPath("/book")).toBe(false);
  });
});
