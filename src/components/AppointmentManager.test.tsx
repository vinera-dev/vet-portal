import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  cancelAppointment,
  findAppointment,
  fetchSlotTimes,
  rescheduleAppointment,
  type Appointment,
} from "@/lib/booking-api";
import { gridTimes } from "@/lib/clinic";
import { GraphqlRequestError } from "@/lib/graphql-client";
import { AppointmentManager } from "./AppointmentManager";

jest.mock("@/lib/booking-api");

const mockedFind = jest.mocked(findAppointment);
const mockedMove = jest.mocked(rescheduleAppointment);
const mockedCancel = jest.mocked(cancelAppointment);
const mockedSlots = jest.mocked(fetchSlotTimes);

const TODAY = "2026-11-09";

const scheduled: Appointment = {
  id: "apt-0001",
  tutorName: "Ana Souza",
  petName: "Rex",
  service: "EXAM",
  start: "2026-11-10T09:00:00",
  status: "SCHEDULED",
};

beforeEach(() => {
  mockedSlots.mockResolvedValue(gridTimes());
});

afterEach(() => {
  jest.resetAllMocks();
});

async function lookUp(user: ReturnType<typeof userEvent.setup>, code = "apt-0001") {
  await user.type(screen.getByLabelText("Appointment code"), code);
  await user.click(screen.getByRole("button", { name: "Find appointment" }));
}

describe("AppointmentManager", () => {
  it("finds an appointment by code", async () => {
    mockedFind.mockResolvedValue(scheduled);
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await lookUp(user);
    expect(await screen.findByRole("heading", { name: "Your appointment" })).toBeVisible();
    expect(screen.getByText("Tuesday 10 November 2026 at 09:00")).toBeVisible();
    expect(screen.getByText("Scheduled")).toBeVisible();
    expect(mockedFind).toHaveBeenCalledWith("apt-0001");
  });

  it("loads the appointment from the initial code", async () => {
    mockedFind.mockResolvedValue(scheduled);
    render(<AppointmentManager today={TODAY} initialCode="apt-0001" />);
    expect(await screen.findByText("Rex")).toBeVisible();
  });

  it("shows a clear message for an unknown code", async () => {
    mockedFind.mockRejectedValue(
      new GraphqlRequestError("NOT_FOUND", "We could not find an appointment with that code."),
    );
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await lookUp(user, "nope");
    expect(await screen.findByRole("alert")).toHaveTextContent("could not find an appointment");
    expect(screen.queryByRole("heading", { name: "Your appointment" })).not.toBeInTheDocument();
  });

  it("asks for a code when the field is empty", async () => {
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await user.click(screen.getByRole("button", { name: "Find appointment" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your appointment code.");
    expect(mockedFind).not.toHaveBeenCalled();
  });

  it("reschedules to a new time", async () => {
    mockedFind.mockResolvedValue(scheduled);
    mockedMove.mockResolvedValue({ ...scheduled, start: "2026-11-09T14:30:00" });
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await lookUp(user);
    await user.click(await screen.findByRole("button", { name: "Reschedule" }));
    await user.click(await screen.findByRole("button", { name: "14:30" }));
    await user.click(screen.getByRole("button", { name: "Confirm new time" }));

    expect(mockedMove).toHaveBeenCalledWith("apt-0001", "2026-11-09T14:30:00");
    expect(await screen.findByText(/moved to Monday 9 November 2026 at 14:30/)).toBeVisible();
    expect(screen.getByText("Monday 9 November 2026 at 14:30")).toBeVisible();
  });

  it("keeps the confirm button disabled until a time is chosen", async () => {
    mockedFind.mockResolvedValue(scheduled);
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await lookUp(user);
    await user.click(await screen.findByRole("button", { name: "Reschedule" }));
    expect(await screen.findByRole("button", { name: "Confirm new time" })).toBeDisabled();
  });

  it("cancels after a confirmation step", async () => {
    mockedFind.mockResolvedValue(scheduled);
    mockedCancel.mockResolvedValue({ ...scheduled, status: "CANCELLED" });
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await lookUp(user);
    await user.click(await screen.findByRole("button", { name: "Cancel appointment" }));
    expect(mockedCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Yes, cancel it" }));

    expect(await screen.findByText("Your appointment was cancelled.")).toBeVisible();
    expect(screen.getByText("Cancelled")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
  });

  it("lets the user keep the appointment", async () => {
    mockedFind.mockResolvedValue(scheduled);
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await lookUp(user);
    await user.click(await screen.findByRole("button", { name: "Cancel appointment" }));
    await user.click(screen.getByRole("button", { name: "Keep appointment" }));
    expect(mockedCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Reschedule" })).toBeVisible();
  });

  it("surfaces a conflict when rescheduling", async () => {
    mockedFind.mockResolvedValue(scheduled);
    mockedMove.mockRejectedValue(
      new GraphqlRequestError("SLOT_UNAVAILABLE", "That time is no longer available."),
    );
    const user = userEvent.setup();
    render(<AppointmentManager today={TODAY} />);
    await lookUp(user);
    await user.click(await screen.findByRole("button", { name: "Reschedule" }));
    await user.click(await screen.findByRole("button", { name: "10:00" }));
    await user.click(screen.getByRole("button", { name: "Confirm new time" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no longer available");
  });
});
