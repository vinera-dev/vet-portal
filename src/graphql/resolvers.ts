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
    appointment: async (_parent, { id }, { api }) => toAppointment(await api.getAppointment(id)),
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
    rescheduleAppointment: async (_parent, { id, newStart }, { api }) =>
      toAppointment(await api.rescheduleAppointment(id, { new_start: newStart })),
    cancelAppointment: async (_parent, { id }, { api }) =>
      toAppointment(await api.cancelAppointment(id)),
  },
};
