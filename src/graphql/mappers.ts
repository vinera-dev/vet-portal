import type { Appointment, AppointmentStatus, ServiceType, Slot } from "@/gql/generated";
import { timeOf } from "@/lib/datetime";
import type { RestAppointment, ServiceType as RestServiceType } from "@/server/vet-api/types";

const SERVICE_TO_REST: Record<ServiceType, RestServiceType> = {
  CONSULTATION: "consulta",
  VACCINATION: "vacina",
  GROOMING: "banho_tosa",
  EXAM: "exame",
};

const SERVICE_FROM_REST: Record<RestServiceType, ServiceType> = {
  consulta: "CONSULTATION",
  vacina: "VACCINATION",
  banho_tosa: "GROOMING",
  exame: "EXAM",
};

const STATUS_FROM_REST: Record<RestAppointment["status"], AppointmentStatus> = {
  scheduled: "SCHEDULED",
  cancelled: "CANCELLED",
};

export function serviceToRest(service: ServiceType): RestServiceType {
  return SERVICE_TO_REST[service];
}

export function toSlot(start: string): Slot {
  return { start, time: timeOf(start) };
}

export function toAppointment(appointment: RestAppointment): Appointment {
  return {
    id: appointment.id,
    tutorName: appointment.tutor_name,
    petName: appointment.pet_name,
    service: SERVICE_FROM_REST[appointment.service],
    start: appointment.start,
    status: STATUS_FROM_REST[appointment.status],
  };
}
