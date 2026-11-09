import {
  AppointmentByCodeDocument,
  BookAppointmentDocument,
  CancelAppointmentDocument,
  RescheduleAppointmentDocument,
  SlotsDocument,
  type BookAppointmentMutationVariables,
} from "@/gql/operations";
import { createHarness, MONDAY } from "@/test/graphql-harness";
import { execute, GraphqlRequestError } from "./graphql-client";

function clientFetch() {
  const harness = createHarness();
  const fetchImpl = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    const { query, variables } = JSON.parse(String(init?.body));
    return Response.json(await harness.run(query, variables));
  }) as typeof fetch;
  return { fetch: fetchImpl };
}

const variables: BookAppointmentMutationVariables = {
  input: {
    tutorName: "Ana Souza",
    petName: "Rex",
    service: "EXAM",
    start: `${MONDAY}T09:00`,
  },
};

describe("graphql client with generated documents", () => {
  it("runs the whole booking flow with typed results", async () => {
    const options = clientFetch();
    const slots = await execute(SlotsDocument, { day: MONDAY }, options);
    expect(slots.slots[0].time).toBe("08:00");

    const booked = await execute(BookAppointmentDocument, variables, options);
    const id = booked.bookAppointment.id;
    expect(booked.bookAppointment.service).toBe("EXAM");

    const found = await execute(AppointmentByCodeDocument, { id }, options);
    expect(found.appointment.status).toBe("SCHEDULED");

    const moved = await execute(
      RescheduleAppointmentDocument,
      { id, newStart: `${MONDAY}T10:00` },
      options,
    );
    expect(moved.rescheduleAppointment.start).toBe(`${MONDAY}T10:00:00`);

    const cancelled = await execute(CancelAppointmentDocument, { id }, options);
    expect(cancelled.cancelAppointment.status).toBe("CANCELLED");
  });

  it("raises typed errors", async () => {
    const options = clientFetch();
    await execute(BookAppointmentDocument, variables, options);
    await expect(execute(BookAppointmentDocument, variables, options)).rejects.toMatchObject({
      code: "SLOT_UNAVAILABLE",
    });
  });

  it("reports network failures", async () => {
    const failing = (async () => {
      throw new TypeError("offline");
    }) as typeof fetch;
    const error = await execute(SlotsDocument, { day: MONDAY }, { fetch: failing }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(GraphqlRequestError);
    expect(error).toMatchObject({ code: "NETWORK_ERROR" });
  });
});
