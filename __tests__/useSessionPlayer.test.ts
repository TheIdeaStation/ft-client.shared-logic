import {
  createReducer,
  INITIAL_STATE,
  type SessionPlayerState,
  type SessionPlayerAction,
} from "@/hooks/useSessionPlayer";
import type { TappingScript } from "@/types/tapping";

const mockScript: TappingScript = {
  sessionId: "test-session",
  title: "Test Session",
  estimatedDurationMinutes: 5,
  rounds: [
    {
      roundNumber: 1,
      type: "setup",
      intensityLevel: "high",
      setupStatement: "Even though I feel anxious...",
      tappingPoints: [
        { point: "KC", statement: "This anxiety", voiceInstruction: "This anxiety" },
        { point: "TH", statement: "This tension", voiceInstruction: "This tension" },
      ],
      breathingPause: false,
      sudCheck: false,
    },
    {
      roundNumber: 2,
      type: "tapping",
      intensityLevel: "medium",
      tappingPoints: [
        { point: "EB", statement: "Releasing stress", voiceInstruction: "Releasing stress" },
      ],
      breathingPause: true,
      sudCheck: true,
    },
    {
      roundNumber: 3,
      type: "positive_reframe",
      intensityLevel: "low",
      tappingPoints: [
        { point: "SE", statement: "I am calm", voiceInstruction: "I am calm" },
      ],
      breathingPause: false,
      sudCheck: false,
    },
  ],
};

function dispatch(
  reducer: ReturnType<typeof createReducer>,
  state: SessionPlayerState,
  ...actions: SessionPlayerAction[]
): SessionPlayerState {
  let current = state;
  for (const action of actions) {
    current = reducer(current, action);
  }
  return current;
}

describe("session player reducer", () => {
  const reducer = createReducer(mockScript);

  test("initial state is pre_sud phase", () => {
    expect(INITIAL_STATE.phase).toBe("pre_sud");
    expect(INITIAL_STATE.currentRoundIndex).toBe(0);
    expect(INITIAL_STATE.currentPointIndex).toBe(0);
    expect(INITIAL_STATE.preSud).toBeNull();
    expect(INITIAL_STATE.postSud).toBeNull();
    expect(INITIAL_STATE.isPaused).toBe(false);
    expect(INITIAL_STATE.surveyAnswers).toBeNull();
  });

  test("SUBMIT_PRE_SUD transitions to countdown", () => {
    const state = reducer(INITIAL_STATE, { type: "SUBMIT_PRE_SUD", sud: 7 });
    expect(state.phase).toBe("countdown");
    expect(state.preSud).toBe(7);
  });

  test("COUNTDOWN_DONE transitions to tapping", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" }
    );
    expect(state.phase).toBe("tapping");
    expect(state.currentRoundIndex).toBe(0);
    expect(state.currentPointIndex).toBe(0);
  });

  test("ADVANCE_POINT moves to next point in same round", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" }
    );
    expect(state.phase).toBe("tapping");
    expect(state.currentRoundIndex).toBe(0);
    expect(state.currentPointIndex).toBe(1);
  });

  test("advancing past last point of round 1 goes to next round", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" }, // p0 -> p1
      { type: "ADVANCE_POINT" }  // end of round 1 -> round 2
    );
    expect(state.phase).toBe("tapping");
    expect(state.currentRoundIndex).toBe(1);
    expect(state.currentPointIndex).toBe(0);
  });

  test("end of round 2 (breathingPause=true) transitions to breathing", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" }, // -> round 2
      { type: "ADVANCE_POINT" }  // end of round 2 -> breathing
    );
    expect(state.phase).toBe("breathing");
  });

  test("BREATHING_DONE with sudCheck transitions to sud_check", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },  // -> breathing
      { type: "BREATHING_DONE" }  // -> sud_check (round 2 has sudCheck=true)
    );
    expect(state.phase).toBe("sud_check");
  });

  test("SUBMIT_MID_SUD moves to next round", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },
      { type: "BREATHING_DONE" },
      { type: "SUBMIT_MID_SUD", sud: 4 }
    );
    expect(state.phase).toBe("tapping");
    expect(state.currentRoundIndex).toBe(2);
    expect(state.midSuds).toEqual([4]);
  });

  test("completing last round transitions to post_sud", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },
      { type: "BREATHING_DONE" },
      { type: "SUBMIT_MID_SUD", sud: 4 },
      { type: "ADVANCE_POINT" }  // end of round 3 -> post_sud
    );
    expect(state.phase).toBe("post_sud");
  });

  test("SUBMIT_POST_SUD transitions to reflection", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 7 },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },
      { type: "ADVANCE_POINT" },
      { type: "BREATHING_DONE" },
      { type: "SUBMIT_MID_SUD", sud: 4 },
      { type: "ADVANCE_POINT" },
      { type: "SUBMIT_POST_SUD", sud: 2 }
    );
    expect(state.phase).toBe("reflection");
    expect(state.preSud).toBe(7);
    expect(state.postSud).toBe(2);
  });

  test("TOGGLE_PAUSE toggles isPaused", () => {
    let state = reducer(INITIAL_STATE, { type: "TOGGLE_PAUSE" });
    expect(state.isPaused).toBe(true);
    state = reducer(state, { type: "TOGGLE_PAUSE" });
    expect(state.isPaused).toBe(false);
  });

  test("TICK_ELAPSED increments when not paused", () => {
    const started = reducer(INITIAL_STATE, { type: "SUBMIT_PRE_SUD", sud: 5 });
    const ticked = dispatch(reducer, started, { type: "TICK_ELAPSED" }, { type: "TICK_ELAPSED" });
    expect(ticked.elapsedSeconds).toBe(2);
  });

  test("TICK_ELAPSED does not increment when paused", () => {
    let state = reducer(INITIAL_STATE, { type: "SUBMIT_PRE_SUD", sud: 5 });
    state = reducer(state, { type: "TOGGLE_PAUSE" });
    state = reducer(state, { type: "TICK_ELAPSED" });
    expect(state.elapsedSeconds).toBe(0);
  });

  test("SET_SAVING updates isSaving", () => {
    let state = reducer(INITIAL_STATE, { type: "SET_SAVING", value: true });
    expect(state.isSaving).toBe(true);
    state = reducer(state, { type: "SET_SAVING", value: false });
    expect(state.isSaving).toBe(false);
  });

  // --- Missing coverage: SEEK_TO_POINT ---
  test("SEEK_TO_POINT jumps to valid round/point", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" },
      { type: "SEEK_TO_POINT", roundIndex: 1, pointIndex: 0 }
    );
    expect(state.phase).toBe("tapping");
    expect(state.currentRoundIndex).toBe(1);
    expect(state.currentPointIndex).toBe(0);
  });

  test("SEEK_TO_POINT with invalid roundIndex returns same state", () => {
    const base = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" }
    );
    const state = reducer(base, { type: "SEEK_TO_POINT", roundIndex: 99, pointIndex: 0 });
    expect(state).toBe(base);
  });

  test("SEEK_TO_POINT with invalid pointIndex returns same state", () => {
    const base = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 5 },
      { type: "COUNTDOWN_DONE" }
    );
    const state = reducer(base, { type: "SEEK_TO_POINT", roundIndex: 0, pointIndex: 99 });
    expect(state).toBe(base);
  });

  // --- Missing coverage: SUBMIT_SURVEY / SKIP_SURVEY / REFLECTION_DONE ---
  test("SUBMIT_SURVEY stores answers and transitions to reflection", () => {
    const answers = { q1: "a", q2: "b" };
    const base: SessionPlayerState = { ...INITIAL_STATE, phase: "post_survey" };
    const state = reducer(base, { type: "SUBMIT_SURVEY", answers: answers as never });
    expect(state.phase).toBe("reflection");
    expect(state.surveyAnswers).toEqual(answers);
  });

  test("SKIP_SURVEY transitions to reflection without answers", () => {
    const base: SessionPlayerState = { ...INITIAL_STATE, phase: "post_survey" };
    const state = reducer(base, { type: "SKIP_SURVEY" });
    expect(state.phase).toBe("reflection");
    expect(state.surveyAnswers).toBeNull();
  });

  test("REFLECTION_DONE transitions to summary", () => {
    const base: SessionPlayerState = { ...INITIAL_STATE, phase: "reflection" };
    const state = reducer(base, { type: "REFLECTION_DONE" });
    expect(state.phase).toBe("summary");
  });

  // --- Missing coverage: ADVANCE_POINT with no round (null guard) ---
  test("ADVANCE_POINT with out-of-bounds roundIndex goes to endPhase", () => {
    const base: SessionPlayerState = {
      ...INITIAL_STATE,
      phase: "tapping",
      currentRoundIndex: 99,
      currentPointIndex: 0,
    };
    const state = reducer(base, { type: "ADVANCE_POINT" });
    expect(state.phase).toBe("post_sud");
  });

  // --- Missing coverage: sudCheck on last round is skipped ---
  test("ADVANCE_POINT skips mid-SUD check on final round", () => {
    // Script with sudCheck on last round
    const scriptWithLastSudCheck: TappingScript = {
      sessionId: "test",
      title: "Test",
      estimatedDurationMinutes: 3,
      rounds: [
        {
          roundNumber: 1,
          type: "tapping",
          intensityLevel: "medium",
          tappingPoints: [
            { point: "KC", statement: "test", voiceInstruction: "test" },
          ],
          breathingPause: false,
          sudCheck: true, // sudCheck on last (only) round — should be skipped
        },
      ],
    };
    const r = createReducer(scriptWithLastSudCheck);
    const state = dispatch(
      r,
      { ...INITIAL_STATE, phase: "tapping" },
      { type: "ADVANCE_POINT" }
    );
    // Should go to post_sud, NOT sud_check (because it's the last round)
    expect(state.phase).toBe("post_sud");
  });

  // --- Missing coverage: BREATHING_DONE without sudCheck goes to next round ---
  test("BREATHING_DONE without sudCheck moves to next round", () => {
    const scriptBreathingNoSud: TappingScript = {
      sessionId: "test",
      title: "Test",
      estimatedDurationMinutes: 3,
      rounds: [
        {
          roundNumber: 1,
          type: "tapping",
          intensityLevel: "medium",
          tappingPoints: [
            { point: "KC", statement: "test", voiceInstruction: "test" },
          ],
          breathingPause: true,
          sudCheck: false,
        },
        {
          roundNumber: 2,
          type: "tapping",
          intensityLevel: "low",
          tappingPoints: [
            { point: "TH", statement: "test", voiceInstruction: "test" },
          ],
          breathingPause: false,
          sudCheck: false,
        },
      ],
    };
    const r = createReducer(scriptBreathingNoSud);
    const state = dispatch(
      r,
      { ...INITIAL_STATE, phase: "tapping" },
      { type: "ADVANCE_POINT" },  // end of round 1 -> breathing
      { type: "BREATHING_DONE" }  // no sudCheck -> next round
    );
    expect(state.phase).toBe("tapping");
    expect(state.currentRoundIndex).toBe(1);
  });

  // --- Missing coverage: BREATHING_DONE on last round goes to endPhase ---
  test("BREATHING_DONE on last round transitions to post_sud", () => {
    const scriptOneRound: TappingScript = {
      sessionId: "test",
      title: "Test",
      estimatedDurationMinutes: 3,
      rounds: [
        {
          roundNumber: 1,
          type: "tapping",
          intensityLevel: "medium",
          tappingPoints: [
            { point: "KC", statement: "test", voiceInstruction: "test" },
          ],
          breathingPause: true,
          sudCheck: false,
        },
      ],
    };
    const r = createReducer(scriptOneRound);
    const state = dispatch(
      r,
      { ...INITIAL_STATE, phase: "tapping" },
      { type: "ADVANCE_POINT" },  // end of round 1 -> breathing
      { type: "BREATHING_DONE" }  // last round, no sudCheck -> post_sud
    );
    expect(state.phase).toBe("post_sud");
  });

  // --- Missing coverage: BREATHING_DONE sudCheck on last round skips it ---
  test("BREATHING_DONE skips sudCheck on last round", () => {
    const scriptLastSudCheck: TappingScript = {
      sessionId: "test",
      title: "Test",
      estimatedDurationMinutes: 3,
      rounds: [
        {
          roundNumber: 1,
          type: "tapping",
          intensityLevel: "medium",
          tappingPoints: [
            { point: "KC", statement: "test", voiceInstruction: "test" },
          ],
          breathingPause: true,
          sudCheck: true,
        },
      ],
    };
    const r = createReducer(scriptLastSudCheck);
    const state = dispatch(
      r,
      { ...INITIAL_STATE, phase: "tapping" },
      { type: "ADVANCE_POINT" },
      { type: "BREATHING_DONE" }
    );
    // Last round with sudCheck should still go to post_sud, not sud_check
    expect(state.phase).toBe("post_sud");
  });

  // --- Missing coverage: SUBMIT_MID_SUD at end of rounds ---
  test("SUBMIT_MID_SUD at end of rounds transitions to post_sud", () => {
    const scriptOneSudCheck: TappingScript = {
      sessionId: "test",
      title: "Test",
      estimatedDurationMinutes: 3,
      rounds: [
        {
          roundNumber: 1,
          type: "tapping",
          intensityLevel: "medium",
          tappingPoints: [
            { point: "KC", statement: "test", voiceInstruction: "test" },
          ],
          breathingPause: false,
          sudCheck: true,
        },
      ],
    };
    const r = createReducer(scriptOneSudCheck);
    // Manually set to sud_check at round 0 (last round)
    const base: SessionPlayerState = {
      ...INITIAL_STATE,
      phase: "sud_check",
      currentRoundIndex: 0,
    };
    const state = r(base, { type: "SUBMIT_MID_SUD", sud: 3 });
    // nextRoundIndex = 1 >= rounds.length (1), so endPhase
    expect(state.phase).toBe("post_sud");
    expect(state.midSuds).toEqual([3]);
  });

  // --- Missing coverage: default action returns same state ---
  test("unknown action type returns same state", () => {
    const state = reducer(INITIAL_STATE, { type: "UNKNOWN" } as never);
    expect(state).toBe(INITIAL_STATE);
  });
});

describe("session player reducer — micro-tool scripts (Bet 4)", () => {
  const microScript = {
    modality: "breath" as const,
    segments: [
      { kind: "breath_in" as const, text: "In", durationMs: 4000 },
      { kind: "breath_out" as const, text: "Out", durationMs: 4000 },
    ],
  };
  const reducer = createReducer(microScript);

  test("COUNTDOWN_DONE enters the micro phase instead of tapping", () => {
    const state = dispatch(reducer, INITIAL_STATE, { type: "SUBMIT_PRE_SUD", sud: 3 }, { type: "COUNTDOWN_DONE" });
    expect(state.phase).toBe("micro");
    expect(state.preSud).toBe(3);
  });

  test("MICRO_DONE goes to post_sud so the session collects post-intensity like tapping", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 3 },
      { type: "COUNTDOWN_DONE" },
      { type: "MICRO_DONE" }
    );
    expect(state.phase).toBe("post_sud");
  });

  test("MICRO_DONE is ignored outside the micro phase", () => {
    const state = reducer(INITIAL_STATE, { type: "MICRO_DONE" });
    expect(state.phase).toBe("pre_sud");
  });

  test("post_sud → reflection → summary still applies to micro sessions", () => {
    const state = dispatch(
      reducer,
      INITIAL_STATE,
      { type: "SUBMIT_PRE_SUD", sud: 3 },
      { type: "COUNTDOWN_DONE" },
      { type: "MICRO_DONE" },
      { type: "SUBMIT_POST_SUD", sud: 1 },
      { type: "REFLECTION_DONE" }
    );
    expect(state.postSud).toBe(1);
    expect(state.phase).toBe("summary");
  });

  test("practice mode: MICRO_DONE goes straight to summary", () => {
    const practice = createReducer(microScript, true);
    const state = dispatch(practice, { ...INITIAL_STATE, phase: "countdown" }, { type: "COUNTDOWN_DONE" }, { type: "MICRO_DONE" });
    expect(state.phase).toBe("summary");
  });

  test("ADVANCE_POINT with no rounds is safe (ends the session)", () => {
    const state = dispatch(reducer, INITIAL_STATE, { type: "SUBMIT_PRE_SUD", sud: 3 }, { type: "COUNTDOWN_DONE" }, { type: "ADVANCE_POINT" });
    expect(state.phase).toBe("post_sud");
  });

  test("a tapping script with rounds never enters micro", () => {
    const tapping = createReducer(mockScript);
    const state = dispatch(tapping, INITIAL_STATE, { type: "SUBMIT_PRE_SUD", sud: 5 }, { type: "COUNTDOWN_DONE" });
    expect(state.phase).toBe("tapping");
  });
});

describe("session player reducer — practice mode", () => {
  const practiceReducer = createReducer(mockScript, true);

  test("practice mode endPhase is summary instead of post_sud", () => {
    const state = dispatch(
      practiceReducer,
      { ...INITIAL_STATE, phase: "countdown" },
      { type: "COUNTDOWN_DONE" },
      { type: "ADVANCE_POINT" }, // p0 -> p1
      { type: "ADVANCE_POINT" }, // end round 1 -> round 2
      { type: "ADVANCE_POINT" }, // end round 2 -> breathing (breathingPause=true)
      { type: "BREATHING_DONE" }, // practice mode skips sudCheck -> round 3
      { type: "ADVANCE_POINT" }   // end round 3 -> summary (practice endPhase)
    );
    expect(state.phase).toBe("summary");
  });

  test("practice mode BREATHING_DONE skips sudCheck", () => {
    // In practice mode, round.sudCheck is ignored
    const state = dispatch(
      practiceReducer,
      { ...INITIAL_STATE, phase: "tapping", currentRoundIndex: 1 },
      { type: "ADVANCE_POINT" }, // end round 2 -> breathing
      { type: "BREATHING_DONE" }
    );
    // Should go to next round, not sud_check
    expect(state.phase).toBe("tapping");
    expect(state.currentRoundIndex).toBe(2);
  });

  test("practice mode ADVANCE_POINT with no round goes to summary", () => {
    const state = practiceReducer(
      { ...INITIAL_STATE, phase: "tapping", currentRoundIndex: 99 },
      { type: "ADVANCE_POINT" }
    );
    expect(state.phase).toBe("summary");
  });

  test("practice mode BREATHING_DONE on last round goes to summary", () => {
    const state = practiceReducer(
      { ...INITIAL_STATE, phase: "breathing", currentRoundIndex: 2 },
      { type: "BREATHING_DONE" }
    );
    expect(state.phase).toBe("summary");
  });

  test("practice mode SUBMIT_MID_SUD at last round goes to summary", () => {
    const state = practiceReducer(
      { ...INITIAL_STATE, phase: "sud_check", currentRoundIndex: 2 },
      { type: "SUBMIT_MID_SUD", sud: 3 }
    );
    expect(state.phase).toBe("summary");
    expect(state.midSuds).toEqual([3]);
  });
});

describe("useSessionPlayer hook", () => {
  // Test the hook via renderHook-like approach using real React
  // Since the hook is a thin wrapper around useReducer + useCallback,
  // we test it by importing and calling it with mocked React
  let mockDispatch: jest.Mock;
  let mockState: SessionPlayerState;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockState = { ...INITIAL_STATE };
    jest.resetModules();
  });

  test("hook exports are importable and defined", () => {
    // Verify the hook module exports
    const mod = require("@/hooks/useSessionPlayer");
    expect(mod.useSessionPlayer).toBeDefined();
    expect(mod.createReducer).toBeDefined();
    expect(mod.INITIAL_STATE).toBeDefined();
  });

  test("useSessionPlayer returns all expected methods", () => {
    // Mock React for hook test
    jest.doMock("react", () => ({
      useReducer: (_r: unknown, init: SessionPlayerState) => [init, mockDispatch],
      useCallback: (fn: (...args: unknown[]) => unknown) => fn,
    }));

    // Re-import after mock
    jest.resetModules();
    const { useSessionPlayer } = require("@/hooks/useSessionPlayer");

    const result = useSessionPlayer(mockScript);
    expect(result.state).toBeDefined();
    expect(typeof result.submitPreSud).toBe("function");
    expect(typeof result.countdownDone).toBe("function");
    expect(typeof result.advancePoint).toBe("function");
    expect(typeof result.seekToPoint).toBe("function");
    expect(typeof result.breathingDone).toBe("function");
    expect(typeof result.microDone).toBe("function");
    expect(typeof result.submitMidSud).toBe("function");
    expect(typeof result.submitPostSud).toBe("function");
    expect(typeof result.submitSurvey).toBe("function");
    expect(typeof result.skipSurvey).toBe("function");
    expect(typeof result.reflectionDone).toBe("function");
    expect(typeof result.togglePause).toBe("function");
    expect(typeof result.tickElapsed).toBe("function");
    expect(typeof result.setSaving).toBe("function");
  });

  test("hook dispatches correct actions", () => {
    jest.doMock("react", () => ({
      useReducer: (_r: unknown, init: SessionPlayerState) => [init, mockDispatch],
      useCallback: (fn: (...args: unknown[]) => unknown) => fn,
    }));

    jest.resetModules();
    const { useSessionPlayer } = require("@/hooks/useSessionPlayer");

    const result = useSessionPlayer(mockScript);

    result.submitPreSud(7);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SUBMIT_PRE_SUD", sud: 7 });

    result.countdownDone();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "COUNTDOWN_DONE" });

    result.advancePoint();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "ADVANCE_POINT" });

    result.seekToPoint(1, 2);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SEEK_TO_POINT", roundIndex: 1, pointIndex: 2 });

    result.breathingDone();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "BREATHING_DONE" });

    result.submitMidSud(3);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SUBMIT_MID_SUD", sud: 3 });

    result.submitPostSud(2);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SUBMIT_POST_SUD", sud: 2 });

    const answers = { q1: "a" };
    result.submitSurvey(answers);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SUBMIT_SURVEY", answers });

    result.skipSurvey();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SKIP_SURVEY" });

    result.reflectionDone();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "REFLECTION_DONE" });

    result.togglePause();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TOGGLE_PAUSE" });

    result.tickElapsed();
    expect(mockDispatch).toHaveBeenCalledWith({ type: "TICK_ELAPSED" });

    result.setSaving(true);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SET_SAVING", value: true });
  });

  test("practice mode starts with countdown phase", () => {
    jest.doMock("react", () => ({
      useReducer: (_r: unknown, init: SessionPlayerState) => [init, mockDispatch],
      useCallback: (fn: (...args: unknown[]) => unknown) => fn,
    }));

    jest.resetModules();
    const { useSessionPlayer } = require("@/hooks/useSessionPlayer");

    const result = useSessionPlayer(mockScript, true);
    expect(result.state.phase).toBe("countdown");
  });

  test("non-practice mode starts with pre_sud phase", () => {
    jest.doMock("react", () => ({
      useReducer: (_r: unknown, init: SessionPlayerState) => [init, mockDispatch],
      useCallback: (fn: (...args: unknown[]) => unknown) => fn,
    }));

    jest.resetModules();
    const { useSessionPlayer } = require("@/hooks/useSessionPlayer");

    const result = useSessionPlayer(mockScript, false);
    expect(result.state.phase).toBe("pre_sud");
  });
});
