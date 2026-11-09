import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphqlRequestError } from "@/lib/graphql-client";
import { fetchSlotTimes } from "@/lib/booking-api";
import { SlotPicker } from "./SlotPicker";

jest.mock("@/lib/booking-api");

const mockedFetch = jest.mocked(fetchSlotTimes);
const MONDAY = "2026-11-09";

afterEach(() => {
  mockedFetch.mockReset();
});

describe("SlotPicker", () => {
  it("shows a loading state first", async () => {
    mockedFetch.mockReturnValue(new Promise(() => undefined));
    render(<SlotPicker day={MONDAY} selected={null} onSelect={() => undefined} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading available times");
  });

  it("shows free and unavailable times once loaded", async () => {
    mockedFetch.mockResolvedValue(["08:00", "09:30"]);
    render(<SlotPicker day={MONDAY} selected={null} onSelect={() => undefined} />);
    expect(await screen.findByRole("button", { name: "08:00" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "09:30" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "09:00, unavailable" })).toBeDisabled();
    expect(screen.getByRole("group", { name: /Times for Monday 9 November 2026/ })).toBeVisible();
  });

  it("reports the chosen time and marks it as pressed", async () => {
    mockedFetch.mockResolvedValue(["08:00", "09:30"]);
    const onSelect = jest.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SlotPicker day={MONDAY} selected={null} onSelect={onSelect} />);
    await user.click(await screen.findByRole("button", { name: "09:30" }));
    expect(onSelect).toHaveBeenCalledWith("09:30");
    rerender(<SlotPicker day={MONDAY} selected="09:30" onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: "09:30" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows an error with a retry that recovers", async () => {
    mockedFetch.mockRejectedValueOnce(
      new GraphqlRequestError("UPSTREAM_UNAVAILABLE", "The clinic system is unavailable."),
    );
    mockedFetch.mockResolvedValueOnce(["10:00"]);
    const user = userEvent.setup();
    render(<SlotPicker day={MONDAY} selected={null} onSelect={() => undefined} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("The clinic system is unavailable.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: "10:00" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains when a day is full", async () => {
    mockedFetch.mockResolvedValue([]);
    render(<SlotPicker day={MONDAY} selected={null} onSelect={() => undefined} />);
    expect(await screen.findByText("No free times are left on this day.")).toBeVisible();
  });

  it("does not call the API on Sundays", () => {
    render(<SlotPicker day="2026-11-08" selected={null} onSelect={() => undefined} />);
    expect(screen.getByText(/closed on Sundays/)).toBeVisible();
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("reloads when the reload key changes", async () => {
    mockedFetch.mockResolvedValueOnce(["08:00"]);
    mockedFetch.mockResolvedValueOnce([]);
    const { rerender } = render(
      <SlotPicker day={MONDAY} selected={null} onSelect={() => undefined} reloadKey={0} />,
    );
    expect(await screen.findByRole("button", { name: "08:00" })).toBeEnabled();
    rerender(<SlotPicker day={MONDAY} selected={null} onSelect={() => undefined} reloadKey={1} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "08:00, unavailable" })).toBeDisabled(),
    );
  });
});
