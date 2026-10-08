import type { MicroSegment } from "../lib/api-client";
import {
  formatMs,
  kindLabel,
  progressAtMs,
  secondsLeftInSegment,
  segmentIndexAtMs,
  segmentSpans,
  totalDurationMs,
} from "../lib/microSession";

const segs: MicroSegment[] = [
  { kind: "guidance", text: "settle", durationMs: 4000 },
  { kind: "breath_in", text: "in", durationMs: 4000 },
  { kind: "breath_out", text: "out", durationMs: 6000 },
];

describe("microSession playback logic", () => {
  it("sums total duration", () => {
    expect(totalDurationMs(segs)).toBe(14000);
    expect(totalDurationMs([])).toBe(0);
  });

  it("builds contiguous spans", () => {
    const spans = segmentSpans(segs);
    expect(spans.map((s) => [s.startMs, s.endMs])).toEqual([
      [0, 4000],
      [4000, 8000],
      [8000, 14000],
    ]);
  });

  it("locates the active segment at a given elapsed time", () => {
    expect(segmentIndexAtMs(segs, 0)).toBe(0);
    expect(segmentIndexAtMs(segs, 3999)).toBe(0);
    expect(segmentIndexAtMs(segs, 4000)).toBe(1);
    expect(segmentIndexAtMs(segs, 9000)).toBe(2);
  });

  it("clamps before start, at end, and handles empty", () => {
    expect(segmentIndexAtMs(segs, -100)).toBe(0);
    expect(segmentIndexAtMs(segs, 999999)).toBe(2);
    expect(segmentIndexAtMs([], 5)).toBe(-1);
  });

  it("reports overall progress 0..1", () => {
    expect(progressAtMs(segs, 0)).toBe(0);
    expect(progressAtMs(segs, 7000)).toBeCloseTo(0.5);
    expect(progressAtMs(segs, 14000)).toBe(1);
    expect(progressAtMs(segs, 99999)).toBe(1);
    expect(progressAtMs([], 5)).toBe(0);
  });

  it("counts seconds left in the current segment", () => {
    expect(secondsLeftInSegment(segs, 0)).toBe(4); // start of 4s guidance
    expect(secondsLeftInSegment(segs, 4000)).toBe(4); // start of 4s inhale
    expect(secondsLeftInSegment(segs, 8000)).toBe(6); // start of 6s exhale
    expect(secondsLeftInSegment(segs, 13000)).toBe(1);
  });

  it("formats ms as m:ss", () => {
    expect(formatMs(0)).toBe("0:00");
    expect(formatMs(9000)).toBe("0:09");
    expect(formatMs(65000)).toBe("1:05");
  });

  it("labels segment kinds (guidance is unlabeled)", () => {
    expect(kindLabel("breath_in")).toBe("Breathe in");
    expect(kindLabel("hold")).toBe("Hold");
    expect(kindLabel("affirmation")).toBe("Repeat");
    expect(kindLabel("guidance")).toBe("");
  });
});
