import { GraphQLError } from "graphql";
import { VetApiError, type VetApiErrorCode } from "@/server/vet-api/errors";
import type { ErrorCode } from "@/gql/generated";

const CODE_MAP: Record<VetApiErrorCode, ErrorCode> = {
  not_found: "NOT_FOUND",
  slot_unavailable: "SLOT_UNAVAILABLE",
  invalid_status: "INVALID_STATUS",
  past_slot: "PAST_SLOT",
  outside_business_hours: "OUTSIDE_BUSINESS_HOURS",
  validation_error: "VALIDATION_ERROR",
  upstream_unavailable: "UPSTREAM_UNAVAILABLE",
  upstream_error: "UPSTREAM_ERROR",
  invalid_response: "UPSTREAM_ERROR",
};

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NOT_FOUND: "We could not find an appointment with that code.",
  SLOT_UNAVAILABLE: "That time is no longer available. Please choose another one.",
  INVALID_STATUS: "This appointment is already cancelled.",
  PAST_SLOT: "That time has already passed. Please choose a future time.",
  OUTSIDE_BUSINESS_HOURS: "We are open Monday to Saturday, 08:00 to 18:00, in 30 minute slots.",
  VALIDATION_ERROR: "Some of the information provided is not valid.",
  UPSTREAM_UNAVAILABLE: "The clinic system is unavailable right now. Please try again shortly.",
  UPSTREAM_ERROR: "Something went wrong on our side. Please try again.",
};

export function toGraphQLError(
  error: VetApiError,
  location?: { nodes?: GraphQLError["nodes"]; path?: GraphQLError["path"] },
): GraphQLError {
  const code = CODE_MAP[error.code];
  return new GraphQLError(ERROR_MESSAGES[code], {
    nodes: location?.nodes,
    path: location?.path,
    originalError: error,
    extensions: { code, upstreamStatus: error.status },
  });
}

export function maskError(error: unknown): GraphQLError {
  if (error instanceof GraphQLError && error.originalError instanceof VetApiError) {
    return toGraphQLError(error.originalError, { nodes: error.nodes, path: error.path });
  }
  if (error instanceof GraphQLError && error.originalError instanceof GraphQLError) {
    return error;
  }
  return new GraphQLError("Unexpected error.", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}
