import {
  buildFallbackAnalysis,
  buildFallbackGoal,
  shouldEnterConfirmPhase,
  stripAiTags,
} from "../lib/conversationLogic";
import type { AssessedIssue } from "../types/conversation";

const issue = (over: Partial<AssessedIssue> = {}): AssessedIssue => ({
  id: "i1",
  title: "Work Anxiety",
  description: "Tight chest before standups",
  intensity: 7,
  triggers: [],
  duration: null,
  bodyLocations: [],
  clarifications: {},
  suggestedClarifications: [],
  ...over,
});

describe("stripAiTags", () => {
  test("removes a closed extraction block", () => {
    expect(stripAiTags("Hello<extraction>{json}</extraction> there")).toBe("Hello there");
  });

  test("removes an UNCLOSED tag — a truncated reply must not leak markup", () => {
    expect(stripAiTags("Thanks for sharing.<extraction>{partial")).toBe("Thanks for sharing.");
  });

  test("handles reflection and checkin tags too", () => {
    expect(stripAiTags("a<reflection>x</reflection>b")).toBe("ab");
    expect(stripAiTags("a<checkin>x</checkin>b")).toBe("ab");
  });

  test("leaves ordinary prose untouched and trims", () => {
    expect(stripAiTags("  just words  ")).toBe("just words");
  });

  test("does not strip unrelated angle brackets", () => {
    expect(stripAiTags("I felt < 5 out of 10")).toBe("I felt < 5 out of 10");
  });
});

describe("buildFallbackGoal", () => {
  test("no issues yields a generic but valid goal", () => {
    expect(buildFallbackGoal([])).toContain("emotional resilience");
  });

  test("includes body locations, skipping 'none'", () => {
    const g = buildFallbackGoal([issue({ bodyLocations: ["chest", "none"] })]);
    expect(g).toContain("release tension in your chest");
    expect(g).not.toContain("none");
  });

  test("includes triggers", () => {
    expect(buildFallbackGoal([issue({ triggers: ["work"] })])).toContain("work");
  });

  test("mentions intensity only when 5 or above", () => {
    expect(buildFallbackGoal([issue({ intensity: 7 })])).toContain("7/10");
    expect(buildFallbackGoal([issue({ intensity: 3 })])).not.toContain("3/10");
  });

  test("falls back to the title when nothing else is known", () => {
    expect(
      buildFallbackGoal([issue({ intensity: null, triggers: [], bodyLocations: [] })]),
    ).toContain("work anxiety");
  });
});

describe("buildFallbackAnalysis", () => {
  test("preserves the user's order as priority", () => {
    const a = buildFallbackAnalysis([issue({ id: "a" }), issue({ id: "b" })]);
    expect(a.issues.map((i) => i.priority)).toEqual([1, 2]);
    expect(a.recommendedOrder).toEqual(["a", "b"]);
  });

  test("defaults a missing intensity to 5 rather than leaving it empty", () => {
    expect(buildFallbackAnalysis([issue({ intensity: null })]).issues[0]?.intensity).toBe(5);
  });

  test("titles the journey after the first issue", () => {
    expect(buildFallbackAnalysis([issue({ title: "Sleep" })]).suggestedJourneyTitle).toBe("Sleep");
  });

  test("never throws on an empty list — intake must not strand the user", () => {
    const a = buildFallbackAnalysis([]);
    expect(a.issues).toEqual([]);
    expect(a.suggestedJourneyTitle).toBe("My Journey");
  });
});

describe("shouldEnterConfirmPhase", () => {
  test("enters on the first extraction while still expressing", () => {
    expect(shouldEnterConfirmPhase(2, "express")).toBe(true);
  });

  test("does not re-enter from a later phase", () => {
    expect(shouldEnterConfirmPhase(2, "confirm")).toBe(false);
    expect(shouldEnterConfirmPhase(2, "assess")).toBe(false);
  });

  test("does not enter with nothing extracted", () => {
    expect(shouldEnterConfirmPhase(0, "express")).toBe(false);
  });
});
