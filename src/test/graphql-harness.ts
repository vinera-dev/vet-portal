import { createFakeFetch } from "../../fake-backend/fetch.ts";
import { createGraphqlServer } from "@/graphql/server";
import { createVetApi } from "@/server/vet-api/client";

export const TEST_NOW = new Date(2026, 10, 2, 7, 0, 0);
export const MONDAY = "2026-11-09";
export const SUNDAY = "2026-11-08";

interface GraphqlResult<T> {
  data?: T | null;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}

export function createHarness() {
  const fake = createFakeFetch({ now: () => TEST_NOW });
  const api = createVetApi({ baseUrl: "http://vet.test", fetch: fake.fetch });
  const yoga = createGraphqlServer({ api, logging: false });

  async function run<T = Record<string, unknown>>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<GraphqlResult<T>> {
    const response = await yoga.fetch("http://127.0.0.1/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    return (await response.json()) as GraphqlResult<T>;
  }

  return { run, fake };
}
