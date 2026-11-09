import { createHarness, MONDAY, SUNDAY } from "@/test/graphql-harness";

const SLOTS = "query Slots($day: Date!) { slots(day: $day) { start time } }";

describe("slots query", () => {
  it("returns the free times of a day", async () => {
    const { run } = createHarness();
    const result = await run<{ slots: { start: string; time: string }[] }>(SLOTS, { day: MONDAY });
    expect(result.errors).toBeUndefined();
    expect(result.data?.slots).toHaveLength(20);
    expect(result.data?.slots[0]).toEqual({ start: `${MONDAY}T08:00:00`, time: "08:00" });
    expect(result.data?.slots.at(-1)?.time).toBe("17:30");
  });

  it("returns an empty list on Sunday", async () => {
    const { run } = createHarness();
    const result = await run(SLOTS, { day: SUNDAY });
    expect(result.data).toEqual({ slots: [] });
  });

  it("rejects an invalid day", async () => {
    const { run } = createHarness();
    const result = await run(SLOTS, { day: "2026-02-30" });
    expect(result.errors).toHaveLength(1);
  });
});
