import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingForm } from "./BookingForm";

describe("BookingForm", () => {
  it("shows a message for every invalid field and does not submit", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<BookingForm hasSlot onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Book appointment" }));

    expect(screen.getByText("Enter your name.")).toBeVisible();
    expect(screen.getByText("Enter your pet's name.")).toBeVisible();
    expect(screen.getByText("Choose a service.")).toBeVisible();
    expect(screen.getByLabelText("Your name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Your name")).toHaveAccessibleDescription("Enter your name.");
    expect(screen.getByLabelText("Your name")).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears a message once the field is edited", async () => {
    const user = userEvent.setup();
    render(<BookingForm hasSlot onSubmit={() => undefined} />);
    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    await user.type(screen.getByLabelText("Your name"), "Ana");
    expect(screen.queryByText("Enter your name.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).not.toHaveAttribute("aria-invalid");
  });

  it("submits trimmed values", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<BookingForm hasSlot onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Your name"), "  Ana Souza ");
    await user.type(screen.getByLabelText("Pet's name"), "Rex");
    await user.selectOptions(screen.getByLabelText("Service"), "Vaccination");
    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    expect(onSubmit).toHaveBeenCalledWith({
      tutorName: "Ana Souza",
      petName: "Rex",
      service: "VACCINATION",
    });
  });

  it("asks for a time when none is chosen", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<BookingForm hasSlot={false} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Your name"), "Ana");
    await user.type(screen.getByLabelText("Pet's name"), "Rex");
    await user.selectOptions(screen.getByLabelText("Service"), "Exam");
    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a time above");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the button while submitting", () => {
    render(<BookingForm hasSlot submitting onSubmit={() => undefined} />);
    expect(screen.getByRole("button", { name: "Booking..." })).toBeDisabled();
  });
});
