import { createFakeBackend, type FakeBackend, type FakeBackendOptions } from "./core.ts";

export interface FakeFetch {
  fetch: typeof fetch;
  backend: FakeBackend;
  calls: { method: string; url: string }[];
}

export function createFakeFetch(options: FakeBackendOptions = {}): FakeFetch {
  const backend = createFakeBackend(options);
  const calls: { method: string; url: string }[] = [];
  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    calls.push({ method: request.method, url: request.url });
    const text = await request.text();
    const result = backend.handle({
      method: request.method,
      path: url.pathname,
      query: url.searchParams,
      body: text ? JSON.parse(text) : null,
    });
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "content-type": "application/json" },
    });
  };
  return { fetch: fakeFetch as typeof fetch, backend, calls };
}
