"use client";

import { useRef, useState, type FormEvent } from "react";
import { sendChatMessage, type ChatReply, type ChatSource } from "@/lib/chat-client";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  escalated?: boolean;
  emergency?: boolean;
  sources?: ChatSource[];
}

interface ChatPanelProps {
  send?: (message: string) => Promise<ChatReply>;
}

const MAX_LENGTH = 2000;
const FALLBACK_ERROR = "The assistant could not answer right now. Please try again in a moment.";

function Escalation({ emergency }: { emergency: boolean }) {
  if (emergency) {
    return (
      <div role="alert" className="alert alert--warning chat-escalation">
        <p>
          <strong>This may be an emergency.</strong> Do not wait for a reply here. Call the clinic
          reception now or take your pet to the nearest emergency vet. Our team has been notified.
        </p>
      </div>
    );
  }
  return (
    <div className="alert alert--info chat-escalation">
      <p>
        <strong>Handed over to our team.</strong> A person from the reception will continue this
        conversation.
      </p>
    </div>
  );
}

function Sources({ sources }: { sources: ChatSource[] }) {
  return (
    <div className="chat-sources">
      <p className="chat-sources__title">Sources</p>
      <ul>
        {sources.map((source) => (
          <li key={source.source}>
            {source.title} <span className="chat-sources__path">({source.source})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChatPanel({ send = sendChatMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ text: string; message: string } | null>(null);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function append(message: Omit<ChatMessage, "id">) {
    const entry = { ...message, id: nextId.current };
    nextId.current += 1;
    setMessages((current) => [...current, entry]);
  }

  async function deliver(text: string) {
    setPending(true);
    setFailure(null);
    try {
      const reply = await send(text);
      append({
        role: "assistant",
        text: reply.reply,
        escalated: reply.escalated,
        emergency: reply.escalated && reply.intent === "emergency",
        sources: reply.sources,
      });
    } catch (caught) {
      setFailure({ text, message: caught instanceof Error ? caught.message : FALLBACK_ERROR });
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) {
      return;
    }
    append({ role: "user", text });
    setDraft("");
    await deliver(text);
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
            {message.escalated ? <Escalation emergency={message.emergency === true} /> : null}
            {message.sources && message.sources.length > 0 ? (
              <Sources sources={message.sources} />
            ) : null}
          </article>
        ))}
      </div>

      {pending ? (
        <p role="status" className="chat-typing">
          Assistant is typing...
        </p>
      ) : null}

      {failure ? (
        <div role="alert" className="alert alert--error">
          <p>{failure.message}</p>
          <button
            type="button"
            className="button button--secondary"
            disabled={pending}
            onClick={() => deliver(failure.text)}
          >
            Try again
          </button>
        </div>
      ) : null}

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
          {pending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
