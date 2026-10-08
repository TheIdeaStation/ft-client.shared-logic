import {
  findSegmentAtPosition,
  isSameSegment,
  narrationDurationMs,
} from "../lib/audioSync";
import type { AudioSegment } from "../lib/api-client";

const seg = (roundIndex: number, pointIndex: number, start_ms: number, end_ms: number): AudioSegment => ({
  roundIndex,
  pointIndex,
  text: `r${roundIndex}p${pointIndex}`,
  start_ms,
  end_ms,
});

// Gaps between segments are deliberate: narration pads silence between points.
const segments: AudioSegment[] = [
  seg(0, 0, 0, 1000),
  seg(0, 1, 1500, 2500),
  seg(1, 0, 3000, 4000),
];

describe("findSegmentAtPosition", () => {
  test("returns the segment covering the position", () => {
    expect(findSegmentAtPosition(segments, 500)?.text).toBe("r0p0");
    expect(findSegmentAtPosition(segments, 1800)?.text).toBe("r0p1");
    expect(findSegmentAtPosition(segments, 3500)?.text).toBe("r1p0");
  });

  test("holds the last started segment through the silence after it", () => {
    // 1200ms is past r0p0's end but before r0p1 starts.
    expect(findSegmentAtPosition(segments, 1200)?.text).toBe("r0p0");
  });

  test("is inclusive of a segment's exact start", () => {
    expect(findSegmentAtPosition(segments, 1500)?.text).toBe("r0p1");
    expect(findSegmentAtPosition(segments, 3000)?.text).toBe("r1p0");
  });

  test("before playback begins, returns the first segment rather than nothing", () => {
    expect(findSegmentAtPosition(segments, 0)?.text).toBe("r0p0");
    expect(findSegmentAtPosition(segments, -50)?.text).toBe("r0p0");
  });

  test("past the end, stays on the final segment", () => {
    expect(findSegmentAtPosition(segments, 99_000)?.text).toBe("r1p0");
  });

  test("empty list returns null", () => {
    expect(findSegmentAtPosition([], 100)).toBeNull();
  });
});

describe("isSameSegment", () => {
  test("same start time is the same segment", () => {
    expect(isSameSegment(segments[0], seg(9, 9, 0, 1))).toBe(true);
  });
  test("different start times differ", () => {
    expect(isSameSegment(segments[0], segments[1])).toBe(false);
  });
  test("null handling", () => {
    expect(isSameSegment(null, null)).toBe(true);
    expect(isSameSegment(segments[0], null)).toBe(false);
    expect(isSameSegment(undefined, segments[0])).toBe(false);
  });
});

describe("narrationDurationMs", () => {
  test("takes the furthest end, not the last entry", () => {
    expect(narrationDurationMs(segments)).toBe(4000);
    expect(narrationDurationMs([seg(0, 0, 0, 9000), seg(0, 1, 100, 200)])).toBe(9000);
  });
  test("empty is zero", () => {
    expect(narrationDurationMs([])).toBe(0);
  });
});
