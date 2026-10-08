import { useReducer, useCallback } from "react";
import type { TappingRound } from "@/types/tapping";
import type { MicroSegment, Modality } from "@/lib/api-client";
import { isMicroScript } from "@/lib/sessionScript";
import type { SurveyAnswers } from "@/types/survey";

/**
 * Anything the player can run: a tapping script (rounds) or a micro-tool
 * script (segments). Structural so both TappingScript and SessionScript fit.
 */
export interface PlayerScript {
  modality?: Modality;
  rounds?: TappingRound[];
  segments?: MicroSegment[];
}

export type SessionPhase =
  | "pre_sud"
  | "countdown"
  | "tapping"
  | "micro"
  | "breathing"
  | "sud_check"
  | "post_sud"
  | "post_survey"
  | "reflection"
  | "summary";

export interface SessionPlayerState {
  phase: SessionPhase;
  currentRoundIndex: number;
  currentPointIndex: number;
  preSud: number | null;
  midSuds: number[];
  postSud: number | null;
  isPaused: boolean;
  elapsedSeconds: number;
  isSaving: boolean;
  surveyAnswers: SurveyAnswers | null;
}

export type SessionPlayerAction =
  | { type: "SUBMIT_PRE_SUD"; sud: number }
  | { type: "COUNTDOWN_DONE" }
  | { type: "ADVANCE_POINT" }
  | { type: "SEEK_TO_POINT"; roundIndex: number; pointIndex: number }
  | { type: "BREATHING_DONE" }
  | { type: "MICRO_DONE" }
  | { type: "SUBMIT_MID_SUD"; sud: number }
  | { type: "SUBMIT_POST_SUD"; sud: number }
  | { type: "SUBMIT_SURVEY"; answers: SurveyAnswers }
  | { type: "SKIP_SURVEY" }
  | { type: "REFLECTION_DONE" }
  | { type: "TOGGLE_PAUSE" }
  | { type: "TICK_ELAPSED" }
  | { type: "SET_SAVING"; value: boolean };

export const INITIAL_STATE: SessionPlayerState = {
  phase: "pre_sud",
  currentRoundIndex: 0,
  currentPointIndex: 0,
  preSud: null,
  midSuds: [],
  postSud: null,
  isPaused: false,
  elapsedSeconds: 0,
  isSaving: false,
  surveyAnswers: null,
};

export function createReducer(script: PlayerScript, practiceMode = false) {
  /** In practice mode, end-of-tapping goes straight to summary */
  const endPhase = practiceMode ? "summary" : ("post_sud" as SessionPhase);
  const rounds = script.rounds ?? [];
  /** Micro-tool scripts (breath/grounding/affirmation/meditation) play as timed segments. */
  const micro = isMicroScript(script);

  return function reducer(
    state: SessionPlayerState,
    action: SessionPlayerAction
  ): SessionPlayerState {
    switch (action.type) {
      case "SUBMIT_PRE_SUD":
        return { ...state, preSud: action.sud, phase: "countdown" };

      case "COUNTDOWN_DONE":
        if (micro) return { ...state, phase: "micro", currentRoundIndex: 0, currentPointIndex: 0 };
        return { ...state, phase: "tapping", currentRoundIndex: 0, currentPointIndex: 0 };

      case "MICRO_DONE":
        if (state.phase !== "micro") return state;
        return { ...state, phase: endPhase };

      case "ADVANCE_POINT": {
        const round = rounds[state.currentRoundIndex];
        if (!round) return { ...state, phase: endPhase };

        const nextPointIndex = state.currentPointIndex + 1;

        // More points in this round
        if (nextPointIndex < round.tappingPoints.length) {
          return { ...state, currentPointIndex: nextPointIndex };
        }

        // End of round — check for breathing pause or SUD check
        const nextRoundIndex = state.currentRoundIndex + 1;
        const isLastRound = nextRoundIndex >= rounds.length;

        if (round.breathingPause) {
          return { ...state, phase: "breathing" };
        }
        // Skip mid-session SUD check on the final round — post_sud follows immediately
        if (!practiceMode && round.sudCheck && !isLastRound) {
          return { ...state, phase: "sud_check" };
        }

        // Move to next round or end
        if (!isLastRound) {
          return { ...state, currentRoundIndex: nextRoundIndex, currentPointIndex: 0, phase: "tapping" };
        }
        return { ...state, phase: endPhase };
      }

      case "SEEK_TO_POINT": {
        // Direct jump to a specific round/point — used by audio segment sync
        const targetRound = rounds[action.roundIndex];
        if (!targetRound || action.pointIndex >= targetRound.tappingPoints.length) {
          return state;
        }
        return {
          ...state,
          currentRoundIndex: action.roundIndex,
          currentPointIndex: action.pointIndex,
          phase: "tapping",
        };
      }

      case "BREATHING_DONE": {
        const round = rounds[state.currentRoundIndex];
        const nextRoundIdx = state.currentRoundIndex + 1;
        const isLast = nextRoundIdx >= rounds.length;
        // Skip mid-session SUD check on the final round — post_sud follows immediately
        if (!practiceMode && round?.sudCheck && !isLast) {
          return { ...state, phase: "sud_check" };
        }
        if (!isLast) {
          return { ...state, currentRoundIndex: nextRoundIdx, currentPointIndex: 0, phase: "tapping" };
        }
        return { ...state, phase: endPhase };
      }

      case "SUBMIT_MID_SUD": {
        const nextRoundIndex = state.currentRoundIndex + 1;
        if (nextRoundIndex < rounds.length) {
          return {
            ...state,
            midSuds: [...state.midSuds, action.sud],
            currentRoundIndex: nextRoundIndex,
            currentPointIndex: 0,
            phase: "tapping",
          };
        }
        return {
          ...state,
          midSuds: [...state.midSuds, action.sud],
          phase: endPhase,
        };
      }

      case "SUBMIT_POST_SUD":
        return { ...state, postSud: action.sud, phase: "reflection" };

      case "SUBMIT_SURVEY":
        return { ...state, surveyAnswers: action.answers, phase: "reflection" };

      case "SKIP_SURVEY":
        return { ...state, phase: "reflection" };

      case "REFLECTION_DONE":
        return { ...state, phase: "summary" };

      case "TOGGLE_PAUSE":
        return { ...state, isPaused: !state.isPaused };

      case "TICK_ELAPSED":
        if (state.isPaused) return state;
        return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };

      case "SET_SAVING":
        return { ...state, isSaving: action.value };

      default:
        return state;
    }
  };
}

export function useSessionPlayer(script: PlayerScript, practiceMode = false) {
  const [state, dispatch] = useReducer(
    createReducer(script, practiceMode),
    { ...INITIAL_STATE, phase: practiceMode ? "countdown" : "pre_sud" }
  );

  const submitPreSud = useCallback((sud: number) => {
    dispatch({ type: "SUBMIT_PRE_SUD", sud });
  }, []);

  const countdownDone = useCallback(() => {
    dispatch({ type: "COUNTDOWN_DONE" });
  }, []);

  const advancePoint = useCallback(() => {
    dispatch({ type: "ADVANCE_POINT" });
  }, []);

  const seekToPoint = useCallback((roundIndex: number, pointIndex: number) => {
    dispatch({ type: "SEEK_TO_POINT", roundIndex, pointIndex });
  }, []);

  const breathingDone = useCallback(() => {
    dispatch({ type: "BREATHING_DONE" });
  }, []);

  const microDone = useCallback(() => {
    dispatch({ type: "MICRO_DONE" });
  }, []);

  const submitMidSud = useCallback((sud: number) => {
    dispatch({ type: "SUBMIT_MID_SUD", sud });
  }, []);

  const submitPostSud = useCallback((sud: number) => {
    dispatch({ type: "SUBMIT_POST_SUD", sud });
  }, []);

  const submitSurvey = useCallback((answers: SurveyAnswers) => {
    dispatch({ type: "SUBMIT_SURVEY", answers });
  }, []);

  const skipSurvey = useCallback(() => {
    dispatch({ type: "SKIP_SURVEY" });
  }, []);

  const reflectionDone = useCallback(() => {
    dispatch({ type: "REFLECTION_DONE" });
  }, []);

  const togglePause = useCallback(() => {
    dispatch({ type: "TOGGLE_PAUSE" });
  }, []);

  const tickElapsed = useCallback(() => {
    dispatch({ type: "TICK_ELAPSED" });
  }, []);

  const setSaving = useCallback((value: boolean) => {
    dispatch({ type: "SET_SAVING", value });
  }, []);

  return {
    state,
    submitPreSud,
    countdownDone,
    advancePoint,
    seekToPoint,
    breathingDone,
    microDone,
    submitMidSud,
    submitPostSud,
    submitSurvey,
    skipSurvey,
    reflectionDone,
    togglePause,
    tickElapsed,
    setSaving,
  };
}
