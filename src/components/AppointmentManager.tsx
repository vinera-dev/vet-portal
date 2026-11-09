"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DaySelector } from "@/components/DaySelector";
import { SlotPicker } from "@/components/SlotPicker";
import {
  cancelAppointment,
  findAppointment,
  rescheduleAppointment,
  type Appointment,
} from "@/lib/booking-api";
import { firstOpenDay, formatDayLong, serviceLabel, upcomingDays } from "@/lib/clinic";
import { dayOf, timeOf } from "@/lib/datetime";

interface AppointmentManagerProps {
  today: string;
  initialCode?: string;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function AppointmentManager({ today, initialCode }: AppointmentManagerProps) {
  const days = upcomingDays(today);
  const [code, setCode] = useState(initialCode ?? "");
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(Boolean(initialCode));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [day, setDay] = useState(() => firstOpenDay(days));
  const [time, setTime] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!initialCode) {
      return undefined;
    }
    let active = true;
    findAppointment(initialCode).then(
      (found) => {
        if (active) {
          setAppointment(found);
          setLoading(false);
        }
      },
      (caught: unknown) => {
        if (active) {
          setError(messageOf(caught, "Could not look up the appointment."));
          setLoading(false);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [initialCode]);

  function resetActions() {
    setRescheduling(false);
    setConfirmingCancel(false);
    setTime(null);
  }

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    setNotice(null);
    resetActions();
    if (!trimmed) {
      setAppointment(null);
      setError("Enter your appointment code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setAppointment(await findAppointment(trimmed));
    } catch (caught) {
      setAppointment(null);
      setError(messageOf(caught, "Could not look up the appointment."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmReschedule() {
    if (!appointment || !time) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await rescheduleAppointment(appointment.id, `${day}T${time}:00`);
      setAppointment(updated);
      setNotice(
        `Appointment moved to ${formatDayLong(dayOf(updated.start))} at ${timeOf(updated.start)}.`,
      );
      resetActions();
    } catch (caught) {
      setError(messageOf(caught, "Could not reschedule the appointment."));
      setTime(null);
    } finally {
      setBusy(false);
      setReloadKey((value) => value + 1);
    }
  }

  async function confirmCancel() {
    if (!appointment) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setAppointment(await cancelAppointment(appointment.id));
      setNotice("Your appointment was cancelled.");
      resetActions();
    } catch (caught) {
      setError(messageOf(caught, "Could not cancel the appointment."));
    } finally {
      setBusy(false);
    }
  }

  const scheduled = appointment?.status === "SCHEDULED";

  return (
    <div className="stack">
      <form onSubmit={lookup} noValidate className="form" aria-label="Find an appointment">
        <div className="field">
          <label htmlFor="code">Appointment code</label>
          <input
            id="code"
            type="text"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
        <button type="submit" className="button" disabled={busy || loading}>
          Find appointment
        </button>
      </form>

      {loading ? <p role="status">Looking up your appointment...</p> : null}
      {error ? (
        <p role="alert" className="alert alert--error">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="alert alert--info">
          {notice}
        </p>
      ) : null}

      {appointment ? (
        <section aria-labelledby="details-heading">
          <h2 id="details-heading">Your appointment</h2>
          <dl className="details">
            <dt>Code</dt>
            <dd>{appointment.id}</dd>
            <dt>Status</dt>
            <dd>{scheduled ? "Scheduled" : "Cancelled"}</dd>
            <dt>Service</dt>
            <dd>{serviceLabel(appointment.service)}</dd>
            <dt>Pet</dt>
            <dd>{appointment.petName}</dd>
            <dt>Tutor</dt>
            <dd>{appointment.tutorName}</dd>
            <dt>When</dt>
            <dd>
              {formatDayLong(dayOf(appointment.start))} at {timeOf(appointment.start)}
            </dd>
          </dl>

          {scheduled && !rescheduling && !confirmingCancel ? (
            <div className="cta-row">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setNotice(null);
                  setRescheduling(true);
                }}
              >
                Reschedule
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  setNotice(null);
                  setConfirmingCancel(true);
                }}
              >
                Cancel appointment
              </button>
            </div>
          ) : null}

          {scheduled && confirmingCancel ? (
            <div role="group" aria-label="Confirm cancellation" className="alert alert--warning">
              <p>Do you really want to cancel this appointment?</p>
              <div className="cta-row">
                <button
                  type="button"
                  className="button button--danger"
                  disabled={busy}
                  onClick={confirmCancel}
                >
                  Yes, cancel it
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmingCancel(false)}
                >
                  Keep appointment
                </button>
              </div>
            </div>
          ) : null}

          {scheduled && rescheduling ? (
            <div className="stack">
              <h3>Choose a new time</h3>
              <DaySelector
                days={days}
                value={day}
                onChange={(next) => {
                  setDay(next);
                  setTime(null);
                }}
                label="Choose a new day"
              />
              <SlotPicker day={day} selected={time} onSelect={setTime} reloadKey={reloadKey} />
              <div className="cta-row">
                <button
                  type="button"
                  className="button"
                  disabled={busy || time === null}
                  onClick={confirmReschedule}
                >
                  Confirm new time
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setRescheduling(false)}
                >
                  Back
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
