/**
 * Session target calculation and display utilities.
 *
 * Calculates the recommended number of sessions for a journey
 * based on issue count and SUD levels. Also provides formatting
 * for "Session X of Y" display and extension logic.
 */

const MIN_SESSIONS = 4;
const MAX_SESSIONS = 8;

interface IssueInput {
  sud: number;
}

/**
 * Calculate recommended session target based on issues.
 *
 * Formula:
 * - Base: 4 sessions (minimum for any journey)
 * - +1 for each issue beyond the first
 * - +1 if average SUD >= 7 (high distress)
 * - +1 if any issue has SUD >= 9 (severe distress)
 * - Clamped to [4, 8]
 */
export function calculateSessionTarget(issues: IssueInput[]): number {
  if (issues.length === 0) return MIN_SESSIONS;

  let target = MIN_SESSIONS;
  target += Math.max(0, issues.length - 1);

  const avgSud = issues.reduce((sum, i) => sum + i.sud, 0) / issues.length;
  if (avgSud >= 7) target += 1;
  if (issues.some((i) => i.sud >= 9)) target += 1;

  return Math.min(Math.max(target, MIN_SESSIONS), MAX_SESSIONS);
}

/**
 * Format "Session X of Y" for active journeys.
 * Shows the NEXT session number (completed + 1), clamped to total.
 */
export function formatSessionProgress(completed: number, total: number): string {
  if (total <= 0) return `${completed} sessions`;
  return `Session ${Math.min(completed + 1, total)} of ${total}`;
}

/**
 * Format "X of Y sessions completed" for stats display.
 */
export function formatCompletedProgress(completed: number, total: number): string {
  if (total <= 0) return `${completed} sessions completed`;
  return `${completed} of ${total} sessions completed`;
}

/**
 * Calculate progress using session target.
 * Uses the HIGHER of session-based or SUD-based progress,
 * rewarding users who heal faster than expected.
 */
export function calculateProgressWithTarget(input: {
  completedSessions: number;
  totalSessions: number;
  latestPostSud: number | null;
  initialSud: number;
}): number {
  const { completedSessions, totalSessions, latestPostSud, initialSud } = input;

  if (completedSessions === 0 || totalSessions <= 0) return 0;

  const sessionProgress = Math.min(completedSessions / totalSessions, 1);

  const currentSud = latestPostSud ?? initialSud;
  const sudRange = Math.max(initialSud, 1);
  const sudDropped = Math.max(initialSud - currentSud, 0);
  const sudProgress = Math.min(sudDropped / sudRange, 1);

  return Math.round(Math.max(sessionProgress, sudProgress) * 100);
}

/**
 * Should the journey offer a session extension?
 * True when all planned sessions are done but SUD is still elevated.
 */
export function shouldOfferExtension(
  completedSessions: number,
  totalSessions: number,
  latestPostSud: number | null,
): boolean {
  if (totalSessions <= 0) return false;
  if (completedSessions < totalSessions) return false;
  return latestPostSud !== null && latestPostSud > 3;
}

/**
 * Extension message based on current SUD level.
 */
export function getExtensionMessage(latestPostSud: number | null): string {
  if (latestPostSud !== null && latestPostSud >= 6) {
    return "Your distress is still elevated. Would you like to add 2 more sessions?";
  }
  return "You've completed your planned sessions. Want to extend by 2 more to lock in your progress?";
}

/**
 * Description for the review screen showing why this session count was chosen.
 */
export function getSessionTargetDescription(target: number): string {
  if (target <= 4) {
    return `Aria recommends a ${target}-session journey — a focused path for your healing.`;
  }
  if (target >= 7) {
    return `Aria recommends a ${target}-session journey to give you thorough support for what you're working through.`;
  }
  return `Aria recommends a ${target}-session journey based on what you've shared.`;
}
