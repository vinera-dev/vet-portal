import { z } from "zod";
import { openSession, sealSession } from "./session-binding";
import type { VetApi } from "./vet-api/client";
import { VetApiError } from "./vet-api/errors";
import type { RestSource } from "./vet-api/types";

export const CHAT_COOKIE = "vet_chat_session";
export const MAX_MESSAGE_LENGTH = 2000;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

const bodySchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export interface ChatReplyPayload {
  reply: string;
  intent: string;
  escalated: boolean;
  grounded: boolean | null;
  sources: RestSource[];
}

export interface ChatErrorPayload {
  error: { code: string; message: string };
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() === name) {
      const raw = part.slice(separator + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function sessionCookie(value: string, secure: boolean): string {
  const parts = [
    `${CHAT_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function clearedSessionCookie(secure: boolean): string {
  const parts = [`${CHAT_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function errorResponse(status: number, code: string, message: string): Response {
  const payload: ChatErrorPayload = { error: { code, message } };
  return Response.json(payload, { status, headers: { "cache-control": "no-store" } });
}

export interface ChatHandlerOptions {
  api: VetApi;
  secure: boolean;
  userId: string;
  secret: string;
}

export async function handleChatPost(
  request: Request,
  { api, secure, userId, secret }: ChatHandlerOptions,
): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorResponse(400, "invalid_request", "The request body must be valid JSON.");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(
      400,
      "invalid_message",
      `Write a message of up to ${MAX_MESSAGE_LENGTH} characters.`,
    );
  }

  const sessionId = openSession(
    readCookie(request.headers.get("cookie"), CHAT_COOKIE),
    userId,
    secret,
  );

  try {
    const reply = await api.chat({ message: parsed.data.message, session_id: sessionId });
    const payload: ChatReplyPayload = {
      reply: reply.reply,
      intent: reply.intent,
      escalated: reply.escalated,
      grounded: reply.grounded ?? null,
      sources: reply.sources,
    };
    const response = Response.json(payload, { headers: { "cache-control": "no-store" } });
    response.headers.append(
      "set-cookie",
      sessionCookie(sealSession(userId, reply.session_id, secret), secure),
    );
    return response;
  } catch (error) {
    if (error instanceof VetApiError) {
      const status = error.code === "validation_error" ? 400 : 502;
      return errorResponse(
        status,
        error.code === "upstream_unavailable" ? "assistant_unavailable" : "assistant_error",
        "The assistant could not answer right now. Please try again in a moment.",
      );
    }
    return errorResponse(500, "internal_error", "Something went wrong. Please try again.");
  }
}

export function handleChatReset({ secure }: { secure: boolean }): Response {
  const response = new Response(null, { status: 204 });
  response.headers.append("set-cookie", clearedSessionCookie(secure));
  return response;
}
