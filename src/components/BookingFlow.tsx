"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookingForm } from "@/components/BookingForm";
import { DaySelector } from "@/components/DaySelector";
import { SlotPicker } from "@/components/SlotPicker";
import { bookAppointment, type Appointment } from "@/lib/booking-api";
import { firstOpenDay, formatDayLong, serviceLabel, upcomingDays } from "@/lib/clinic";
import { dayOf, timeOf } from "@/lib/datetime";
import { GraphqlRequestError } from "@/lib/graphql-client";
import type { BookingFormValues } from "@/lib/booking-schema";

interface BookingFlowProps {
  today: string;
}

export function BookingFlow({ today }: BookingFlowProps) {
  const days = upcomingDays(today);
  const [day, setDay] = useState(() => firstOpenDay(days));
  const [time, setTime] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (confirmed) {
      confirmationRef.current?.focus();
    }
  }, [confirmed]);

  function chooseDay(next: string) {
    setDay(next);
    setTime(null);
    setError(null);
  }

  async function submit(values: BookingFormValues) {
    if (!time) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await bookAppointment({ ...values, start: `${day}T${time}:00` });
      setConfirmed(appointment);
      setTime(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not book the appointment.");
      if (caught instanceof GraphqlRequestError && caught.code === "SLOT_UNAVAILABLE") {
        setTime(null);
      }
    } finally {
      setSubmitting(false);
      setReloadKey((value) => value + 1);
    }
  }

  return (
    <div className="stack">
      {confirmed ? (
        <section aria-labelledby="confirmation-heading" className="alert alert--info">
          <h2 id="confirmation-heading" ref={confirmationRef} tabIndex={-1}>
            Appointment booked
          </h2>
          <p role="status">
            {serviceLabel(confirmed.service)} for {confirmed.petName} on{" "}
            {formatDayLong(dayOf(confirmed.start))} at {timeOf(confirmed.start)}.
          </p>
          <p>
            Your appointment code is <strong>{confirmed.id}</strong>. Keep it to change or cancel
            the appointment later.
          </p>
          <p>
            <Link href={`/appointment?code=${encodeURIComponent(confirmed.id)}`}>
              Manage this appointment
            </Link>{" "}
            or{" "}
            <button type="button" className="link-button" onClick={() => setConfirmed(null)}>
              book another
            </button>
            .
          </p>
        </section>
      ) : null}

      <section aria-labelledby="day-heading">
        <h2 id="day-heading">1. Choose a day</h2>
        <DaySelector days={days} value={day} onChange={chooseDay} />
      </section>

      <section aria-labelledby="time-heading">
        <h2 id="time-heading">2. Choose a time</h2>
        <SlotPicker day={day} selected={time} onSelect={setTime} reloadKey={reloadKey} />
      </section>

      {confirmed ? null : (
        <section aria-labelledby="details-heading">
          <h2 id="details-heading">3. Your details</h2>
          {time ? (
            <p>
              Selected: {formatDayLong(day)} at {time}.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="alert alert--error">
              {error}
            </p>
          ) : null}
          <BookingForm hasSlot={time !== null} submitting={submitting} onSubmit={submit} />
        </section>
      )}
    </div>
  );
}
