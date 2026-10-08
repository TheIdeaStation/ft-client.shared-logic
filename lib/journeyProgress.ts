/**
 * Journey progress calculation — phase-based, not session-count-based.
 *
 * Phase model:
 *   0-40%  : Intensive phase (first 3 sessions, SUD still high)
 *   40-80% : Progressing (SUD dropping, approaching visualization threshold)
 *   80-100%: Visualization phase (SUD <= 3, completing reframe+visualization arc)
 */

interface ProgressSession {
  post_sud: number | null;
  status?: string;
}

interface ProgressInput {
  completedSessions: number;
  latestPostSud: number | null;
  initialSud: number;
  /** Number of consecutive sessions with post_sud <= 3 (visualization sessions) */
  consecutiveLowSudSessions?: number;
}

/**
 * Calculate journey progress percentage based on phase, not session count.
 *
 * Logic:
 * - Sessions 1-3 completed with SUD still high: 0-40%
 * - Sessions 4+ with SUD dropping toward 3: 40-80%
 * - SUD <= 3 (visualization phase): 80-100%
 *   - Each visualization session adds ~10% (2 sessions to reach 100%)
 */
export function calculateJourneyProgress(input: ProgressInput): number {
  const { completedSessions, latestPostSud, initialSud, consecutiveLowSudSessions = 0 } = input;

  if (completedSessions === 0) return 0;

  const currentSud = latestPostSud ?? initialSud;

  // Phase 3: Visualization (SUD <= 3) — 80-100%
  if (currentSud <= 3 && consecutiveLowSudSessions > 0) {
    // Viz arc can't start until 4+ completed sessions (3 repeat + 1 unique).
    // Before that, show 80% (pre-viz low SUD zone).
    if (completedSessions < 5) {
      return 80;
    }
    // Sessions 5+ are in the viz arc. Progress toward 100% based on sessions after 4.
    const vizPhaseSessions = completedSessions - 4;
    const vizProgress = Math.min(vizPhaseSessions / 2, 1);
    return Math.round(80 + vizProgress * 20);
  }

  // Phase 1: Early sessions (1-3) — 0-40%
  if (completedSessions <= 3) {
    // Linear within phase: 1 session = 13%, 2 = 27%, 3 = 40%
    return Math.round((completedSessions / 3) * 40);
  }

  // Phase 2: Progressing (4+ sessions, SUD > 3) — 40-80%
  // Progress based on how far SUD has dropped toward 3
  const sudRange = Math.max(initialSud - 3, 1); // total SUD points to drop to reach visualization
  const sudDropped = Math.max(initialSud - currentSud, 0);
  const sudProgress = Math.min(sudDropped / sudRange, 1);

  return Math.round(40 + sudProgress * 40);
}

/**
 * Helper to count consecutive low-SUD sessions from the end of a session list.
 */
export function countConsecutiveLowSudSessions(sessions: ProgressSession[]): number {
  const completed = sessions.filter((s) => s.status === "completed" || s.status === undefined);
  let count = 0;
  for (let i = completed.length - 1; i >= 0; i--) {
    if (completed[i].post_sud !== null && completed[i].post_sud! <= 3) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Get a human-readable phase label for the journey.
 */
export function getJourneyPhaseLabel(
  completedSessions: number,
  latestPostSud: number | null,
  consecutiveLowSudSessions: number,
): string {
  if (completedSessions === 0) return "Not started";

  const sud = latestPostSud ?? 10;

  if (sud <= 3 && consecutiveLowSudSessions > 0) {
    if (consecutiveLowSudSessions >= 2) return "Journey complete";
    return "Visualizing";
  }

  if (completedSessions <= 3) return "Processing";

  if (sud <= 5) return "Releasing";

  return "Deep work";
}
