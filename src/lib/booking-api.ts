import {
  AppointmentByCodeDocument,
  BookAppointmentDocument,
  CancelAppointmentDocument,
  RescheduleAppointmentDocument,
  SlotsDocument,
  type AppointmentFieldsFragment,
  type BookAppointmentMutationVariables,
} from "@/gql/operations";
import { execute } from "./graphql-client";

export type Appointment = AppointmentFieldsFragment;
export type BookingInput = BookAppointmentMutationVariables["input"];

export async function fetchSlotTimes(day: string): Promise<string[]> {
  const data = await execute(SlotsDocument, { day });
  return data.slots.map((slot) => slot.time);
}

export async function bookAppointment(input: BookingInput): Promise<Appointment> {
  const data = await execute(BookAppointmentDocument, { input });
  return data.bookAppointment;
}

export async function findAppointment(id: string): Promise<Appointment> {
  const data = await execute(AppointmentByCodeDocument, { id });
  return data.appointment;
}

export async function rescheduleAppointment(id: string, newStart: string): Promise<Appointment> {
  const data = await execute(RescheduleAppointmentDocument, { id, newStart });
  return data.rescheduleAppointment;
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const data = await execute(CancelAppointmentDocument, { id });
  return data.cancelAppointment;
}
