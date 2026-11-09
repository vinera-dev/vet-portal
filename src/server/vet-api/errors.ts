export type VetApiErrorCode =
  | "not_found"
  | "slot_unavailable"
  | "invalid_status"
  | "past_slot"
  | "outside_business_hours"
  | "validation_error"
  | "upstream_unavailable"
  | "upstream_error"
  | "invalid_response";

export class VetApiError extends Error {
  readonly status: number;
  readonly code: VetApiErrorCode;

  constructor(status: number, code: VetApiErrorCode, message: string) {
    super(message);
    this.name = "VetApiError";
    this.status = status;
    this.code = code;
  }
}

const KNOWN_CODES: readonly VetApiErrorCode[] = [
  "not_found",
  "slot_unavailable",
  "invalid_status",
  "past_slot",
  "outside_business_hours",
];

function isKnownCode(value: unknown): value is VetApiErrorCode {
  return typeof value === "string" && (KNOWN_CODES as readonly string[]).includes(value);
}

function describeValidation(detail: unknown[]): string {
  return detail
    .map((entry) => {
      if (entry && typeof entry === "object" && "msg" in entry) {
        return String((entry as { msg: unknown }).msg);
      }
      return "Invalid value";
    })
    .join("; ");
}

export function errorFromResponse(status: number, payload: unknown): VetApiError {
  const detail =
    payload && typeof payload === "object" && "detail" in payload
      ? (payload as { detail: unknown }).detail
      : undefined;

  if (detail && typeof detail === "object" && !Array.isArray(detail) && "code" in detail) {
    const { code, message } = detail as { code: unknown; message?: unknown };
    if (isKnownCode(code)) {
      return new VetApiError(status, code, typeof message === "string" ? message : code);
    }
  }
  if (status === 422 && Array.isArray(detail)) {
    return new VetApiError(status, "validation_error", describeValidation(detail));
  }
  if (status === 404) {
    return new VetApiError(status, "not_found", "Resource not found");
  }
  if (status === 502 || status === 503 || status === 504) {
    return new VetApiError(status, "upstream_unavailable", "The clinic service is unavailable");
  }
  return new VetApiError(status, "upstream_error", `Unexpected response (${status})`);
}
