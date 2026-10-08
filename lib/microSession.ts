/**
 * Pure playback logic for micro-tool sessions (Bet 4): grounding, breath,
 * affirmation, meditation. The player component is a thin shell over these —
 * all timing/progression logic lives here so it can be unit-tested at 100%.
 */

import type { MicroSegment } from "@/lib/api-client";

export interface SegmentSpan {
  segment: MicroSegment;
  index: number;
  startMs: number;
  endMs: number;
}

/** Total duration of a micro-session in ms. */
export function totalDurationMs(segments: MicroSegment[]): number {
  return segments.reduce((sum, s) => sum + Math.max(0, s.durationMs), 0);
}

/** Cumulative [start, end) spans for each segment. */
export function segmentSpans(segments: MicroSegment[]): SegmentSpan[] {
  const spans: SegmentSpan[] = [];
  let cursor = 0;
  segments.forEach((segment, index) => {
    const dur = Math.max(0, segment.durationMs);
    spans.push({ segment, index, startMs: cursor, endMs: cursor + dur });
    cursor += dur;
  });
  return spans;
}

/**
 * Index of the active segment at `elapsedMs`. Clamps to the last segment once
 * the session is complete, and to 0 before it starts. Returns -1 for an empty
 * session.
 */
export function segmentIndexAtMs(segments: MicroSegment[], elapsedMs: number): number {
  if (segments.length === 0) return -1;
  if (elapsedMs <= 0) return 0;
  const total = totalDurationMs(segments);
  if (elapsedMs >= total) return segments.length - 1;
  const spans = segmentSpans(segments);
  for (const span of spans) {
    if (elapsedMs >= span.startMs && elapsedMs < span.endMs) return span.index;
  }
  return segments.length - 1;
}

/** Overall progress 0..1 across the whole session. */
export function progressAtMs(segments: MicroSegment[], elapsedMs: number): number {
  const total = totalDurationMs(segments);
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, elapsedMs / total));
}

/** Whole seconds remaining in the CURRENT segment at `elapsedMs`. */
export function secondsLeftInSegment(segments: MicroSegment[], elapsedMs: number): number {
  const idx = segmentIndexAtMs(segments, elapsedMs);
  if (idx < 0) return 0;
  const span = segmentSpans(segments)[idx];
  return Math.max(0, Math.ceil((span.endMs - Math.min(elapsedMs, span.endMs)) / 1000));
}

/** "m:ss" formatter for a millisecond duration. */
export function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Human-facing label for a segment kind (also drives the breathing animation). */
export function kindLabel(kind: MicroSegment["kind"]): string {
  switch (kind) {
    case "breath_in": return "Breathe in";
    case "breath_out": return "Breathe out";
    case "hold": return "Hold";
    case "cue": return "Notice";
    case "affirmation": return "Repeat";
    case "guidance": return "";
  }
}
