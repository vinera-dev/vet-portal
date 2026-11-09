export interface ChatSource {
  source: string;
  title: string;
  score: number;
}

export interface ChatReply {
  reply: string;
  intent: string;
  escalated: boolean;
  grounded: boolean | null;
  sources: ChatSource[];
}

export class ChatRequestError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ChatRequestError";
    this.code = code;
  }
}

const NETWORK_MESSAGE = "We could not reach the assistant. Check your connection and try again.";
const GENERIC_MESSAGE = "The assistant could not answer right now. Please try again in a moment.";

export interface SendOptions {
  fetch?: typeof fetch;
  endpoint?: string;
}

export async function sendChatMessage(
  message: string,
  options: SendOptions = {},
): Promise<ChatReply> {
  const doFetch = options.fetch ?? fetch;
  let response: Response;
  try {
    response = await doFetch(options.endpoint ?? "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch {
    throw new ChatRequestError("network_error", NETWORK_MESSAGE);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as { error: { code?: string; message?: string } }).error
        : undefined;
    throw new ChatRequestError(error?.code ?? "unknown", error?.message ?? GENERIC_MESSAGE);
  }

  const data = payload as Partial<ChatReply> | null;
  if (!data || typeof data.reply !== "string") {
    throw new ChatRequestError("invalid_response", GENERIC_MESSAGE);
  }
  return {
    reply: data.reply,
    intent: data.intent ?? "unknown",
    escalated: data.escalated === true,
    grounded: data.grounded ?? null,
    sources: Array.isArray(data.sources) ? data.sources : [],
  };
}

export async function resetChat(options: SendOptions = {}): Promise<void> {
  const doFetch = options.fetch ?? fetch;
  try {
    await doFetch(options.endpoint ?? "/api/chat", { method: "DELETE" });
  } catch {
    return;
  }
}
