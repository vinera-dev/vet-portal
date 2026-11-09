"use client";

import { useRef, type KeyboardEvent } from "react";
import { formatDayShort, isClosedDay } from "@/lib/clinic";

interface DaySelectorProps {
  days: string[];
  value: string;
  onChange: (day: string) => void;
  label?: string;
}

export function DaySelector({ days, value, onChange, label = "Choose a day" }: DaySelectorProps) {
  const refs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const enabled = days.filter((day) => !isClosedDay(day));

  function moveTo(day: string | undefined) {
    if (!day) {
      return;
    }
    onChange(day);
    refs.current.get(day)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const index = enabled.indexOf(day);
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(enabled[(index + 1) % enabled.length]);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(enabled[(index - 1 + enabled.length) % enabled.length]);
        break;
      case "Home":
        event.preventDefault();
        moveTo(enabled[0]);
        break;
      case "End":
        event.preventDefault();
        moveTo(enabled[enabled.length - 1]);
        break;
    }
  }

  const tabStop = enabled.includes(value) ? value : enabled[0];

  return (
    <div role="radiogroup" aria-label={label} className="day-selector">
      {days.map((day) => {
        const closed = isClosedDay(day);
        const selected = day === value;
        return (
          <button
            key={day}
            ref={(node) => {
              if (node) {
                refs.current.set(day, node);
              } else {
                refs.current.delete(day);
              }
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={closed ? `${formatDayShort(day)}, closed` : formatDayShort(day)}
            disabled={closed}
            tabIndex={day === tabStop ? 0 : -1}
            className={selected ? "day-option day-option--selected" : "day-option"}
            onClick={() => onChange(day)}
            onKeyDown={(event) => handleKeyDown(event, day)}
          >
            {formatDayShort(day)}
          </button>
        );
      })}
    </div>
  );
}
