import { getTimeOfDay, timeOfDayForHour } from "@/lib/timeOfDay";

describe("timeOfDayForHour", () => {
  test("daytime hours", () => {
    for (const h of [6, 9, 12, 17]) expect(timeOfDayForHour(h)).toBe("day");
  });
  test("evening hours", () => {
    for (const h of [18, 20, 21]) expect(timeOfDayForHour(h)).toBe("evening");
  });
  test("night hours wrap midnight", () => {
    for (const h of [22, 23, 0, 3, 5]) expect(timeOfDayForHour(h)).toBe("night");
  });
  test("tolerates out-of-range and fractional hours", () => {
    expect(timeOfDayForHour(25)).toBe("night");
    expect(timeOfDayForHour(-2)).toBe("night");
    expect(timeOfDayForHour(12.7)).toBe("day");
  });
});

describe("getTimeOfDay", () => {
  test("uses the given date's local hour", () => {
    const d = new Date(2026, 0, 1, 20, 30);
    expect(getTimeOfDay(d)).toBe("evening");
  });
  test("defaults to now without throwing", () => {
    expect(["day", "evening", "night"]).toContain(getTimeOfDay());
  });
});
