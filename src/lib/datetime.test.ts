import {
  addDays,
  dayOf,
  formatLocalToday,
  isValidDate,
  normalizeLocalDateTime,
  timeOf,
  weekdayOf,
} from "./datetime";

describe("datetime helpers", () => {
  it("validates dates", () => {
    expect(isValidDate("2026-11-09")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("09/11/2026")).toBe(false);
  });

  it("normalizes local date times", () => {
    expect(normalizeLocalDateTime("2026-11-09T08:30")).toBe("2026-11-09T08:30:00");
    expect(normalizeLocalDateTime("2026-11-09T08:30:15")).toBe("2026-11-09T08:30:15");
    expect(normalizeLocalDateTime("2026-11-09T25:00")).toBeNull();
    expect(normalizeLocalDateTime("2026-11-09 08:30")).toBeNull();
    expect(normalizeLocalDateTime("2026-13-09T08:30")).toBeNull();
  });

  it("splits parts", () => {
    expect(dayOf("2026-11-09T08:30:00")).toBe("2026-11-09");
    expect(timeOf("2026-11-09T08:30:00")).toBe("08:30");
  });

  it("does day arithmetic across months", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the weekday", () => {
    expect(weekdayOf("2026-11-08")).toBe(0);
    expect(weekdayOf("2026-11-09")).toBe(1);
  });

  it("formats the local day", () => {
    expect(formatLocalToday(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
