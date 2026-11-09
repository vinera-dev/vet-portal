import { createGraphqlServer } from "@/graphql/server";

const yoga = createGraphqlServer({ useRuntimeFetch: true });

export const dynamic = "force-dynamic";

function handler(request: Request) {
  return yoga.handleRequest(request, {});
}

export { handler as GET, handler as POST, handler as OPTIONS };
