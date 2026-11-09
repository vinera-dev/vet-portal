import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { fetchSlotTimes } from "@/lib/booking-api";
import { gridTimes } from "@/lib/clinic";
import { BookingForm } from "./BookingForm";
import { ChatPanel } from "./ChatPanel";
import { DaySelector } from "./DaySelector";
import { SlotPicker } from "./SlotPicker";

jest.mock("@/lib/booking-api");

describe("component accessibility", () => {
  it("DaySelector has no violations", async () => {
    const { container } = render(
      <DaySelector
        days={["2026-11-07", "2026-11-08", "2026-11-09"]}
        value="2026-11-07"
        onChange={() => undefined}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SlotPicker has no violations", async () => {
    jest.mocked(fetchSlotTimes).mockResolvedValue(gridTimes().slice(0, 5));
    const { container } = render(
      <SlotPicker day="2026-11-09" selected="08:30" onSelect={() => undefined} />,
    );
    await screen.findByRole("button", { name: "08:00" });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("BookingForm has no violations with errors showing", async () => {
    const user = userEvent.setup();
    const { container } = render(<BookingForm hasSlot={false} onSubmit={() => undefined} />);
    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ChatPanel has no violations with an escalated answer", async () => {
    const user = userEvent.setup();
    const send = async () => ({
      reply: "Call now.",
      intent: "emergency",
      escalated: true,
      grounded: null,
      sources: [{ source: "faq/a.md", title: "A", score: 1 }],
    });
    const { container } = render(<ChatPanel send={send} />);
    await user.type(screen.getByLabelText("Your message"), "emergency");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Call now.");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("detects a real violation", async () => {
    const { container } = render(<button type="button" />);
    expect((await axe(container)).violations.length).toBeGreaterThan(0);
  });
});
