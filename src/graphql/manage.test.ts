import { createHarness, MONDAY } from "@/test/graphql-harness";

const BOOK = `
  mutation Book($input: BookAppointmentInput!) {
    bookAppointment(input: $input) { id }
  }
`;
const RESCHEDULE = `
  mutation Move($id: ID!, $newStart: LocalDateTime!) {
    rescheduleAppointment(id: $id, newStart: $newStart) { id start status }
  }
`;
const CANCEL = `
  mutation Cancel($id: ID!) {
    cancelAppointment(id: $id) { id status }
  }
`;
const FIND = `query Find($id: ID!) { appointment(id: $id) { id start status petName } }`;

async function booked() {
  const harness = createHarness();
  const result = await harness.run<{ bookAppointment: { id: string } }>(BOOK, {
    input: {
      tutorName: "Ana Souza",
      petName: "Rex",
      service: "CONSULTATION",
      start: `${MONDAY}T09:00:00`,
    },
  });
  return { ...harness, id: result.data!.bookAppointment.id };
}

describe("reschedule, cancel and lookup", () => {
  it("finds an appointment by code", async () => {
    const { run, id } = await booked();
    const result = await run(FIND, { id });
    expect(result.data).toEqual({
      appointment: { id, start: `${MONDAY}T09:00:00`, status: "SCHEDULED", petName: "Rex" },
    });
  });

  it("reschedules to another time", async () => {
    const { run, id } = await booked();
    const result = await run(RESCHEDULE, { id, newStart: `${MONDAY}T11:30` });
    expect(result.data).toEqual({
      rescheduleAppointment: { id, start: `${MONDAY}T11:30:00`, status: "SCHEDULED" },
    });
  });

  it("cancels and frees the time again", async () => {
    const { run, id } = await booked();
    const result = await run(CANCEL, { id });
    expect(result.data).toEqual({ cancelAppointment: { id, status: "CANCELLED" } });
    const slots = await run<{ slots: { time: string }[] }>(
      "query($day: Date!) { slots(day: $day) { time } }",
      { day: MONDAY },
    );
    expect(slots.data?.slots.map((slot) => slot.time)).toContain("09:00");
  });

  it("runs the full flow in order", async () => {
    const { run, id } = await booked();
    await run(RESCHEDULE, { id, newStart: `${MONDAY}T14:00` });
    await run(CANCEL, { id });
    const result = await run(FIND, { id });
    expect(result.data).toMatchObject({
      appointment: { start: `${MONDAY}T14:00:00`, status: "CANCELLED" },
    });
  });
});
