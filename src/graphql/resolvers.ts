import type { Resolvers } from "@/gql/generated";
import { serviceToRest, toAppointment, toSlot } from "./mappers";
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
  Mutation: {
    bookAppointment: async (_parent, { input }, { api }) =>
      toAppointment(
        await api.bookAppointment({
          tutor_name: input.tutorName.trim(),
          pet_name: input.petName.trim(),
          service: serviceToRest(input.service),
          start: input.start,
        }),
      ),
  },
};
