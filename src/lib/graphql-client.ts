import { print, type DocumentNode } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { ErrorCode } from "@/gql/types";

export type ClientErrorCode = ErrorCode | "NETWORK_ERROR" | "UNKNOWN";

export class GraphqlRequestError extends Error {
  readonly code: ClientErrorCode;

  constructor(code: ClientErrorCode, message: string) {
    super(message);
    this.name = "GraphqlRequestError";
    this.code = code;
  }
}

interface GraphqlResponse<TData> {
  data?: TData | null;
  errors?: { message: string; extensions?: { code?: string } }[];
}

const KNOWN_CODES: readonly string[] = [
  "NOT_FOUND",
  "SLOT_UNAVAILABLE",
  "INVALID_STATUS",
  "PAST_SLOT",
  "OUTSIDE_BUSINESS_HOURS",
  "VALIDATION_ERROR",
  "UPSTREAM_UNAVAILABLE",
  "UPSTREAM_ERROR",
];

function toClientCode(code: string | undefined): ClientErrorCode {
  return code && KNOWN_CODES.includes(code) ? (code as ErrorCode) : "UNKNOWN";
}

export interface ExecuteOptions {
  fetch?: typeof fetch;
  endpoint?: string;
  signal?: AbortSignal;
}

export async function execute<TData, TVariables extends Record<string, unknown>>(
  document: TypedDocumentNode<TData, TVariables> | DocumentNode,
  variables: TVariables,
  options: ExecuteOptions = {},
): Promise<TData> {
  const doFetch = options.fetch ?? fetch;
  let payload: GraphqlResponse<TData>;
  try {
    const response = await doFetch(options.endpoint ?? "/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: print(document), variables }),
      signal: options.signal,
    });
    payload = (await response.json()) as GraphqlResponse<TData>;
  } catch {
    throw new GraphqlRequestError(
      "NETWORK_ERROR",
      "Could not reach the server. Check your connection.",
    );
  }
  if (payload.errors?.length) {
    const [first] = payload.errors;
    throw new GraphqlRequestError(toClientCode(first.extensions?.code), first.message);
  }
  if (!payload.data) {
    throw new GraphqlRequestError("UNKNOWN", "The server returned an empty response.");
  }
  return payload.data;
}
