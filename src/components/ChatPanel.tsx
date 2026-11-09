"use client";

import { useRef, useState, type FormEvent } from "react";
import { sendChatMessage, type ChatReply } from "@/lib/chat-client";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  send?: (message: string) => Promise<ChatReply>;
}

const MAX_LENGTH = 2000;

export function ChatPanel({ send = sendChatMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function append(role: ChatMessage["role"], text: string) {
    const message = { id: nextId.current, role, text };
    nextId.current += 1;
    setMessages((current) => [...current, message]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) {
      return;
    }
    append("user", text);
    setDraft("");
    setPending(true);
    try {
      const reply = await send(text);
      append("assistant", reply.reply);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="chat">
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversation"
        className="chat-log"
      >
        {messages.length === 0 ? (
          <p className="chat-empty">Ask about opening hours, services, prices or vaccines.</p>
        ) : null}
        {messages.map((message) => (
          <article
            key={message.id}
            className={message.role === "user" ? "chat-message chat-message--user" : "chat-message"}
          >
            <p className="visually-hidden">
              {message.role === "user" ? "You said:" : "Assistant said:"}
            </p>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="chat-form" aria-label="Send a message">
        <label htmlFor="chat-input">Your message</label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={3}
          maxLength={MAX_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="button" disabled={pending || draft.trim() === ""}>
          Send
        </button>
      </form>
    </div>
  );
}
