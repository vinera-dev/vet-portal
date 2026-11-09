"use client";

import { useRef, useState, type FormEvent } from "react";
import { SERVICE_OPTIONS } from "@/lib/clinic";
import {
  validateBookingForm,
  type BookingFormErrors,
  type BookingFormValues,
} from "@/lib/booking-schema";

interface BookingFormProps {
  hasSlot: boolean;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: BookingFormValues) => void;
}

const FIELD_ORDER: (keyof BookingFormValues)[] = ["tutorName", "petName", "service"];

export function BookingForm({
  hasSlot,
  submitting = false,
  submitLabel = "Book appointment",
  onSubmit,
}: BookingFormProps) {
  const [values, setValues] = useState({ tutorName: "", petName: "", service: "" });
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [slotError, setSlotError] = useState(false);
  const tutorNameRef = useRef<HTMLInputElement>(null);
  const petNameRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateBookingForm(values);
    setSlotError(!hasSlot);
    if (!result.ok) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((field) => result.errors[field]);
      if (first) {
        const target = { tutorName: tutorNameRef, petName: petNameRef, service: serviceRef }[first];
        target.current?.focus();
      }
      return;
    }
    setErrors({});
    if (hasSlot) {
      onSubmit(result.values);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="form" aria-label="Appointment details">
      <div className="field">
        <label htmlFor="tutorName">Your name</label>
        <input
          id="tutorName"
          ref={tutorNameRef}
          type="text"
          autoComplete="name"
          value={values.tutorName}
          aria-invalid={errors.tutorName ? true : undefined}
          aria-describedby={errors.tutorName ? "tutorName-error" : undefined}
          onChange={(event) => update("tutorName", event.target.value)}
        />
        {errors.tutorName ? (
          <p id="tutorName-error" className="field-error">
            {errors.tutorName}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="petName">Pet&apos;s name</label>
        <input
          id="petName"
          ref={petNameRef}
          type="text"
          value={values.petName}
          aria-invalid={errors.petName ? true : undefined}
          aria-describedby={errors.petName ? "petName-error" : undefined}
          onChange={(event) => update("petName", event.target.value)}
        />
        {errors.petName ? (
          <p id="petName-error" className="field-error">
            {errors.petName}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="service">Service</label>
        <select
          id="service"
          ref={serviceRef}
          value={values.service}
          aria-invalid={errors.service ? true : undefined}
          aria-describedby={errors.service ? "service-error" : undefined}
          onChange={(event) => update("service", event.target.value)}
        >
          <option value="">Select a service</option>
          {SERVICE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.service ? (
          <p id="service-error" className="field-error">
            {errors.service}
          </p>
        ) : null}
      </div>

      {slotError && !hasSlot ? (
        <p role="alert" className="field-error">
          Choose a time above before booking.
        </p>
      ) : null}

      <button type="submit" className="button" disabled={submitting}>
        {submitting ? "Booking..." : submitLabel}
      </button>
    </form>
  );
}
