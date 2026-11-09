import type { Metadata } from "next";
import { ChatPanel } from "@/components/ChatPanel";

export const metadata: Metadata = { title: "Chat with the clinic assistant" };

export default function ChatPage() {
  return (
    <>
      <h1>Chat with the clinic assistant</h1>
      <p>
        The assistant answers questions about the clinic. It does not give medical advice. For an
        emergency, call the clinic right away.
      </p>
      <ChatPanel />
    </>
  );
}
