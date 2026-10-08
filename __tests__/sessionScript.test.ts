import {
  isMicroScript,
  microScriptSummary,
  MODALITY_LABEL,
  storedSessionToScript,
} from "@/lib/sessionScript";
import type { SessionScript } from "@/lib/api-client";
import type { Database } from "@/types/database";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

const baseRow: SessionRow = {
  id: "s-1",
  user_id: "u-1",
  journey_id: "j-1",
  title: "Row title",
  pre_sud: null,
  post_sud: null,
  script_json: null,
  audio_url: null,
  audio_metadata: null,
  duration_seconds: null,
  status: "pending",
  modality: "tapping",
  completed_at: null,
  survey_json: null,
  created_at: "2026-09-14T00:00:00Z",
  updated_at: "2026-09-14T00:00:00Z",
};

describe("isMicroScript", () => {
  test("micro modalities are micro", () => {
    for (const m of ["grounding", "breath", "affirmation", "meditation"] as const) {
      expect(isMicroScript({ modality: m, segments: [] })).toBe(true);
    }
  });
  test("tapping/reframe with rounds are not micro", () => {
    expect(isMicroScript({ modality: "tapping", rounds: [{} as never] })).toBe(false);
    expect(isMicroScript({ modality: "reframe", rounds: [{} as never] })).toBe(false);
  });
  test("segments without rounds count as micro even with an odd modality", () => {
    expect(isMicroScript({ modality: "tapping", segments: [{ kind: "cue", text: "x", durationMs: 1 }] })).toBe(true);
  });
});

describe("storedSessionToScript", () => {
  test("null script_json returns null", () => {
    expect(storedSessionToScript(baseRow)).toBeNull();
  });

  test("legacy tapping row: modality from the column, sessionId from the row", () => {
    const row = { ...baseRow, script_json: { title: "Script", estimatedDurationMinutes: 12, rounds: [] } };
    const out = storedSessionToScript(row as SessionRow)!;
    expect(out.sessionId).toBe("s-1");
    expect(out.modality).toBe("tapping");
    expect(out.title).toBe("Script");
    expect(out.estimatedDurationMinutes).toBe(12);
    expect(out.rationale).toBe("");
  });

  test("micro row: modality + rationale + segments from script_json", () => {
    const row = {
      ...baseRow,
      modality: "breath" as const,
      duration_seconds: 240,
      script_json: { modality: "breath", title: "Breathe", rationale: "Slow down.", segments: [{ kind: "breath_in", text: "In", durationMs: 4000 }] },
    };
    const out = storedSessionToScript(row as SessionRow)!;
    expect(out.modality).toBe("breath");
    expect(out.rationale).toBe("Slow down.");
    expect(out.segments).toHaveLength(1);
    expect(out.estimatedDurationMinutes).toBe(4);
  });

  test("falls back to row title and 10 minutes", () => {
    const row = { ...baseRow, script_json: { rounds: [] } };
    const out = storedSessionToScript(row as SessionRow)!;
    expect(out.title).toBe("Row title");
    expect(out.estimatedDurationMinutes).toBe(10);
  });
});

describe("microScriptSummary", () => {
  const script: SessionScript = {
    sessionId: "s",
    modality: "affirmation",
    title: "Affirm",
    estimatedDurationMinutes: 3,
    rationale: "r",
    segments: [
      { kind: "guidance", text: "Settle in", durationMs: 1 },
      { kind: "affirmation", text: "I am enough", durationMs: 1 },
      { kind: "affirmation", text: "I can rest", durationMs: 1 },
      { kind: "affirmation", text: "I am safe", durationMs: 1 },
      { kind: "affirmation", text: "Extra", durationMs: 1 },
    ],
  };
  test("modality as the round type, first texts, affirmations capped at 3", () => {
    const s = microScriptSummary(script);
    expect(s.round_types).toEqual(["affirmation"]);
    expect(s.key_tapping_statements).toEqual(["Settle in", "I am enough", "I can rest"]);
    expect(s.reframe_statements).toEqual(["I am enough", "I can rest", "I am safe"]);
    expect(s.setup_statements).toEqual([]);
  });
  test("empty segments yield empty lists", () => {
    const s = microScriptSummary({ ...script, segments: undefined });
    expect(s.key_tapping_statements).toEqual([]);
    expect(s.reframe_statements).toEqual([]);
  });
});

describe("MODALITY_LABEL", () => {
  test("every modality has a label", () => {
    for (const m of ["tapping", "reframe", "grounding", "breath", "affirmation", "meditation"] as const) {
      expect(MODALITY_LABEL[m]).toBeTruthy();
    }
  });
});
