import type { ZodType } from "zod";
import { errorFromResponse, VetApiError } from "./errors";
import {
  agentReplySchema,
  appointmentSchema,
  slotsSchema,
  type BookRequest,
  type ChatRequest,
  type RescheduleRequest,
  type RestAgentReply,
  type RestAppointment,
} from "./types";

export interface VetApiOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface VetApi {
  listSlots(day: string): Promise<string[]>;
  bookAppointment(input: BookRequest): Promise<RestAppointment>;
  getAppointment(id: string): Promise<RestAppointment>;
  rescheduleAppointment(id: string, input: RescheduleRequest): Promise<RestAppointment>;
  cancelAppointment(id: string): Promise<RestAppointment>;
  chat(input: ChatRequest): Promise<RestAgentReply>;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export function createVetApi(options: VetApiOptions): VetApi {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request<T>(
    method: string,
    path: string,
    schema: ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method,
        headers: body === undefined ? undefined : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
    } catch {
      throw new VetApiError(0, "upstream_unavailable", "The clinic service is unreachable");
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw errorFromResponse(response.status, payload);
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new VetApiError(
        response.status,
        "invalid_response",
        "The clinic service returned an unexpected payload",
      );
    }
    return parsed.data;
  }

  return {
    listSlots: (day) =>
      request("GET", `/appointments/slots?day=${encodeURIComponent(day)}`, slotsSchema),
    bookAppointment: (input) => request("POST", "/appointments", appointmentSchema, input),
    getAppointment: (id) =>
      request("GET", `/appointments/${encodeURIComponent(id)}`, appointmentSchema),
    rescheduleAppointment: (id, input) =>
      request("PATCH", `/appointments/${encodeURIComponent(id)}`, appointmentSchema, input),
    cancelAppointment: (id) =>
      request("DELETE", `/appointments/${encodeURIComponent(id)}`, appointmentSchema),
    chat: (input) => request("POST", "/agent/chat", agentReplySchema, input),
  };
}
