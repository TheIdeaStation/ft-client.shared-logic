export type ShiftOption =
  | "felt_calmer"
  | "released_tension"
  | "new_perspective"
  | "felt_emotional"
  | "nothing_yet";

export type RepeatOption = "definitely" | "maybe" | "not_sure";

export interface SurveyAnswers {
  shifts: ShiftOption[];
  wouldRepeat: RepeatOption | null;
}

export const SHIFT_LABELS: Record<ShiftOption, string> = {
  felt_calmer: "Felt calmer",
  released_tension: "Released tension",
  new_perspective: "New perspective",
  felt_emotional: "Felt emotional",
  nothing_yet: "Nothing yet",
};

export const REPEAT_LABELS: Record<RepeatOption, string> = {
  definitely: "Definitely",
  maybe: "Maybe",
  not_sure: "Not sure",
};
