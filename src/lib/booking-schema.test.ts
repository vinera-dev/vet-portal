import { validateBookingForm } from "./booking-schema";

describe("booking form validation", () => {
  it("accepts valid values and trims them", () => {
    const result = validateBookingForm({
      tutorName: "  Ana Souza ",
      petName: "Rex",
      service: "EXAM",
    });
    expect(result).toEqual({
      ok: true,
      values: { tutorName: "Ana Souza", petName: "Rex", service: "EXAM" },
    });
  });

  it("reports a message per invalid field", () => {
    const result = validateBookingForm({ tutorName: "   ", petName: "", service: "" });
    expect(result).toEqual({
      ok: false,
      errors: {
        tutorName: "Enter your name.",
        petName: "Enter your pet's name.",
        service: "Choose a service.",
      },
    });
  });

  it("limits the length", () => {
    const result = validateBookingForm({
      tutorName: "a".repeat(121),
      petName: "Rex",
      service: "EXAM",
    });
    expect(result).toMatchObject({
      ok: false,
      errors: { tutorName: "Use at most 120 characters." },
    });
  });
});
