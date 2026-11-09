import { createFakeFetch } from "../../../fake-backend/fetch.ts";
import { createVetApi } from "./client";
import { VetApiError } from "./errors";

const NOW = new Date(2026, 10, 2, 7, 0, 0);
const MONDAY = "2026-11-09";
const SUNDAY = "2026-11-08";

function setup() {
  const fake = createFakeFetch({ now: () => NOW });
  const api = createVetApi({ baseUrl: "http://vet.test/", fetch: fake.fetch });
  return { fake, api };
}

async function failure(promise: Promise<unknown>): Promise<VetApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof VetApiError) {
      return error;
    }
    throw error;
  }
  throw new Error("Expected the call to fail");
}

const booking = {
  tutor_name: "Ana Souza",
  pet_name: "Rex",
  service: "consulta" as const,
  start: `${MONDAY}T09:00:00`,
};

describe("vet api client", () => {
  it("lists the slots of a business day", async () => {
    const { api, fake } = setup();
    const slots = await api.listSlots(MONDAY);
    expect(slots).toHaveLength(20);
    expect(slots[0]).toBe(`${MONDAY}T08:00:00`);
    expect(fake.calls[0].url).toBe(`http://vet.test/appointments/slots?day=${MONDAY}`);
  });

  it("returns no slots on Sunday", async () => {
    const { api } = setup();
    expect(await api.listSlots(SUNDAY)).toEqual([]);
  });

  it("books, reads, reschedules and cancels an appointment", async () => {
    const { api } = setup();
    const created = await api.bookAppointment(booking);
    expect(created).toMatchObject({ status: "scheduled", pet_name: "Rex" });
    expect(await api.listSlots(MONDAY)).not.toContain(booking.start);
    expect((await api.getAppointment(created.id)).start).toBe(booking.start);

    const moved = await api.rescheduleAppointment(created.id, { new_start: `${MONDAY}T10:00:00` });
    expect(moved.start).toBe(`${MONDAY}T10:00:00`);
    expect(await api.listSlots(MONDAY)).toContain(booking.start);

    const cancelled = await api.cancelAppointment(created.id);
    expect(cancelled.status).toBe("cancelled");
  });

  it("reports a double booking as slot_unavailable", async () => {
    const { api } = setup();
    await api.bookAppointment(booking);
    const error = await failure(api.bookAppointment(booking));
    expect(error).toMatchObject({ status: 409, code: "slot_unavailable" });
  });

  it("reports unknown appointments as not_found", async () => {
    const { api } = setup();
    expect(await failure(api.getAppointment("missing"))).toMatchObject({
      status: 404,
      code: "not_found",
    });
  });

  it("rejects actions on a cancelled appointment", async () => {
    const { api } = setup();
    const created = await api.bookAppointment(booking);
    await api.cancelAppointment(created.id);
    expect(await failure(api.cancelAppointment(created.id))).toMatchObject({
      code: "invalid_status",
    });
  });

  it("maps past and out-of-hours slots", async () => {
    const { api } = setup();
    expect(
      await failure(api.bookAppointment({ ...booking, start: "2026-11-01T09:00:00" })),
    ).toMatchObject({ code: "past_slot", status: 422 });
    expect(
      await failure(api.bookAppointment({ ...booking, start: `${SUNDAY}T09:00:00` })),
    ).toMatchObject({ code: "outside_business_hours" });
  });

  it("maps validation failures", async () => {
    const { api } = setup();
    const error = await failure(api.bookAppointment({ ...booking, tutor_name: "" }));
    expect(error.code).toBe("validation_error");
    expect(error.status).toBe(422);
  });

  it("sends chat messages and parses the reply", async () => {
    const { api } = setup();
    const reply = await api.chat({ message: "Hello" });
    expect(reply.session_id).toBe("session-1");
    expect(reply.sources).toEqual([]);
    const second = await api.chat({ message: "Again", session_id: reply.session_id });
    expect(second.reply).toContain("Mensagem 2");
  });

  it("flags an unexpected payload", async () => {
    const api = createVetApi({
      baseUrl: "http://vet.test",
      fetch: (async () => Response.json({ unexpected: true })) as typeof fetch,
    });
    expect(await failure(api.getAppointment("x"))).toMatchObject({ code: "invalid_response" });
  });

  it("flags an unreachable service", async () => {
    const api = createVetApi({
      baseUrl: "http://vet.test",
      fetch: (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
    });
    expect(await failure(api.listSlots(MONDAY))).toMatchObject({
      status: 0,
      code: "upstream_unavailable",
    });
  });

  it("flags a server outage", async () => {
    const api = createVetApi({
      baseUrl: "http://vet.test",
      fetch: (async () => Response.json({ detail: "down" }, { status: 503 })) as typeof fetch,
    });
    expect(await failure(api.listSlots(MONDAY))).toMatchObject({ code: "upstream_unavailable" });
  });
});
