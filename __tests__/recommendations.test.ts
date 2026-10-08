/**
 * recommendations Tests
 * =====================
 * Tests recommendation scoring engine: issue matching, goal matching,
 * time-of-day boost, reflection themes, variety penalty, post-session.
 */

// Mock the preBuiltSessions constants
jest.mock("@/constants/preBuiltSessions", () => ({
  CATEGORIES: [
    { id: "anxiety", name: "Anxiety" },
    { id: "stress", name: "Stress" },
    { id: "sleep", name: "Sleep" },
    { id: "confidence", name: "Confidence" },
    { id: "anger", name: "Anger" },
    { id: "grief", name: "Grief" },
    { id: "focus", name: "Focus" },
  ],
  PRE_BUILT_SESSIONS: [
    { id: "anxiety-1", categoryId: "anxiety", title: "Calm Anxiety" },
    { id: "stress-1", categoryId: "stress", title: "Release Stress" },
    { id: "sleep-1", categoryId: "sleep", title: "Better Sleep" },
    { id: "confidence-1", categoryId: "confidence", title: "Build Confidence" },
    { id: "anger-1", categoryId: "anger", title: "Release Anger" },
    { id: "grief-1", categoryId: "grief", title: "Process Grief" },
    { id: "focus-1", categoryId: "focus", title: "Deep Focus" },
  ],
}));

import {
  getRecommendations,
  getPostSessionRecommendations,
  getTimeOfDay,
  type RecommendationContext,
} from "@/lib/recommendations";

const baseContext: RecommendationContext = {
  journeys: [],
  issues: [],
  recentSessions: [],
  reflectionThemes: [],
  timeOfDay: "morning",
};

describe("getTimeOfDay", () => {
  test("returns correct time periods", () => {
    const result = getTimeOfDay();
    expect(["morning", "afternoon", "evening", "night"]).toContain(result);
  });
});

describe("getRecommendations", () => {
  test("returns recommendations for all sessions", () => {
    const result = getRecommendations(baseContext);
    expect(result.length).toBe(7); // One per pre-built session
  });

  test("each recommendation has session, reason, and score", () => {
    const result = getRecommendations(baseContext);
    for (const rec of result) {
      expect(rec).toHaveProperty("session");
      expect(rec).toHaveProperty("reason");
      expect(rec).toHaveProperty("score");
      expect(typeof rec.score).toBe("number");
      expect(typeof rec.reason).toBe("string");
    }
  });

  test("results are sorted by score descending", () => {
    const result = getRecommendations(baseContext);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });

  test("issue matching boosts score for matching category", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      issues: [
        { id: "i-1", title: "Work anxiety", description: "Feeling nervous", current_sud: 7 } as never,
      ],
    };

    const result = getRecommendations(ctx);
    const anxietyRec = result.find((r) => r.session.categoryId === "anxiety");

    // Should have issue match (30) + high SUD bonus (15) + time-of-day potentially
    expect(anxietyRec!.score).toBeGreaterThanOrEqual(30);
    expect(anxietyRec!.reason).toContain("Work anxiety");
  });

  test("high SUD (>=7) gets extra 15 points", () => {
    const highSud: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night", // Minimize time-of-day interference
      issues: [
        { id: "i-1", title: "Anxiety attack", description: "", current_sud: 8 } as never,
      ],
    };

    const midSud: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
      issues: [
        { id: "i-1", title: "Anxiety attack", description: "", current_sud: 5 } as never,
      ],
    };

    const highResult = getRecommendations(highSud);
    const midResult = getRecommendations(midSud);

    const highAnxiety = highResult.find((r) => r.session.categoryId === "anxiety")!;
    const midAnxiety = midResult.find((r) => r.session.categoryId === "anxiety")!;

    expect(highAnxiety.score - midAnxiety.score).toBe(7); // 15 - 8
  });

  test("medium SUD (4-6) gets extra 8 points", () => {
    const midSud: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
      issues: [
        { id: "i-1", title: "Anxiety", description: "", current_sud: 5 } as never,
      ],
    };

    const lowSud: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
      issues: [
        { id: "i-1", title: "Anxiety", description: "", current_sud: 2 } as never,
      ],
    };

    const midResult = getRecommendations(midSud);
    const lowResult = getRecommendations(lowSud);

    const midAnxiety = midResult.find((r) => r.session.categoryId === "anxiety")!;
    const lowAnxiety = lowResult.find((r) => r.session.categoryId === "anxiety")!;

    expect(midAnxiety.score - lowAnxiety.score).toBe(8);
  });

  test("journey goal matching boosts score", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      journeys: [
        { id: "j-1", status: "active", goal: "Reduce work stress" } as never,
      ],
    };

    const result = getRecommendations(ctx);
    const stressRec = result.find((r) => r.session.categoryId === "stress")!;

    expect(stressRec.score).toBeGreaterThanOrEqual(20);
  });

  test("inactive journeys are not considered", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
      journeys: [
        { id: "j-1", status: "completed", goal: "Reduce work stress" } as never,
      ],
    };

    const result = getRecommendations(ctx);
    const stressRec = result.find((r) => r.session.categoryId === "stress")!;

    // Should only have base score (5) — no journey match for completed journeys
    expect(stressRec.score).toBe(5);
  });

  test("morning time-of-day boosts stress, confidence, focus", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "morning",
    };

    const result = getRecommendations(ctx);
    const stressRec = result.find((r) => r.session.categoryId === "stress")!;
    const confidenceRec = result.find((r) => r.session.categoryId === "confidence")!;
    const focusRec = result.find((r) => r.session.categoryId === "focus")!;
    const griefRec = result.find((r) => r.session.categoryId === "grief")!;

    // stress, confidence, focus get time boost (10) — no base 5 because score > 0
    expect(stressRec.score).toBe(10);
    expect(confidenceRec.score).toBe(10);
    expect(focusRec.score).toBe(10);
    // grief not boosted in morning, gets base score 5
    expect(griefRec.score).toBe(5);
  });

  test("evening time-of-day boosts sleep, anxiety, grief", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "evening",
    };

    const result = getRecommendations(ctx);
    const sleepRec = result.find((r) => r.session.categoryId === "sleep")!;
    const anxietyRec = result.find((r) => r.session.categoryId === "anxiety")!;
    const griefRec = result.find((r) => r.session.categoryId === "grief")!;

    // Time boost only (10), no base 5 since score > 0
    expect(sleepRec.score).toBe(10);
    expect(anxietyRec.score).toBe(10);
    expect(griefRec.score).toBe(10);
  });

  test("night time-of-day only boosts sleep", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
    };

    const result = getRecommendations(ctx);
    const sleepRec = result.find((r) => r.session.categoryId === "sleep")!;
    const stressRec = result.find((r) => r.session.categoryId === "stress")!;

    expect(sleepRec.score).toBe(10); // Time boost only
    expect(stressRec.score).toBe(5); // Base only
  });

  test("reflection themes boost matching categories", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night", // Minimize interference
      reflectionThemes: ["I've been struggling with anxiety"],
    };

    const result = getRecommendations(ctx);
    const anxietyRec = result.find((r) => r.session.categoryId === "anxiety")!;

    // Base (5) + reflection (12) + night-sleep doesn't include anxiety
    expect(anxietyRec.score).toBeGreaterThanOrEqual(12);
  });

  test("variety penalty reduces score for same category as last session", () => {
    const withoutPenalty: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
    };

    const withPenalty: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
      lastSessionCategory: "anxiety",
    };

    const noPenalty = getRecommendations(withoutPenalty);
    const penalty = getRecommendations(withPenalty);

    const noPenaltyAnxiety = noPenalty.find((r) => r.session.categoryId === "anxiety")!;
    const penaltyAnxiety = penalty.find((r) => r.session.categoryId === "anxiety")!;

    // Without penalty: score=0 → base=5. With penalty: score=0-10=-10, not 0 so no base.
    // Diff = 5 - (-10) = 15
    expect(noPenaltyAnxiety.score - penaltyAnxiety.score).toBe(15);
  });

  test("unmatched sessions get base score of 5", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night", // Only boosts sleep
    };

    const result = getRecommendations(ctx);
    const angerRec = result.find((r) => r.session.categoryId === "anger")!;

    expect(angerRec.score).toBe(5);
    expect(angerRec.reason).toBe("Anger");
  });

  test("multiple issues can match the same session", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
      issues: [
        { id: "i-1", title: "Worry about work", description: "", current_sud: 3 } as never,
        { id: "i-2", title: "Nervous about presentation", description: "", current_sud: 6 } as never,
      ],
    };

    const result = getRecommendations(ctx);
    const anxietyRec = result.find((r) => r.session.categoryId === "anxiety")!;

    // Both issues match anxiety: 30 + 30 + SUD bonuses
    expect(anxietyRec.score).toBeGreaterThanOrEqual(60);
  });

  test("issue description is also searched for category keywords", () => {
    const ctx: RecommendationContext = {
      ...baseContext,
      timeOfDay: "night",
      issues: [
        { id: "i-1", title: "General malaise", description: "feeling stressed and overwhelmed", current_sud: 5 } as never,
      ],
    };

    const result = getRecommendations(ctx);
    const stressRec = result.find((r) => r.session.categoryId === "stress")!;

    expect(stressRec.score).toBeGreaterThanOrEqual(30);
  });
});

describe("getPostSessionRecommendations", () => {
  test("returns max 3 recommendations", () => {
    const result = getPostSessionRecommendations(baseContext);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test("applies variety penalty for just-completed category", () => {
    const ctx = {
      ...baseContext,
      timeOfDay: "night" as const,
      justCompletedCategoryId: "sleep",
    };

    const result = getPostSessionRecommendations(ctx);

    // Sleep should be deprioritized
    const sleepRec = result.find((r) => r.session.categoryId === "sleep");
    if (sleepRec) {
      // If sleep appears, it should have the penalty
      expect(sleepRec.score).toBeLessThanOrEqual(5);
    }
  });

  test("overrides lastSessionCategory with justCompletedCategoryId", () => {
    const ctx = {
      ...baseContext,
      timeOfDay: "night" as const,
      lastSessionCategory: "anxiety",
      justCompletedCategoryId: "stress",
    };

    const result = getPostSessionRecommendations(ctx);

    // stress should be penalized (not anxiety)
    const stressRec = result.find((r) => r.session.categoryId === "stress");
    const anxietyRec = result.find((r) => r.session.categoryId === "anxiety");

    // Stress should have lower score than anxiety (stress has penalty, anxiety doesn't)
    if (stressRec && anxietyRec) {
      expect(anxietyRec.score).toBeGreaterThanOrEqual(stressRec.score);
    }
  });
});
