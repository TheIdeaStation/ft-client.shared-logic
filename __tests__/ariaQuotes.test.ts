/**
 * Contextual Aria Quotes Tests
 * ============================
 * Tests that Aria's quote on the home screen responds to user progress.
 */

import { getContextualAriaQuote } from "@/lib/ariaQuotes";

const baseStats = {
  completedSessions: 0,
  currentStreak: 0,
  averageSudReduction: null as number | null,
  totalTappingMinutes: 0,
};

describe("getContextualAriaQuote", () => {
  test("0 sessions → welcoming message", () => {
    const quote = getContextualAriaQuote(baseStats);
    expect(quote).toContain("single tap");
  });

  test("30-day streak → top priority", () => {
    const quote = getContextualAriaQuote({ ...baseStats, completedSessions: 30, currentStreak: 30 });
    expect(quote).toContain("30 days");
  });

  test("14-day streak → rewiring message", () => {
    const quote = getContextualAriaQuote({ ...baseStats, completedSessions: 14, currentStreak: 14 });
    expect(quote).toContain("Two weeks");
  });

  test("7-day streak → commitment message", () => {
    const quote = getContextualAriaQuote({ ...baseStats, completedSessions: 7, currentStreak: 7 });
    expect(quote).toContain("full week");
  });

  test("3-day streak → consistency message with count", () => {
    const quote = getContextualAriaQuote({ ...baseStats, completedSessions: 3, currentStreak: 3 });
    expect(quote).toContain("3 days");
    expect(quote).toContain("consistency");
  });

  test("5-day streak → includes day count", () => {
    const quote = getContextualAriaQuote({ ...baseStats, completedSessions: 5, currentStreak: 5 });
    expect(quote).toContain("5 days");
  });

  test("high avg reduction (≥3) → body learning message", () => {
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 5,
      averageSudReduction: 3.5,
    });
    expect(quote).toContain("let go faster");
  });

  test("moderate avg reduction (≥1.5) → nervous system message", () => {
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 5,
      averageSudReduction: 2.0,
    });
    expect(quote).toContain("nervous system");
  });

  test("20+ sessions → powerful practice", () => {
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 22,
      averageSudReduction: 1.0,
    });
    expect(quote).toContain("20+");
  });

  test("10+ sessions → double digits", () => {
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 12,
      averageSudReduction: 1.0,
    });
    expect(quote).toContain("Double digits");
  });

  test("5 sessions → past starting line", () => {
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 5,
      averageSudReduction: 0.5,
    });
    expect(quote).toContain("5 sessions");
  });

  test("60+ minutes → hours invested", () => {
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 3,
      totalTappingMinutes: 90,
    });
    expect(quote).toContain("1+ hours");
  });

  test("low sessions, no streak, no reduction → generic quote", () => {
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 2,
      totalTappingMinutes: 15,
    });
    // Should be one of the generic quotes
    expect(typeof quote).toBe("string");
    expect(quote.length).toBeGreaterThan(10);
  });

  test("streak priority over session count", () => {
    // 7-day streak should win over 20 sessions
    const quote = getContextualAriaQuote({
      ...baseStats,
      completedSessions: 22,
      currentStreak: 7,
    });
    expect(quote).toContain("full week");
  });
});
