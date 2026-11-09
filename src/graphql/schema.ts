import { createSchema } from "graphql-yoga";
import type { GraphqlContext } from "./context";
import { resolvers } from "./resolvers";
import { typeDefs } from "./typeDefs";

export const schema = createSchema<GraphqlContext>({ typeDefs, resolvers });
