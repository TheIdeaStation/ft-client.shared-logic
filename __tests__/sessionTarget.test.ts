/**
 * Session Target & Updated Progress Tests
 * =========================================
 * Tests the client-side logic for:
 * - Session target display ("Session 3 of 6")
 * - Updated progress calculation using total_sessions
 * - Journey review screen showing recommended session count
 * - Escape hatch for extending journeys
 * - Progress bar behavior with session targets
 */

import {
  calculateSessionTarget,
  formatSessionProgress,
  formatCompletedProgress,
  calculateProgressWithTarget,
  shouldOfferExtension,
  getExtensionMessage,
  getSessionTargetDescription,
} from "../lib/sessionTarget";

// ============================================================================
// TESTS
// ============================================================================

describe("Session Target: Client-Side Calculation", () => {
  test("single moderate issue → 4 sessions", () => {
    expect(calculateSessionTarget([{ sud: 5 }])).toBe(4);
  });

  test("two issues, high SUD → 6 sessions", () => {
    expect(calculateSessionTarget([{ sud: 8 }, { sud: 7 }])).toBe(6);
  });

  test("three severe issues → 8 sessions (capped)", () => {
    expect(calculateSessionTarget([{ sud: 9 }, { sud: 8 }, { sud: 9 }])).toBe(8);
  });

  test("no issues → 4 sessions (minimum)", () => {
    expect(calculateSessionTarget([])).toBe(4);
  });
});

describe("Session Target: Format Display String", () => {
  test("Session 1 of 6 (starting journey)", () => {
    expect(formatSessionProgress(0, 6)).toBe("Session 1 of 6");
  });

  test("Session 3 of 6 (mid-journey)", () => {
    expect(formatSessionProgress(2, 6)).toBe("Session 3 of 6");
  });

  test("Session 6 of 6 (last session)", () => {
    expect(formatSessionProgress(5, 6)).toBe("Session 6 of 6");
  });

  test("does not show Session 7 of 6 (clamped)", () => {
    expect(formatSessionProgress(6, 6)).toBe("Session 6 of 6");
  });

  test("fallback when total is 0 (legacy)", () => {
    expect(formatSessionProgress(3, 0)).toBe("3 sessions");
  });

  test("completed format: 3 of 6 sessions completed", () => {
    expect(formatCompletedProgress(3, 6)).toBe("3 of 6 sessions completed");
  });

  test("completed format: fallback when total is 0", () => {
    expect(formatCompletedProgress(5, 0)).toBe("5 sessions completed");
  });
});

describe("Session Target: Progress Calculation with Target", () => {
  test("0 completed → 0%", () => {
    expect(calculateProgressWithTarget({
      completedSessions: 0,
      totalSessions: 6,
      latestPostSud: null,
      initialSud: 8,
    })).toBe(0);
  });

  test("3 of 6 completed, SUD 8→5 → 50% (session-based wins)", () => {
    // Session: 3/6 = 50%, SUD: (8-5)/8 = 37.5% → max(50, 38) = 50%
    expect(calculateProgressWithTarget({
      completedSessions: 3,
      totalSessions: 6,
      latestPostSud: 5,
      initialSud: 8,
    })).toBe(50);
  });

  test("2 of 6 completed, SUD 8→2 → 75% (SUD-based wins — fast healer)", () => {
    // Session: 2/6 = 33%, SUD: (8-2)/8 = 75% → max(33, 75) = 75%
    expect(calculateProgressWithTarget({
      completedSessions: 2,
      totalSessions: 6,
      latestPostSud: 2,
      initialSud: 8,
    })).toBe(75);
  });

  test("6 of 6 completed → 100% regardless of SUD", () => {
    expect(calculateProgressWithTarget({
      completedSessions: 6,
      totalSessions: 6,
      latestPostSud: 5,
      initialSud: 8,
    })).toBe(100);
  });

  test("exceeding total sessions caps at 100%", () => {
    expect(calculateProgressWithTarget({
      completedSessions: 8,
      totalSessions: 6,
      latestPostSud: 3,
      initialSud: 8,
    })).toBe(100);
  });

  test("SUD dropped to 0 → 100% regardless of session count", () => {
    expect(calculateProgressWithTarget({
      completedSessions: 2,
      totalSessions: 6,
      latestPostSud: 0,
      initialSud: 8,
    })).toBe(100);
  });

  test("total_sessions 0 → 0% (legacy fallback)", () => {
    expect(calculateProgressWithTarget({
      completedSessions: 3,
      totalSessions: 0,
      latestPostSud: 5,
      initialSud: 8,
    })).toBe(0);
  });

  test("1 of 4 completed, no SUD change → 25%", () => {
    expect(calculateProgressWithTarget({
      completedSessions: 1,
      totalSessions: 4,
      latestPostSud: 8,
      initialSud: 8,
    })).toBe(25);
  });

  test("4 of 4 completed, SUD still high → 100% (sessions complete)", () => {
    expect(calculateProgressWithTarget({
      completedSessions: 4,
      totalSessions: 4,
      latestPostSud: 7,
      initialSud: 8,
    })).toBe(100);
  });
});

describe("Session Target: Extension Logic", () => {
  test("should NOT offer extension mid-journey", () => {
    expect(shouldOfferExtension(3, 6, 5)).toBe(false);
  });

  test("should offer extension when sessions complete but SUD elevated", () => {
    expect(shouldOfferExtension(6, 6, 5)).toBe(true);
  });

  test("should NOT offer extension when sessions complete and SUD low", () => {
    expect(shouldOfferExtension(6, 6, 3)).toBe(false);
  });

  test("should NOT offer extension when SUD is null", () => {
    expect(shouldOfferExtension(6, 6, null)).toBe(false);
  });

  test("should offer extension at SUD 4", () => {
    expect(shouldOfferExtension(6, 6, 4)).toBe(true);
  });

  test("should NOT offer extension at SUD 3 (threshold)", () => {
    expect(shouldOfferExtension(6, 6, 3)).toBe(false);
  });

  test("should NOT offer extension when total is 0 (legacy)", () => {
    expect(shouldOfferExtension(6, 0, 5)).toBe(false);
  });

  test("extension message for high SUD mentions 'elevated'", () => {
    const msg = getExtensionMessage(7);
    expect(msg).toContain("elevated");
  });

  test("extension message for moderate SUD mentions 'lock in'", () => {
    const msg = getExtensionMessage(4);
    expect(msg).toContain("lock in");
  });
});

describe("Session Target: Review Screen Description", () => {
  test("4-session journey has focused description", () => {
    const desc = getSessionTargetDescription(4);
    expect(desc).toContain("4-session");
    expect(desc).toContain("focused");
  });

  test("6-session journey has standard description", () => {
    const desc = getSessionTargetDescription(6);
    expect(desc).toContain("6-session");
    expect(desc).toContain("based on what you've shared");
  });

  test("8-session journey has thorough description", () => {
    const desc = getSessionTargetDescription(8);
    expect(desc).toContain("8-session");
    expect(desc).toContain("thorough");
  });
});

describe("Session Target: Journey Detail Stats Display", () => {
  test("stats show 'Session X of Y' format for active journey", () => {
    const display = formatSessionProgress(3, 6);
    expect(display).toBe("Session 4 of 6");
  });

  test("stats show completed format after journey done", () => {
    const display = formatCompletedProgress(6, 6);
    expect(display).toBe("6 of 6 sessions completed");
  });
});

describe("Session Target: Full Journey Scenarios", () => {
  test("light issue: 1 issue SUD 4 → 4 sessions, fast progress", () => {
    const target = calculateSessionTarget([{ sud: 4 }]);
    expect(target).toBe(4);

    // After 2 sessions, SUD drops to 1
    const progress = calculateProgressWithTarget({
      completedSessions: 2,
      totalSessions: target,
      latestPostSud: 1,
      initialSud: 4,
    });
    expect(progress).toBe(75); // SUD: (4-1)/4 = 75%, Session: 2/4 = 50% → 75%
  });

  test("heavy issue: 3 issues avg SUD 8 → 7 sessions, slow progress", () => {
    const target = calculateSessionTarget([{ sud: 8 }, { sud: 8 }, { sud: 8 }]);
    expect(target).toBe(7); // 4 + 2 issues + 1 high avg = 7

    // After 3 sessions, SUD only dropped to 6
    const progress = calculateProgressWithTarget({
      completedSessions: 3,
      totalSessions: target,
      latestPostSud: 6,
      initialSud: 8,
    });
    expect(progress).toBe(43); // Session: 3/7 = 43%, SUD: (8-6)/8 = 25% → 43%
  });

  test("extension scenario: 6/6 done but SUD still 5", () => {
    const shouldExtend = shouldOfferExtension(6, 6, 5);
    expect(shouldExtend).toBe(true);

    const msg = getExtensionMessage(5);
    expect(msg).toContain("lock in");
  });
});
