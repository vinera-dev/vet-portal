import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DaySelector } from "./DaySelector";

const DAYS = ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10"];

function Harness({ initial = "2026-11-06" }: { initial?: string }) {
  const [day, setDay] = useState(initial);
  return <DaySelector days={DAYS} value={day} onChange={setDay} />;
}

describe("DaySelector", () => {
  it("exposes a radio group with the selected day checked", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup", { name: "Choose a day" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("radio", { name: "Fri 6 Nov" })).toBeChecked();
  });

  it("keeps only the selected day in the tab order", () => {
    render(<Harness />);
    expect(screen.getByRole("radio", { name: "Fri 6 Nov" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Sat 7 Nov" })).toHaveAttribute("tabindex", "-1");
  });

  it("moves with the arrow keys and skips closed Sundays", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-11-07" />);
    screen.getByRole("radio", { name: "Sat 7 Nov" }).focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Mon 9 Nov" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Mon 9 Nov" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Sat 7 Nov" })).toBeChecked();
  });

  it("wraps around and supports Home and End", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    screen.getByRole("radio", { name: "Fri 6 Nov" }).focus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Tue 10 Nov" })).toBeChecked();

    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Fri 6 Nov" })).toBeChecked();

    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Tue 10 Nov" })).toBeChecked();
  });

  it("disables closed days", () => {
    render(<Harness />);
    expect(screen.getByRole("radio", { name: "Sun 8 Nov, closed" })).toBeDisabled();
  });

  it("selects with a click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("radio", { name: "Mon 9 Nov" }));
    expect(screen.getByRole("radio", { name: "Mon 9 Nov" })).toBeChecked();
  });
});
