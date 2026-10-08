/**
 * User-friendly error message mapping.
 *
 * Maps server error codes and DB constraint messages to
 * human-readable text. No technical jargon.
 */

/** Known server error codes from Edge Functions */
const ERROR_CODE_MAP: Record<string, string> = {
  AUTH_REQUIRED: "Please sign in to continue.",
  AUTH_INVALID: "Your session has expired. Please sign in again.",
  VALIDATION_ERROR: "Something doesn't look right. Please try again.",
  NOT_FOUND: "We couldn't find what you're looking for.",
  CREDITS_REQUIRED: "CREDITS_REQUIRED",
  CREDITS_EXHAUSTED: "CREDITS_EXHAUSTED",
  REFLECTION_REQUIRED: "REFLECTION_REQUIRED",
  DB_ERROR: "We're having trouble saving your data. Please try again.",
  INTERNAL_ERROR: "Something went wrong on our end. Please try again in a moment.",
};

/** Patterns from DB constraint/trigger errors surfaced via PostgREST */
const CONSTRAINT_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /Invalid status transition/i,
    message: "This session can't be updated right now. Please go back and try again.",
  },
  {
    pattern: /Cannot change status from/i,
    message: "This session has already been completed.",
  },
  {
    pattern: /already has an active session/i,
    message: "You already have a session in progress for this journey. Please continue that one first.",
  },
  {
    pattern: /Cannot create reflection for session with status/i,
    message: "Please complete your session before sharing your reflection.",
  },
  {
    pattern: /Cannot change journey status from completed/i,
    message: "This journey has already been completed.",
  },
  {
    pattern: /sessions_duration_positive/i,
    message: "Something went wrong with the session timing. Please try again.",
  },
  {
    pattern: /journeys_total_sessions_min|journeys_completed_lte_total/i,
    message: "There was an issue with your journey progress. Please try again.",
  },
  {
    pattern: /pre_sud|post_sud/i,
    message: "Please enter a distress level between 0 and 10.",
  },
  {
    pattern: /unique_session_reflection/i,
    message: "You've already shared your reflection for this session.",
  },
  {
    pattern: /Repeat session must belong to the same journey/i,
    message: "This session can't be repeated here. Please try from the correct journey.",
  },
  {
    pattern: /session_type must be/i,
    message: "Invalid session type selected. Please try again.",
  },
  {
    pattern: /must be a valid UUID/i,
    message: "Something went wrong. Please go back and try again.",
  },
  {
    pattern: /Message exceeds.*character limit/i,
    message: "Your message is too long. Please shorten it and try again.",
  },
  {
    pattern: /Conversation history exceeds/i,
    message: "This conversation has gotten quite long. Please start a new one.",
  },
  {
    pattern: /Invalid message_type/i,
    message: "Something went wrong. Please try again.",
  },
  {
    pattern: /Invalid mood value/i,
    message: "Please select a valid mood.",
  },
  {
    pattern: /mood_intensity must be between/i,
    message: "Please select an intensity between 0 and 10.",
  },
  {
    pattern: /duration_seconds must be/i,
    message: "Something went wrong with the session timing. Please try again.",
  },
];

/**
 * Convert any server/DB error into a user-friendly message.
 *
 * @param error - The raw error from supabase.functions.invoke or DB query.
 *                Can be an Error object, a string, or a response body with `code` and `error`.
 * @param fallback - Optional fallback message if no pattern matches.
 */
export function getUserFriendlyError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) return fallback;

  // Extract error string from various shapes
  let errorStr = "";
  let errorCode = "";

  if (error instanceof Error) {
    errorStr = error.message;
  } else if (typeof error === "string") {
    errorStr = error;
  } else if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    errorCode = (obj.code as string) ?? "";
    errorStr = (obj.error as string) ?? (obj.message as string) ?? JSON.stringify(error);
  }

  // 1. Check known error codes first
  if (errorCode && ERROR_CODE_MAP[errorCode]) {
    return ERROR_CODE_MAP[errorCode];
  }

  // 2. Check constraint/trigger patterns
  for (const { pattern, message } of CONSTRAINT_PATTERNS) {
    if (pattern.test(errorStr)) {
      return message;
    }
  }

  // 3. Common network errors
  if (/network|fetch|timeout|abort/i.test(errorStr)) {
    return "Unable to connect. Please check your internet and try again.";
  }

  if (/rate limit|too many/i.test(errorStr)) {
    return "You're doing that too quickly. Please wait a moment and try again.";
  }

  // 4. Fallback — never show raw error to user
  return fallback;
}

/**
 * Convert Edge Function response data error to user-friendly message.
 * Use when supabase.functions.invoke returns data with an error code.
 */
export function getEdgeFunctionError(
  data: Record<string, unknown> | null,
  fallback = "Something went wrong. Please try again."
): string {
  if (!data) return fallback;
  const code = data.code as string | undefined;
  const errorMsg = data.error as string | undefined;

  if (code && ERROR_CODE_MAP[code]) {
    return ERROR_CODE_MAP[code];
  }

  if (errorMsg) {
    return getUserFriendlyError(errorMsg, fallback);
  }

  return fallback;
}
