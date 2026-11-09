import { createFakeFetch } from "../../fake-backend/fetch.ts";
import { createGraphqlServer } from "@/graphql/server";
import { createVetApi, type VetApi } from "@/server/vet-api/client";
import { MONDAY } from "@/test/graphql-harness";

function serverWith(fetchImpl: typeof fetch) {
  const api = createVetApi({ baseUrl: "http://vet.test", fetch: fetchImpl });
  const yoga = createGraphqlServer({ api, logging: false });
  return async (query: string, variables: Record<string, unknown> = {}) => {
    const response = await yoga.fetch("http://127.0.0.1/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    return (await response.json()) as {
      data?: unknown;
      errors?: { message: string; extensions?: Record<string, unknown> }[];
    };
  };
}

const SLOTS = "query($day: Date!) { slots(day: $day) { time } }";

describe("upstream failures", () => {
  it("reports an unreachable backend as UPSTREAM_UNAVAILABLE", async () => {
    const run = serverWith((async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch);
    const result = await run(SLOTS, { day: MONDAY });
    expect(result.errors?.[0].extensions).toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
  });

  it("reports a backend 500 as UPSTREAM_ERROR", async () => {
    const run = serverWith((async () =>
      Response.json({ detail: "boom" }, { status: 500 })) as typeof fetch);
    const result = await run(SLOTS, { day: MONDAY });
    expect(result.errors?.[0].extensions).toMatchObject({
      code: "UPSTREAM_ERROR",
      upstreamStatus: 500,
    });
  });

  it("reports a malformed backend payload as UPSTREAM_ERROR", async () => {
    const run = serverWith((async () => Response.json({ not: "a list" })) as typeof fetch);
    const result = await run(SLOTS, { day: MONDAY });
    expect(result.errors?.[0].extensions?.code).toBe("UPSTREAM_ERROR");
  });

  it("masks unexpected resolver errors", async () => {
    const api = {
      listSlots: async () => {
        throw new Error("secret internal detail");
      },
    } as unknown as VetApi;
    const yoga = createGraphqlServer({ api, logging: false });
    const response = await yoga.fetch("http://127.0.0.1/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: SLOTS, variables: { day: MONDAY } }),
    });
    const text = await response.text();
    expect(text).not.toContain("secret internal detail");
    expect(text).toContain("INTERNAL_SERVER_ERROR");
  });
});

describe("scalars", () => {
  it("rejects a malformed LocalDateTime variable", async () => {
    const fake = createFakeFetch();
    const run = serverWith(fake.fetch);
    const result = await run(
      "mutation($id: ID!, $s: LocalDateTime!) { rescheduleAppointment(id: $id, newStart: $s) { id } }",
      { id: "x", s: "tomorrow" },
    );
    expect(result.errors?.[0].message).toContain("LocalDateTime");
  });
});
