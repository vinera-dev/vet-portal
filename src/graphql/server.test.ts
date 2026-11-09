import { createHarness } from "@/test/graphql-harness";

describe("graphql server", () => {
  it("answers the clinic query", async () => {
    const { run } = createHarness();
    expect(await run("{ clinic { name slotMinutes } }")).toEqual({
      data: { clinic: { name: "Happy Paws Clinic", slotMinutes: 30 } },
    });
  });
});
