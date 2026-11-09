import { createHarness, MONDAY, SUNDAY } from "@/test/graphql-harness";
import { ERROR_MESSAGES } from "./errors";

const BOOK = `
  mutation Book($input: BookAppointmentInput!) {
    bookAppointment(input: $input) { id }
  }
`;

function input(start: string, tutorName = "Ana Souza") {
  return { input: { tutorName, petName: "Rex", service: "CONSULTATION", start } };
}

describe("error mapping", () => {
  it("turns a double booking into a typed SLOT_UNAVAILABLE error", async () => {
    const { run } = createHarness();
    await run(BOOK, input(`${MONDAY}T09:00`));
    const result = await run(BOOK, input(`${MONDAY}T09:00`));
    expect(result.data).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0].message).toBe(ERROR_MESSAGES.SLOT_UNAVAILABLE);
    expect(result.errors?.[0].extensions).toMatchObject({
      code: "SLOT_UNAVAILABLE",
      upstreamStatus: 409,
    });
  });

  it("maps a missing appointment", async () => {
    const { run } = createHarness();
    const result = await run('query { appointment(id: "nope") { id } }');
    expect(result.errors?.[0].extensions?.code).toBe("NOT_FOUND");
  });

  it("maps past and out-of-hours times", async () => {
    const { run } = createHarness();
    const past = await run(BOOK, input("2026-11-01T09:00"));
    const closed = await run(BOOK, input(`${SUNDAY}T09:00`));
    expect(past.errors?.[0].extensions?.code).toBe("PAST_SLOT");
    expect(closed.errors?.[0].extensions?.code).toBe("OUTSIDE_BUSINESS_HOURS");
  });

  it("maps an inactive appointment", async () => {
    const { run } = createHarness();
    const created = await run<{ bookAppointment: { id: string } }>(BOOK, input(`${MONDAY}T10:00`));
    const id = created.data!.bookAppointment.id;
    const cancel = "mutation($id: ID!) { cancelAppointment(id: $id) { id } }";
    await run(cancel, { id });
    const again = await run(cancel, { id });
    expect(again.errors?.[0].extensions?.code).toBe("INVALID_STATUS");
  });

  it("maps upstream validation failures", async () => {
    const { run } = createHarness();
    const result = await run(BOOK, input(`${MONDAY}T10:00`, "   "));
    expect(result.errors?.[0].extensions?.code).toBe("VALIDATION_ERROR");
  });

  it("keeps the path of the failing field", async () => {
    const { run } = createHarness();
    const result = await run('query { appointment(id: "nope") { id } }');
    expect(result.errors?.[0]).toMatchObject({ path: ["appointment"] });
  });
});
