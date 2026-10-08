/**
 * Mapping audio playback position onto a session's tapping points.
 *
 * Pre-generated session narration is a single MP3 plus `audio_metadata.segments`,
 * each carrying the round and point it speaks and its millisecond span. Playback
 * position is therefore what advances the session, not a timer.
 *
 * Pure so both clients share one definition: mobile reads position from
 * expo-audio, web from an <audio> element's currentTime.
 */

import type { AudioSegment } from "./api-client";

/**
 * The segment playing at `ms`.
 *
 * Scans backwards for the last segment that has started, which keeps the
 * answer correct inside the silence padded between points. Before the first
 * segment starts it returns the first one, so a session opens on point 1
 * rather than on nothing. Returns null only for an empty list.
 */
export function findSegmentAtPosition(
  segments: readonly AudioSegment[],
  ms: number,
): AudioSegment | null {
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg && ms >= seg.start_ms) return seg;
  }
  return segments[0] ?? null;
}

/** True when two segments address the same point (identity is the start time). */
export function isSameSegment(
  a: AudioSegment | null | undefined,
  b: AudioSegment | null | undefined,
): boolean {
  if (!a || !b) return a === b;
  return a.start_ms === b.start_ms;
}

/** Total narration length in ms, from the last segment's end. */
export function narrationDurationMs(segments: readonly AudioSegment[]): number {
  let max = 0;
  for (const s of segments) if (s.end_ms > max) max = s.end_ms;
  return max;
}
