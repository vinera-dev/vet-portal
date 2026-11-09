import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { bookAppointment, fetchSlotTimes } from "@/lib/booking-api";
import { gridTimes } from "@/lib/clinic";
import { GraphqlRequestError } from "@/lib/graphql-client";
import { BookingFlow } from "./BookingFlow";

jest.mock("@/lib/booking-api");

const mockedSlots = jest.mocked(fetchSlotTimes);
const mockedBook = jest.mocked(bookAppointment);

const TODAY = "2026-11-09";
let taken: Set<string>;

beforeEach(() => {
  taken = new Set();
  mockedSlots.mockImplementation(async (day) =>
    gridTimes().filter((time) => !taken.has(`${day}T${time}`)),
  );
  mockedBook.mockImplementation(async (input) => {
    taken.add(input.start.slice(0, 16));
    return {
      id: "apt-0001",
      tutorName: input.tutorName,
      petName: input.petName,
      service: input.service,
      start: input.start,
      status: "SCHEDULED",
    };
  });
});

afterEach(() => {
  mockedSlots.mockReset();
  mockedBook.mockReset();
});

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Your name"), "Ana Souza");
  await user.type(screen.getByLabelText("Pet's name"), "Rex");
  await user.selectOptions(screen.getByLabelText("Service"), "Vaccination");
}

describe("BookingFlow", () => {
  it("books a slot and shows it as unavailable afterwards", async () => {
    const user = userEvent.setup();
    render(<BookingFlow today={TODAY} />);

    await user.click(await screen.findByRole("button", { name: "09:30" }));
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Book appointment" }));

    const confirmation = await screen.findByRole("heading", { name: "Appointment booked" });
    expect(confirmation).toHaveFocus();
    const region = screen.getByRole("region", { name: "Appointment booked" });
    expect(within(region).getByRole("status")).toHaveTextContent(
      "Vaccination for Rex on Monday 9 November 2026 at 09:30.",
    );
    expect(within(region).getByText("apt-0001")).toBeVisible();
    expect(mockedBook).toHaveBeenCalledWith({
      tutorName: "Ana Souza",
      petName: "Rex",
      service: "VACCINATION",
      start: "2026-11-09T09:30:00",
    });

    expect(await screen.findByRole("button", { name: "09:30, unavailable" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Manage this appointment" })).toHaveAttribute(
      "href",
      "/appointment?code=apt-0001",
    );
  });

  it("starts a new booking from the confirmation", async () => {
    const user = userEvent.setup();
    render(<BookingFlow today={TODAY} />);
    await user.click(await screen.findByRole("button", { name: "08:00" }));
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    await user.click(await screen.findByRole("button", { name: "book another" }));
    expect(screen.getByRole("button", { name: "Book appointment" })).toBeVisible();
  });

  it("explains a conflict and refreshes the times", async () => {
    mockedBook.mockRejectedValueOnce(
      new GraphqlRequestError("SLOT_UNAVAILABLE", "That time is no longer available."),
    );
    const user = userEvent.setup();
    render(<BookingFlow today={TODAY} />);
    await user.click(await screen.findByRole("button", { name: "10:00" }));
    await fillForm(user);
    taken.add("2026-11-09T10:00");
    await user.click(screen.getByRole("button", { name: "Book appointment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That time is no longer available.");
    expect(await screen.findByRole("button", { name: "10:00, unavailable" })).toBeDisabled();
  });

  it("does not submit without a selected time", async () => {
    const user = userEvent.setup();
    render(<BookingFlow today={TODAY} />);
    await screen.findByRole("button", { name: "08:00" });
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a time above");
    expect(mockedBook).not.toHaveBeenCalled();
  });

  it("clears the chosen time when the day changes", async () => {
    const user = userEvent.setup();
    render(<BookingFlow today={TODAY} />);
    await user.click(await screen.findByRole("button", { name: "08:00" }));
    expect(screen.getByRole("button", { name: "08:00" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("radio", { name: "Tue 10 Nov" }));
    expect(await screen.findByRole("button", { name: "08:00" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
