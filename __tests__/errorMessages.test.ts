import {
  getUserFriendlyError,
  getEdgeFunctionError,
} from "@/lib/errorMessages";

// ─── getUserFriendlyError ────────────────────────────────────────────

describe("getUserFriendlyError", () => {
  // ── Falsy inputs ──────────────────────────────────────────────────

  it("returns default fallback for null", () => {
    expect(getUserFriendlyError(null)).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns default fallback for undefined", () => {
    expect(getUserFriendlyError(undefined)).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns default fallback for empty string", () => {
    expect(getUserFriendlyError("")).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns default fallback for 0", () => {
    expect(getUserFriendlyError(0)).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns custom fallback for null", () => {
    expect(getUserFriendlyError(null, "Custom fallback")).toBe(
      "Custom fallback"
    );
  });

  it("returns custom fallback for undefined", () => {
    expect(getUserFriendlyError(undefined, "Oops")).toBe("Oops");
  });

  // ── Error codes (object with code + error) ───────────────────────

  describe("ERROR_CODE_MAP — known server codes", () => {
    const codeCases: Array<[string, string]> = [
      ["AUTH_REQUIRED", "Please sign in to continue."],
      ["AUTH_INVALID", "Your session has expired. Please sign in again."],
      [
        "VALIDATION_ERROR",
        "Something doesn't look right. Please try again.",
      ],
      ["NOT_FOUND", "We couldn't find what you're looking for."],
      ["CREDITS_REQUIRED", "CREDITS_REQUIRED"],
      ["CREDITS_EXHAUSTED", "CREDITS_EXHAUSTED"],
      ["REFLECTION_REQUIRED", "REFLECTION_REQUIRED"],
      [
        "DB_ERROR",
        "We're having trouble saving your data. Please try again.",
      ],
      [
        "INTERNAL_ERROR",
        "Something went wrong on our end. Please try again in a moment.",
      ],
    ];

    it.each(codeCases)(
      "maps code %s to friendly message",
      (code, expected) => {
        expect(getUserFriendlyError({ code, error: "raw msg" })).toBe(
          expected
        );
      }
    );

    it("falls through for unknown code", () => {
      expect(
        getUserFriendlyError({ code: "UNKNOWN_CODE", error: "irrelevant" })
      ).toBe("Something went wrong. Please try again.");
    });
  });

  // ── Constraint patterns (string input) ────────────────────────────

  describe("CONSTRAINT_PATTERNS — DB constraint messages", () => {
    const constraintCases: Array<[string, string]> = [
      [
        "Invalid status transition from X to Y",
        "This session can't be updated right now. Please go back and try again.",
      ],
      [
        "Cannot change status from completed to active",
        "This session has already been completed.",
      ],
      [
        "User already has an active session for this journey",
        "You already have a session in progress for this journey. Please continue that one first.",
      ],
      [
        "Cannot create reflection for session with status active",
        "Please complete your session before sharing your reflection.",
      ],
      [
        "Cannot change journey status from completed to active",
        "This journey has already been completed.",
      ],
      [
        "sessions_duration_positive check failed",
        "Something went wrong with the session timing. Please try again.",
      ],
      [
        "violates journeys_total_sessions_min",
        "There was an issue with your journey progress. Please try again.",
      ],
      [
        "violates journeys_completed_lte_total constraint",
        "There was an issue with your journey progress. Please try again.",
      ],
      [
        "pre_sud must be between 0 and 10",
        "Please enter a distress level between 0 and 10.",
      ],
      [
        "post_sud constraint violation",
        "Please enter a distress level between 0 and 10.",
      ],
      [
        "unique_session_reflection already exists",
        "You've already shared your reflection for this session.",
      ],
      [
        "Repeat session must belong to the same journey as original",
        "This session can't be repeated here. Please try from the correct journey.",
      ],
      [
        "session_type must be one of initial, repeat, visualization",
        "Invalid session type selected. Please try again.",
      ],
      [
        "field must be a valid UUID",
        "Something went wrong. Please go back and try again.",
      ],
      [
        "Message exceeds 5000 character limit",
        "Your message is too long. Please shorten it and try again.",
      ],
      [
        "Conversation history exceeds maximum allowed length",
        "This conversation has gotten quite long. Please start a new one.",
      ],
      [
        "Invalid message_type provided",
        "Something went wrong. Please try again.",
      ],
      [
        "Invalid mood value supplied",
        "Please select a valid mood.",
      ],
      [
        "mood_intensity must be between 0 and 10",
        "Please select an intensity between 0 and 10.",
      ],
      [
        "duration_seconds must be positive",
        "Something went wrong with the session timing. Please try again.",
      ],
    ];

    it.each(constraintCases)(
      "matches constraint: %s",
      (input, expected) => {
        expect(getUserFriendlyError(input)).toBe(expected);
      }
    );

    it("constraint patterns are case-insensitive", () => {
      expect(getUserFriendlyError("INVALID STATUS TRANSITION")).toBe(
        "This session can't be updated right now. Please go back and try again."
      );
      expect(getUserFriendlyError("invalid mood value")).toBe(
        "Please select a valid mood."
      );
    });
  });

  // ── Network errors ────────────────────────────────────────────────

  describe("network errors", () => {
    const networkCases = [
      "Network request failed",
      "fetch failed",
      "Request timeout",
      "AbortError: abort",
      "NETWORK_ERROR",
    ];

    it.each(networkCases)("detects network error: %s", (msg) => {
      expect(getUserFriendlyError(msg)).toBe(
        "Unable to connect. Please check your internet and try again."
      );
    });

    it("detects network error from Error object", () => {
      expect(getUserFriendlyError(new Error("Network request failed"))).toBe(
        "Unable to connect. Please check your internet and try again."
      );
    });
  });

  // ── Rate limit errors ─────────────────────────────────────────────

  describe("rate limit errors", () => {
    const rateCases = [
      "rate limit exceeded",
      "Rate Limit hit",
      "Too many requests",
      "too many attempts",
    ];

    it.each(rateCases)("detects rate limit: %s", (msg) => {
      expect(getUserFriendlyError(msg)).toBe(
        "You're doing that too quickly. Please wait a moment and try again."
      );
    });
  });

  // ── Input shapes ──────────────────────────────────────────────────

  describe("input shape handling", () => {
    it("handles plain string", () => {
      expect(getUserFriendlyError("Invalid mood value")).toBe(
        "Please select a valid mood."
      );
    });

    it("handles Error object", () => {
      expect(
        getUserFriendlyError(new Error("Cannot change status from x to y"))
      ).toBe("This session has already been completed.");
    });

    it("handles object with code and error", () => {
      expect(
        getUserFriendlyError({ code: "AUTH_REQUIRED", error: "not authed" })
      ).toBe("Please sign in to continue.");
    });

    it("handles object with message (no error key)", () => {
      expect(
        getUserFriendlyError({ message: "Invalid mood value" })
      ).toBe("Please select a valid mood.");
    });

    it("handles object with error string (no code)", () => {
      expect(getUserFriendlyError({ error: "Network failure" })).toBe(
        "Unable to connect. Please check your internet and try again."
      );
    });

    it("handles object with neither code, error, nor message — JSON stringifies", () => {
      // { foo: "bar" } has no error/message/code, so errorStr = JSON.stringify
      expect(getUserFriendlyError({ foo: "bar" })).toBe(
        "Something went wrong. Please try again."
      );
    });

    it("handles object with code but no matching map entry", () => {
      expect(
        getUserFriendlyError({ code: "BOGUS", error: "some random error" })
      ).toBe("Something went wrong. Please try again.");
    });

    it("uses error field over message field when both present", () => {
      // error takes priority over message in the extraction
      expect(
        getUserFriendlyError({
          error: "Invalid mood value",
          message: "timeout",
        })
      ).toBe("Please select a valid mood.");
    });

    it("falls back to message when error is absent", () => {
      expect(
        getUserFriendlyError({ message: "rate limit exceeded" })
      ).toBe(
        "You're doing that too quickly. Please wait a moment and try again."
      );
    });
  });

  // ── Fallback behavior ─────────────────────────────────────────────

  describe("fallback", () => {
    it("returns default fallback for unrecognized string", () => {
      expect(getUserFriendlyError("some random error")).toBe(
        "Something went wrong. Please try again."
      );
    });

    it("returns custom fallback for unrecognized string", () => {
      expect(
        getUserFriendlyError("some random error", "Custom message")
      ).toBe("Custom message");
    });

    it("returns custom fallback for unrecognized object", () => {
      expect(
        getUserFriendlyError(
          { code: "NOPE", error: "nope" },
          "Try later"
        )
      ).toBe("Try later");
    });
  });
});

// ─── getEdgeFunctionError ────────────────────────────────────────────

describe("getEdgeFunctionError", () => {
  it("returns default fallback for null data", () => {
    expect(getEdgeFunctionError(null)).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns custom fallback for null data", () => {
    expect(getEdgeFunctionError(null, "Edge fail")).toBe("Edge fail");
  });

  it("maps known code from data", () => {
    expect(
      getEdgeFunctionError({ code: "AUTH_REQUIRED", error: "raw" })
    ).toBe("Please sign in to continue.");
  });

  it("maps all known codes", () => {
    expect(getEdgeFunctionError({ code: "DB_ERROR" })).toBe(
      "We're having trouble saving your data. Please try again."
    );
  });

  it("falls through unknown code to error string matching", () => {
    expect(
      getEdgeFunctionError({
        code: "UNKNOWN",
        error: "Invalid mood value",
      })
    ).toBe("Please select a valid mood.");
  });

  it("uses error string when no code present", () => {
    expect(
      getEdgeFunctionError({ error: "Network request failed" })
    ).toBe(
      "Unable to connect. Please check your internet and try again."
    );
  });

  it("returns fallback when data has no code and no error", () => {
    expect(getEdgeFunctionError({ foo: "bar" })).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns custom fallback when data has no code and no error", () => {
    expect(getEdgeFunctionError({ foo: "bar" }, "Nope")).toBe("Nope");
  });

  it("passes custom fallback through to getUserFriendlyError", () => {
    expect(
      getEdgeFunctionError(
        { code: "BOGUS", error: "unrecognized stuff" },
        "Custom edge fallback"
      )
    ).toBe("Custom edge fallback");
  });

  it("handles data with code=undefined gracefully", () => {
    expect(
      getEdgeFunctionError({ code: undefined, error: undefined })
    ).toBe("Something went wrong. Please try again.");
  });
});
