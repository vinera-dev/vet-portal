import { createServer } from "node:http";
import { createFakeBackend } from "./core.ts";

const port = Number(process.env.FAKE_BACKEND_PORT ?? 8765);
const backend = createFakeBackend({
  chatFailure: () => process.env.FAKE_CHAT_FAIL === "1",
});

const server = createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/__reset" && req.method === "POST") {
      backend.reset();
      res.writeHead(204).end();
      return;
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    const result = backend.handle({
      method: req.method ?? "GET",
      path: url.pathname,
      query: url.searchParams,
      body: raw ? JSON.parse(raw) : null,
    });
    res.writeHead(result.status, { "content-type": "application/json" });
    res.end(JSON.stringify(result.body));
  });
});

server.listen(port, "127.0.0.1");
