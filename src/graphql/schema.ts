import { createSchema } from "graphql-yoga";
import type { Resolvers } from "@/gql/generated";
import { DateScalar, LocalDateTimeScalar } from "./scalars";
import { typeDefs } from "./typeDefs";

const resolvers: Resolvers = {
  Date: DateScalar,
  LocalDateTime: LocalDateTimeScalar,
  Query: {
    clinic: () => ({
      name: "Happy Paws Clinic",
      opensAt: "08:00",
      closesAt: "18:00",
      slotMinutes: 30,
    }),
  },
};

export const schema = createSchema({ typeDefs, resolvers });
