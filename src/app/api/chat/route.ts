import { auth } from "@/auth";
import { readAuthEnv } from "@/auth/env";
import { handleChatPost, handleChatReset } from "@/server/chat";
import { getVetApi } from "@/server/config";

export const dynamic = "force-dynamic";

const { secret, production } = readAuthEnv();

function unauthenticated(): Response {
  return Response.json(
    { error: { code: "unauthenticated", message: "Sign in to use the assistant." } },
    { status: 401 },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthenticated();
  }
  if (!secret) {
    return Response.json(
      { error: { code: "misconfigured", message: "The server is not configured." } },
      { status: 500 },
    );
  }
  return handleChatPost(request, {
    api: getVetApi(),
    secure: production,
    userId: session.user.id,
    secret,
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthenticated();
  }
  return handleChatReset({ secure: production });
}
