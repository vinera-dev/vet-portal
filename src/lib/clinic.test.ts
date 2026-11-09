import {
  firstOpenDay,
  formatDayLong,
  formatDayShort,
  gridTimes,
  isClosedDay,
  serviceLabel,
  upcomingDays,
} from "./clinic";

describe("clinic helpers", () => {
  it("builds the 30 minute grid", () => {
    const times = gridTimes();
    expect(times).toHaveLength(20);
    expect(times[0]).toBe("08:00");
    expect(times[1]).toBe("08:30");
    expect(times.at(-1)).toBe("17:30");
  });

  it("lists upcoming days", () => {
    const days = upcomingDays("2026-11-07", 3);
    expect(days).toEqual(["2026-11-07", "2026-11-08", "2026-11-09"]);
  });

  it("knows Sunday is closed and skips it", () => {
    expect(isClosedDay("2026-11-08")).toBe(true);
    expect(firstOpenDay(["2026-11-08", "2026-11-09"])).toBe("2026-11-09");
  });

  it("formats days independent of the machine timezone", () => {
    expect(formatDayShort("2026-11-09")).toBe("Mon 9 Nov");
    expect(formatDayLong("2026-11-09")).toBe("Monday 9 November 2026");
  });

  it("labels services", () => {
    expect(serviceLabel("GROOMING")).toBe("Bath and grooming");
  });
});
