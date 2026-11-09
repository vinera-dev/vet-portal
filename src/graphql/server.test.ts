import { createGraphqlServer } from "./server";

describe("graphql server", () => {
  it("answers the clinic query", async () => {
    const yoga = createGraphqlServer({ logging: false });
    const response = await yoga.fetch("http://127.0.0.1/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ clinic { name slotMinutes } }" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { clinic: { name: "Happy Paws Clinic", slotMinutes: 30 } },
    });
  });
});
