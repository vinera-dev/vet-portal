import type { Resolvers } from "@/gql/generated";
import { toSlot } from "./mappers";
import { DateScalar, LocalDateTimeScalar } from "./scalars";

export const resolvers: Resolvers = {
  Date: DateScalar,
  LocalDateTime: LocalDateTimeScalar,
  Query: {
    clinic: () => ({
      name: "Happy Paws Clinic",
      opensAt: "08:00",
      closesAt: "18:00",
      slotMinutes: 30,
    }),
    slots: async (_parent, { day }, { api }) => (await api.listSlots(day)).map(toSlot),
  },
};
