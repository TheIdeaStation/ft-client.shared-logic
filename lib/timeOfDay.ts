/**
 * Device-local time-of-day bucket sent to generate-session as context. This is
 * a client-side *signal* (the device clock), not business logic — the server
 * decides what to do with it.
 */

export type TimeOfDay = "day" | "evening" | "night";

/** 06:00–17:59 day · 18:00–21:59 evening · 22:00–05:59 night */
export function timeOfDayForHour(hour: number): TimeOfDay {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h >= 22 || h < 6) return "night";
  if (h >= 18) return "evening";
  return "day";
}

export function getTimeOfDay(now: Date = new Date()): TimeOfDay {
  return timeOfDayForHour(now.getHours());
}
