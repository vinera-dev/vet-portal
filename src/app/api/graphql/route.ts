import { createGraphqlServer } from "@/graphql/server";

const { handleRequest } = createGraphqlServer({ useRuntimeFetch: true });

export const dynamic = "force-dynamic";

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
