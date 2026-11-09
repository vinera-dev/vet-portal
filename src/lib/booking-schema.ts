import { z } from "zod";

export const bookingFormSchema = z.object({
  tutorName: z.string().trim().min(1, "Enter your name.").max(120, "Use at most 120 characters."),
  petName: z
    .string()
    .trim()
    .min(1, "Enter your pet's name.")
    .max(120, "Use at most 120 characters."),
  service: z.enum(["CONSULTATION", "VACCINATION", "GROOMING", "EXAM"], {
    error: "Choose a service.",
  }),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

export function validateBookingForm(values: {
  tutorName: string;
  petName: string;
  service: string;
}): { ok: true; values: BookingFormValues } | { ok: false; errors: BookingFormErrors } {
  const parsed = bookingFormSchema.safeParse(values);
  if (parsed.success) {
    return { ok: true, values: parsed.data };
  }
  const errors: BookingFormErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof BookingFormValues;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}
