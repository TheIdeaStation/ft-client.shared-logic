/**
 * Client-side helpers for the unified SessionScript (any modality).
 * Display/shape logic only — no business rules (those live on the server).
 */

import type { Modality, SessionScript } from "@/lib/api-client";
import type { Database } from "@/types/database";
import type { ScriptSummary } from "@/types/conversation";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

export const MICRO_MODALITIES: Modality[] = ["grounding", "breath", "affirmation", "meditation"];

/** True when the script plays as timed segments (no tapping rounds). */
export function isMicroScript(script: {
  modality?: Modality;
  rounds?: unknown[];
  segments?: unknown[];
}): boolean {
  if (script.modality && MICRO_MODALITIES.includes(script.modality)) return true;
  return !script.rounds?.length && Boolean(script.segments?.length);
}

/**
 * Build a SessionScript from a stored `sessions` row. Tapping rows written before
 * orchestration have no `modality` inside script_json — fall back to the column,
 * then to "tapping".
 */
export function storedSessionToScript(session: SessionRow): SessionScript | null {
  const raw = session.script_json as Partial<SessionScript> | null;
  if (!raw) return null;
  const modality = (raw.modality ?? session.modality ?? "tapping") as Modality;
  return {
    ...raw,
    sessionId: session.id,
    modality,
    title: raw.title ?? session.title,
    estimatedDurationMinutes:
      raw.estimatedDurationMinutes ??
      (session.duration_seconds ? Math.max(1, Math.round(session.duration_seconds / 60)) : 10),
    rationale: raw.rationale ?? "",
  };
}

/** Human labels for the tools Aria can choose. */
export const MODALITY_LABEL: Record<Modality, string> = {
  tapping: "Tapping",
  reframe: "Reframe",
  grounding: "Grounding",
  breath: "Breathing",
  affirmation: "Affirmations",
  meditation: "Meditation",
};

/** Compact summary of a micro-session for the reflection conversation. */
export function microScriptSummary(script: SessionScript): ScriptSummary {
  const texts = (script.segments ?? []).map((s) => s.text).filter(Boolean);
  const affirmations = (script.segments ?? [])
    .filter((s) => s.kind === "affirmation")
    .map((s) => s.text)
    .slice(0, 3);
  return {
    round_types: [script.modality],
    setup_statements: [],
    key_tapping_statements: texts.slice(0, 3),
    reframe_statements: affirmations,
  };
}
