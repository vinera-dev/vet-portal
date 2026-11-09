import { z } from "zod";

export const serviceTypeSchema = z.enum(["consulta", "vacina", "banho_tosa", "exame"]);
export const appointmentStatusSchema = z.enum(["scheduled", "cancelled"]);

export const appointmentSchema = z.object({
  id: z.string(),
  tutor_name: z.string(),
  pet_name: z.string(),
  service: serviceTypeSchema,
  start: z.string(),
  status: appointmentStatusSchema,
});

export const slotsSchema = z.array(z.string());

export const sourceSchema = z.object({
  source: z.string(),
  title: z.string(),
  score: z.number(),
});

export const toolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
});

export const agentReplySchema = z.object({
  session_id: z.string(),
  reply: z.string(),
  intent: z.string(),
  escalated: z.boolean(),
  grounded: z.boolean().nullable().optional(),
  sources: z.array(sourceSchema).default([]),
  tool_calls: z.array(toolCallSchema).default([]),
});

export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type RestAppointment = z.infer<typeof appointmentSchema>;
export type RestSource = z.infer<typeof sourceSchema>;
export type RestAgentReply = z.infer<typeof agentReplySchema>;

export interface BookRequest {
  tutor_name: string;
  pet_name: string;
  service: ServiceType;
  start: string;
}

export interface RescheduleRequest {
  new_start: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string | null;
}
