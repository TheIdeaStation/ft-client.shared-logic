import type { WeeklyRecapResponse } from "./api-client";

export function getAriaNote(recap: WeeklyRecapResponse): string {
  if (recap.journeys_completed > 0) {
    return "You completed a journey this week. That's a real milestone worth celebrating.";
  }
  if (recap.current_streak >= 7) {
    return "A full week streak — you're building something powerful.";
  }
  if (recap.sessions_completed >= 5) {
    return `What a week! ${recap.sessions_completed} sessions shows real dedication to your wellbeing.`;
  }
  if (recap.sessions_completed >= 3) {
    return "Steady progress this week. Every session is rewiring your response patterns.";
  }
  if (recap.sessions_completed >= 1) {
    return "You showed up this week. That matters more than you think.";
  }
  return "Every tap is a step forward.";
}

export function formatDateRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(weekEnd + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}
