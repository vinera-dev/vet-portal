import { createGraphqlServer } from "@/graphql/server";
import { getVetApi } from "@/server/config";

const yoga = createGraphqlServer({ api: getVetApi(), useRuntimeFetch: true });

export const dynamic = "force-dynamic";

function handler(request: Request) {
  return yoga.handleRequest(request, {});
}

export { handler as GET, handler as POST, handler as OPTIONS };
