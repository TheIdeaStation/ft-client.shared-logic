/**
 * First Tap (Quick Tap Before Journey) Logic Tests
 * ==================================================
 * Tests the logic for the first-time user experience:
 * - Determining if user is a first-time tapper
 * - Selecting top categories for quick tap
 * - Finding the first free session in a category
 * - Post-session CTA logic (show personalized journey prompt)
 * - Transition from first-tap to regular home
 */

import {
  isFirstTimeUser,
  shouldShowPersonalizedCTA,
  getQuickTapCategories,
  getFirstFreeSession,
  getQuickTapGreeting,
  getPersonalizedCTAText,
} from "../lib/firstTap";

// ============================================================================
// TESTS
// ============================================================================

describe("First Tap: User State Detection", () => {
  test("brand new user (0 sessions, 0 journeys) is first-time", () => {
    expect(isFirstTimeUser(0, 0)).toBe(true);
  });

  test("user with 1+ sessions is NOT first-time", () => {
    expect(isFirstTimeUser(1, 0)).toBe(false);
  });

  test("user with journey but 0 sessions is NOT first-time", () => {
    expect(isFirstTimeUser(0, 1)).toBe(false);
  });

  test("user with both sessions and journeys is NOT first-time", () => {
    expect(isFirstTimeUser(3, 2)).toBe(false);
  });
});

describe("First Tap: Personalized CTA Detection", () => {
  test("show CTA after first session with no journeys", () => {
    expect(shouldShowPersonalizedCTA(1, 0)).toBe(true);
  });

  test("show CTA after multiple sessions with no journeys", () => {
    expect(shouldShowPersonalizedCTA(5, 0)).toBe(true);
  });

  test("do NOT show CTA for brand new user (no sessions yet)", () => {
    expect(shouldShowPersonalizedCTA(0, 0)).toBe(false);
  });

  test("do NOT show CTA when user already has journeys", () => {
    expect(shouldShowPersonalizedCTA(3, 1)).toBe(false);
  });
});

describe("First Tap: Quick Tap Categories", () => {
  test("returns top 3 categories by default", () => {
    const result = getQuickTapCategories(3);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("anxiety");
    expect(result[1].id).toBe("stress");
    expect(result[2].id).toBe("sleep");
  });

  test("respects count parameter", () => {
    expect(getQuickTapCategories(2)).toHaveLength(2);
    expect(getQuickTapCategories(5)).toHaveLength(5);
  });

  test("handles count larger than available", () => {
    // There are 9 categories total
    expect(getQuickTapCategories(20)).toHaveLength(9);
  });

  test("handles zero count", () => {
    expect(getQuickTapCategories(0)).toHaveLength(0);
  });
});

describe("First Tap: Finding Free Sessions", () => {
  test("finds first session in anxiety category", () => {
    const session = getFirstFreeSession("anxiety");
    expect(session).not.toBeNull();
    expect(session!.categoryId).toBe("anxiety");
    expect(session!.title).toBe("Quick Calm");
  });

  test("finds first session in stress category", () => {
    const session = getFirstFreeSession("stress");
    expect(session).not.toBeNull();
    expect(session!.categoryId).toBe("stress");
  });

  test("returns null for nonexistent category", () => {
    expect(getFirstFreeSession("nonexistent")).toBeNull();
  });

  test("first session in anxiety is beginner difficulty", () => {
    const session = getFirstFreeSession("anxiety");
    expect(session!.difficulty).toBe("beginner");
  });
});

describe("First Tap: Greeting", () => {
  test("returns a non-empty greeting string", () => {
    const greeting = getQuickTapGreeting();
    expect(greeting.length).toBeGreaterThan(0);
    expect(["Good morning", "Good afternoon", "Good evening"]).toContain(greeting);
  });
});

describe("First Tap: Personalized CTA Content", () => {
  test("CTA has title, subtitle, and button label", () => {
    const cta = getPersonalizedCTAText();
    expect(cta.title).toBeTruthy();
    expect(cta.subtitle).toBeTruthy();
    expect(cta.buttonLabel).toBeTruthy();
  });

  test("title asks about going deeper", () => {
    const cta = getPersonalizedCTAText();
    expect(cta.title).toContain("deeper");
  });

  test("button says 'Talk to Aria'", () => {
    const cta = getPersonalizedCTAText();
    expect(cta.buttonLabel).toBe("Talk to Aria");
  });

  test("subtitle mentions personalized", () => {
    const cta = getPersonalizedCTAText();
    expect(cta.subtitle).toContain("personalized");
  });
});

describe("First Tap: Full Flow Scenarios", () => {
  test("scenario: brand new user → sees first-tap hero → picks anxiety → Quick Calm", () => {
    // Step 1: User is first-time
    expect(isFirstTimeUser(0, 0)).toBe(true);
    expect(shouldShowPersonalizedCTA(0, 0)).toBe(false);

    // Step 2: Get top 3 categories
    const topCategories = getQuickTapCategories(3);
    expect(topCategories).toHaveLength(3);

    // Step 3: User taps Anxiety → find free session
    const session = getFirstFreeSession("anxiety");
    expect(session).not.toBeNull();
    expect(session!.title).toBe("Quick Calm");

    // Step 4: After completing session, show personalized CTA
    expect(isFirstTimeUser(1, 0)).toBe(false);
    expect(shouldShowPersonalizedCTA(1, 0)).toBe(true);
  });

  test("scenario: user creates journey → personalized CTA disappears", () => {
    // User has completed sessions but now also has a journey
    expect(shouldShowPersonalizedCTA(3, 1)).toBe(false);
    expect(isFirstTimeUser(3, 1)).toBe(false);
  });

  test("scenario: returning user with sessions → normal home (no first-tap, no CTA)", () => {
    expect(isFirstTimeUser(5, 2)).toBe(false);
    expect(shouldShowPersonalizedCTA(5, 2)).toBe(false);
  });
});
