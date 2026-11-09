const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isValidDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  return isRealDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function normalizeLocalDateTime(value: string): string | null {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute, second = "00"] = match;
  if (!isRealDate(Number(year), Number(month), Number(day))) {
    return null;
  }
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) {
    return null;
  }
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function timeOf(localDateTime: string): string {
  return localDateTime.slice(11, 16);
}

export function dayOf(localDateTime: string): string {
  return localDateTime.slice(0, 10);
}

export function addDays(day: string, amount: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, date + amount));
  return result.toISOString().slice(0, 10);
}

export function weekdayOf(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date)).getUTCDay();
}

export function formatLocalToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${date}`;
}
