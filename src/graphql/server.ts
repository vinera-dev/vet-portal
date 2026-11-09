import { createYoga } from "graphql-yoga";
import { schema } from "./schema";

export interface GraphqlServerOptions {
  logging?: boolean;
  useRuntimeFetch?: boolean;
}

export function createGraphqlServer(options: GraphqlServerOptions = {}) {
  return createYoga({
    schema,
    graphqlEndpoint: "/api/graphql",
    logging: options.logging ?? true,
    fetchAPI: options.useRuntimeFetch ? { Response, Request } : undefined,
    graphiql: process.env.NODE_ENV !== "production",
  });
}
