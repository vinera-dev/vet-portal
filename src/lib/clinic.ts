import { addDays, weekdayOf } from "./datetime";

export const OPENING_MINUTES = 8 * 60;
export const CLOSING_MINUTES = 18 * 60;
export const SLOT_MINUTES = 30;
export const DAYS_AHEAD = 14;

export const SERVICE_OPTIONS = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "GROOMING", label: "Bath and grooming" },
  { value: "EXAM", label: "Exam" },
] as const;

export type ServiceValue = (typeof SERVICE_OPTIONS)[number]["value"];

export function serviceLabel(value: string): string {
  return SERVICE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function gridTimes(): string[] {
  const times: string[] = [];
  for (let minutes = OPENING_MINUTES; minutes < CLOSING_MINUTES; minutes += SLOT_MINUTES) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    const rest = String(minutes % 60).padStart(2, "0");
    times.push(`${hours}:${rest}`);
  }
  return times;
}

export function isClosedDay(day: string): boolean {
  return weekdayOf(day) === 0;
}

export function upcomingDays(today: string, count: number = DAYS_AHEAD): string[] {
  return Array.from({ length: count }, (_, index) => addDays(today, index));
}

export function firstOpenDay(days: string[]): string {
  return days.find((day) => !isClosedDay(day)) ?? days[0];
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parts(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return { year, month: MONTHS[month - 1], date, weekday: WEEKDAYS[weekdayOf(day)] };
}

export function formatDayShort(day: string): string {
  const { weekday, date, month } = parts(day);
  return `${weekday.slice(0, 3)} ${date} ${month.slice(0, 3)}`;
}

export function formatDayLong(day: string): string {
  const { weekday, date, month, year } = parts(day);
  return `${weekday} ${date} ${month} ${year}`;
}
