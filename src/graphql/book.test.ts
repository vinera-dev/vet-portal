import { createHarness, MONDAY } from "@/test/graphql-harness";

const BOOK = `
  mutation Book($input: BookAppointmentInput!) {
    bookAppointment(input: $input) { id tutorName petName service start status }
  }
`;

const input = {
  tutorName: " Ana Souza ",
  petName: "Rex",
  service: "VACCINATION",
  start: `${MONDAY}T09:00`,
};

describe("bookAppointment mutation", () => {
  it("creates an appointment and normalizes the input", async () => {
    const { run, fake } = createHarness();
    const result = await run<{ bookAppointment: Record<string, string> }>(BOOK, { input });
    expect(result.errors).toBeUndefined();
    expect(result.data?.bookAppointment).toEqual({
      id: "apt-0001",
      tutorName: "Ana Souza",
      petName: "Rex",
      service: "VACCINATION",
      start: `${MONDAY}T09:00:00`,
      status: "SCHEDULED",
    });
    expect(fake.backend.appointments.get("apt-0001")?.service).toBe("vacina");
  });

  it("removes the booked time from the free slots", async () => {
    const { run } = createHarness();
    await run(BOOK, { input });
    const slots = await run<{ slots: { time: string }[] }>(
      "query($day: Date!) { slots(day: $day) { time } }",
      { day: MONDAY },
    );
    expect(slots.data?.slots.map((slot) => slot.time)).not.toContain("09:00");
  });

  it("rejects an unknown service value", async () => {
    const { run } = createHarness();
    const result = await run(BOOK, { input: { ...input, service: "SURGERY" } });
    expect(result.errors).toHaveLength(1);
  });
});
