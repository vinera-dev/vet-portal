import { createSchema } from "graphql-yoga";

const typeDefs = `
  type Clinic {
    name: String!
    opensAt: String!
    closesAt: String!
    slotMinutes: Int!
  }

  type Query {
    clinic: Clinic!
  }
`;

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      clinic: () => ({
        name: "Happy Paws Clinic",
        opensAt: "08:00",
        closesAt: "18:00",
        slotMinutes: 30,
      }),
    },
  },
});
