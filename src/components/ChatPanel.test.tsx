import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ChatReply } from "@/lib/chat-client";
import { ChatPanel } from "./ChatPanel";

function reply(text: string, extra: Partial<ChatReply> = {}): ChatReply {
  return { reply: text, intent: "faq", escalated: false, grounded: true, sources: [], ...extra };
}

describe("ChatPanel", () => {
  it("exposes the conversation as a polite live region", () => {
    render(<ChatPanel send={async () => reply("Hi")} />);
    const log = screen.getByRole("log", { name: "Conversation" });
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-relevant", "additions");
    expect(log).toHaveAttribute("tabindex", "0");
  });

  it("sends a message and shows the reply inside the live region", async () => {
    const send = jest.fn().mockResolvedValue(reply("We open at 08:00."));
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);

    await user.type(screen.getByLabelText("Your message"), "When do you open?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    const log = screen.getByRole("log", { name: "Conversation" });
    expect(send).toHaveBeenCalledWith("When do you open?");
    expect(within(log).getByText("When do you open?")).toBeVisible();
    expect(await within(log).findByText("We open at 08:00.")).toBeVisible();
    expect(within(log).getByText("Assistant said:")).toBeInTheDocument();
    expect(within(log).getByText("You said:")).toBeInTheDocument();
  });

  it("clears the field and returns focus after sending", async () => {
    const user = userEvent.setup();
    render(<ChatPanel send={async () => reply("Ok")} />);
    const input = screen.getByLabelText("Your message");
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Ok");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("does not send blank messages", async () => {
    const send = jest.fn();
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await user.type(screen.getByLabelText("Your message"), "   ");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps the order of several messages", async () => {
    const send = jest
      .fn()
      .mockResolvedValueOnce(reply("First answer"))
      .mockResolvedValueOnce(reply("Second answer"));
    const user = userEvent.setup();
    render(<ChatPanel send={send} />);
    const input = screen.getByLabelText("Your message");
    await user.type(input, "One");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("First answer");
    await user.type(input, "Two");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Second answer");
    const texts = within(screen.getByRole("log"))
      .getAllByRole("article")
      .map((node) => node.textContent);
    expect(texts).toEqual([
      "You said:One",
      "Assistant said:First answer",
      "You said:Two",
      "Assistant said:Second answer",
    ]);
  });
});
