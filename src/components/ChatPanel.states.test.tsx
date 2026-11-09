import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatRequestError, type ChatReply } from "@/lib/chat-client";
import { ChatPanel } from "./ChatPanel";

function reply(text: string, extra: Partial<ChatReply> = {}): ChatReply {
  return { reply: text, intent: "faq", escalated: false, grounded: true, sources: [], ...extra };
}

async function say(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText("Your message"), text);
  await user.click(screen.getByRole("button", { name: "Send" }));
}

describe("ChatPanel states", () => {
  it("shows a typing status while waiting and blocks a second send", async () => {
    let finish: (value: ChatReply) => void = () => undefined;
    const send = jest.fn(() => new Promise<ChatReply>((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);

    await say(user, "Hello");
    expect(screen.getByRole("status")).toHaveTextContent("Assistant is typing");
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();

    finish(reply("Hi there"));
    expect(await screen.findByText("Hi there")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a clear error when the assistant fails and recovers on retry", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(
        new ChatRequestError("assistant_unavailable", "The assistant is busy."),
      )
      .mockResolvedValueOnce(reply("Back again"));
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);

    await say(user, "Hello");
    expect(await screen.findByRole("alert")).toHaveTextContent("The assistant is busy.");
    expect(within(screen.getByRole("log")).getByText("Hello")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Back again")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith("Hello");
    expect(within(screen.getByRole("log")).getAllByText("Hello")).toHaveLength(1);
  });

  it("falls back to a generic message for unknown failures", async () => {
    const send = jest.fn().mockRejectedValue("boom");
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);
    await say(user, "Hello");
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not answer right now/);
  });

  it("lists the sources of an answer", async () => {
    const send = jest.fn().mockResolvedValue(
      reply("Vaccines are yearly.", {
        sources: [
          { source: "faq/vacinas.md", title: "Vaccines", score: 0.9 },
          { source: "faq/horarios.md", title: "Hours", score: 0.5 },
        ],
      }),
    );
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);
    await say(user, "vaccines?");
    expect(await screen.findByText("Sources")).toBeVisible();
    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toEqual(["Vaccines (faq/vacinas.md)", "Hours (faq/horarios.md)"]);
  });

  it("omits the sources block when there are none", async () => {
    const user = userEvent.setup();
    render(<ChatPanel send={async () => reply("Hello!")} />);
    await say(user, "Hi");
    await screen.findByText("Hello!");
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
  });

  it("shows the emergency notice when the case is escalated", async () => {
    const send = jest
      .fn()
      .mockResolvedValue(
        reply("Call now.", { escalated: true, intent: "emergency", grounded: null }),
      );
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);
    await say(user, "my dog was poisoned");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This may be an emergency.");
    expect(alert).toHaveTextContent("Call the clinic reception now");
  });

  it("shows a hand-over notice for other escalations without an alarm", async () => {
    const send = jest
      .fn()
      .mockResolvedValue(reply("Passing you on.", { escalated: true, intent: "handoff" }));
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);
    await say(user, "I want a human");
    expect(await screen.findByText("Handed over to our team.")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows no escalation notice for a normal answer", async () => {
    const user = userEvent.setup();
    render(<ChatPanel send={async () => reply("Fine.")} />);
    await say(user, "Hi");
    await screen.findByText("Fine.");
    expect(screen.queryByText(/emergency/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Handed over/)).not.toBeInTheDocument();
  });
});
