import { createYoga } from "graphql-yoga";
import type { VetApi } from "@/server/vet-api/client";
import type { GraphqlContext } from "./context";
import { maskError } from "./errors";
import { schema } from "./schema";

export interface GraphqlServerOptions {
  api: VetApi;
  logging?: boolean;
  useRuntimeFetch?: boolean;
}

export function createGraphqlServer(options: GraphqlServerOptions) {
  return createYoga<object, GraphqlContext>({
    schema,
    maskedErrors: { maskError },
    context: () => ({ api: options.api }),
    graphqlEndpoint: "/api/graphql",
    logging: options.logging ?? true,
    fetchAPI: options.useRuntimeFetch ? { Response, Request } : undefined,
    graphiql: process.env.NODE_ENV !== "production",
  });
}
