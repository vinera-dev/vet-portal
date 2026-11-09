import { handleChatPost, handleChatReset } from "@/server/chat";
import { getVetApi } from "@/server/config";

export const dynamic = "force-dynamic";

const secure = process.env.NODE_ENV === "production";

export function POST(request: Request) {
  return handleChatPost(request, { api: getVetApi(), secure });
}

export function DELETE() {
  return handleChatReset({ secure });
}
