"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSlotTimes } from "@/lib/booking-api";
import { formatDayLong, gridTimes, isClosedDay } from "@/lib/clinic";

type SlotsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; free: string[] };

interface SlotPickerProps {
  day: string;
  selected: string | null;
  onSelect: (time: string) => void;
  reloadKey?: number;
}

interface Loaded {
  key: string;
  result: { status: "error"; message: string } | { status: "ready"; free: string[] };
}

function useFreeTimes(
  day: string,
  reloadKey: number,
  enabled: boolean,
): { state: SlotsState; retry: () => void } {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${day}|${reloadKey}|${attempt}`;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let active = true;
    fetchSlotTimes(day).then(
      (free) => {
        if (active) {
          setLoaded({ key, result: { status: "ready", free } });
        }
      },
      (error: unknown) => {
        if (active) {
          const message =
            error instanceof Error ? error.message : "Could not load the available times.";
          setLoaded({ key, result: { status: "error", message } });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [day, key, enabled]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const state: SlotsState = loaded?.key === key ? loaded.result : { status: "loading" };
  return { state, retry };
}

export function SlotPicker({ day, selected, onSelect, reloadKey = 0 }: SlotPickerProps) {
  const { state, retry } = useFreeTimes(day, reloadKey, !isClosedDay(day));
  const heading = `Times for ${formatDayLong(day)}`;

  if (isClosedDay(day)) {
    return <p>The clinic is closed on Sundays. Please choose another day.</p>;
  }

  if (state.status === "loading") {
    return <p role="status">Loading available times...</p>;
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="alert alert--error">
        <p>{state.message}</p>
        <button type="button" className="button button--secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  const free = new Set(state.free);
  const times = gridTimes();

  return (
    <div role="group" aria-label={heading}>
      {state.free.length === 0 ? <p>No free times are left on this day.</p> : null}
      <ul className="slot-grid">
        {times.map((time) => {
          const available = free.has(time);
          const isSelected = selected === time;
          return (
            <li key={time}>
              <button
                type="button"
                disabled={!available}
                aria-pressed={available ? isSelected : undefined}
                aria-label={available ? time : `${time}, unavailable`}
                className={isSelected ? "slot slot--selected" : "slot"}
                onClick={() => onSelect(time)}
              >
                {time}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
