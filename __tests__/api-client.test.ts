/**
 * API Client Tests
 * ================
 * Tests the ACTUAL api-client.ts code by INJECTING a fake Supabase client,
 * which is how both apps use it. No module mocking needed — that is the point
 * of the factory: the client has no platform dependency to mock.
 *
 * Covers every method, every branch: success, invoke error, empty response,
 * response with error code, and method-specific edge cases.
 *
 * Coverage target: 95%+ statement coverage of lib/api-client.ts
 */

import { createApiClient, ApiClientError } from "../lib/api-client";
import type { SupabaseLike } from "../lib/api-client";
import type {
  AiConversationRequest,
  GenerateTappingScriptRequest,
  GenerateExploreAudioRequest,
  GenerateVoiceRequest,
  SendPushRequest,
} from "../lib/api-client";

// ── Injected fake client ───────────────────────────────────────────────────

const mockInvoke = jest.fn();
const mockRpc = jest.fn();

const fakeSupabase: SupabaseLike = {
  functions: {
    invoke: (...args: Parameters<SupabaseLike["functions"]["invoke"]>) =>
      mockInvoke(...args),
  },
  rpc: (...args: Parameters<SupabaseLike["rpc"]>) => mockRpc(...args),
};

const api = createApiClient(fakeSupabase);

// ── Helpers ────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

const baseConversationParams: AiConversationRequest = {
  message: "Hello Aria",
  conversation_history: [],
};

// ── ApiClientError class ───────────────────────────────────────────────────

describe("ApiClientError", () => {
  test("constructs with message, code, and correct name", () => {
    const err = new ApiClientError("Something failed", "TEST_CODE");
    expect(err.message).toBe("Something failed");
    expect(err.code).toBe("TEST_CODE");
    expect(err.name).toBe("ApiClientError");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiClientError);
  });

  test("works with empty strings", () => {
    const err = new ApiClientError("", "");
    expect(err.message).toBe("");
    expect(err.code).toBe("");
    expect(err.name).toBe("ApiClientError");
  });
});

// ── aiConversationIntake ───────────────────────────────────────────────────

describe("api.aiConversationIntake", () => {
  test("success path returns response", async () => {
    const responseData = {
      message: "Hi there",
      crisis_detected: false,
      phase: "intro",
      extracted_data: null,
      message_id: "msg-001",
    };
    mockInvoke.mockResolvedValue({ data: responseData, error: null });

    const result = await api.aiConversationIntake(baseConversationParams);

    expect(mockInvoke).toHaveBeenCalledWith("ai-conversation", {
      body: { ...baseConversationParams, message_type: "intake" },
    });
    expect(result).toEqual(responseData);
  });

  test("uses provided message_type instead of default", async () => {
    const responseData = {
      message: "Hi",
      crisis_detected: false,
      phase: "intro",
      extracted_data: null,
      message_id: "msg-002",
    };
    mockInvoke.mockResolvedValue({ data: responseData, error: null });

    await api.aiConversationIntake({
      ...baseConversationParams,
      message_type: "chat",
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai-conversation", {
      body: expect.objectContaining({ message_type: "chat" }),
    });
  });

  test("invoke error throws ApiClientError with INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Function crashed" },
    });

    await expect(api.aiConversationIntake(baseConversationParams)).rejects.toThrow(
      ApiClientError,
    );
    await expect(api.aiConversationIntake(baseConversationParams)).rejects.toMatchObject({
      message: "Function crashed",
      code: "INVOKE_ERROR",
    });
  });

  test("empty response throws EMPTY_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.aiConversationIntake(baseConversationParams)).rejects.toMatchObject({
      message: "No response received",
      code: "EMPTY_RESPONSE",
    });
  });

  test("response with error field throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Rate limit exceeded", code: "RATE_LIMITED" },
      error: null,
    });

    await expect(api.aiConversationIntake(baseConversationParams)).rejects.toMatchObject({
      message: "Rate limit exceeded",
      code: "RATE_LIMITED",
    });
  });
});

// ── aiConversationReflection ───────────────────────────────────────────────

describe("api.aiConversationReflection", () => {
  test("success path returns response with reflection fields", async () => {
    const responseData = {
      message: "Let's reflect",
      crisis_detected: false,
      phase: "intro",
      reflection_phase: "reflection_start",
      reflection_data: null,
      message_id: "msg-003",
    };
    mockInvoke.mockResolvedValue({ data: responseData, error: null });

    const result = await api.aiConversationReflection({
      ...baseConversationParams,
      session_id: "s-001",
      journey_id: "j-001",
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai-conversation", {
      body: expect.objectContaining({ message_type: "reflection" }),
    });
    expect(result).toEqual(responseData);
  });

  test("always sets message_type to reflection regardless of input", async () => {
    const responseData = {
      message: "Reflect",
      crisis_detected: false,
      phase: "intro",
      reflection_phase: "reflection_start",
      reflection_data: null,
      message_id: "msg-004",
    };
    mockInvoke.mockResolvedValue({ data: responseData, error: null });

    await api.aiConversationReflection({
      ...baseConversationParams,
      message_type: "chat",
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai-conversation", {
      body: expect.objectContaining({ message_type: "reflection" }),
    });
  });

  test("invoke error throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Timeout" },
    });

    await expect(api.aiConversationReflection(baseConversationParams)).rejects.toMatchObject({
      message: "Timeout",
      code: "INVOKE_ERROR",
    });
  });

  test("empty response throws EMPTY_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.aiConversationReflection(baseConversationParams)).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });

  test("response with error throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Session not found", code: "SESSION_NOT_FOUND" },
      error: null,
    });

    await expect(api.aiConversationReflection(baseConversationParams)).rejects.toMatchObject({
      message: "Session not found",
      code: "SESSION_NOT_FOUND",
    });
  });
});

// ── aiConversationCheckin ──────────────────────────────────────────────────

describe("api.aiConversationCheckin", () => {
  test("success path returns response with checkin fields", async () => {
    const responseData = {
      message: "How are you?",
      crisis_detected: false,
      phase: "intro",
      checkin_phase: "checkin_start",
      checkin_data: null,
      message_id: "msg-005",
    };
    mockInvoke.mockResolvedValue({ data: responseData, error: null });

    const result = await api.aiConversationCheckin({
      ...baseConversationParams,
      journey_id: "j-001",
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai-conversation", {
      body: expect.objectContaining({ message_type: "checkin" }),
    });
    expect(result).toEqual(responseData);
  });

  test("always sets message_type to checkin", async () => {
    const responseData = {
      message: "Check",
      crisis_detected: false,
      phase: "intro",
      checkin_phase: "checkin_start",
      checkin_data: null,
      message_id: "msg-006",
    };
    mockInvoke.mockResolvedValue({ data: responseData, error: null });

    await api.aiConversationCheckin({
      ...baseConversationParams,
      message_type: "intake",
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai-conversation", {
      body: expect.objectContaining({ message_type: "checkin" }),
    });
  });

  test("invoke error throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Network error" },
    });

    await expect(api.aiConversationCheckin(baseConversationParams)).rejects.toMatchObject({
      message: "Network error",
      code: "INVOKE_ERROR",
    });
  });

  test("empty response throws EMPTY_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.aiConversationCheckin(baseConversationParams)).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });

  test("response with error throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Journey inactive", code: "JOURNEY_INACTIVE" },
      error: null,
    });

    await expect(api.aiConversationCheckin(baseConversationParams)).rejects.toMatchObject({
      message: "Journey inactive",
      code: "JOURNEY_INACTIVE",
    });
  });
});

// ── aiConversationChainAnalysis ────────────────────────────────────────────

describe("api.aiConversationChainAnalysis", () => {
  const chainAnalysisData = {
    chain_analysis: {
      issues: [{ id: "i-1", title: "Anxiety", intensity: 8, priority: 1, rationale: "Root" }],
      relationships: [],
      recommendedOrder: ["i-1"],
      chainExplanation: "Single issue",
      suggestedJourneyTitle: "Healing Anxiety",
      suggestedJourneyGoal: "Reduce anxiety",
    },
  };

  test("success path returns chain analysis", async () => {
    mockInvoke.mockResolvedValue({ data: chainAnalysisData, error: null });

    const result = await api.aiConversationChainAnalysis({
      ...baseConversationParams,
      assessed_issues: [],
    });

    expect(mockInvoke).toHaveBeenCalledWith("ai-conversation", {
      body: expect.objectContaining({ message_type: "chain_analysis" }),
    });
    expect(result).toEqual(chainAnalysisData);
  });

  test("invoke error throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Server error" },
    });

    await expect(api.aiConversationChainAnalysis(baseConversationParams)).rejects.toMatchObject({
      message: "Server error",
      code: "INVOKE_ERROR",
    });
  });

  test("empty response throws EMPTY_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.aiConversationChainAnalysis(baseConversationParams)).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });

  test("response with error field throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Analysis failed", code: "ANALYSIS_ERROR" },
      error: null,
    });

    await expect(api.aiConversationChainAnalysis(baseConversationParams)).rejects.toMatchObject({
      message: "Analysis failed",
      code: "ANALYSIS_ERROR",
    });
  });

  test("response without error field passes through", async () => {
    mockInvoke.mockResolvedValue({ data: chainAnalysisData, error: null });

    const result = await api.aiConversationChainAnalysis(baseConversationParams);
    expect(result.chain_analysis).toBeDefined();
  });
});

// ── generateTappingScript ──────────────────────────────────────────────────

describe("api.generateTappingScript", () => {
  const scriptParams: GenerateTappingScriptRequest = {
    journey_id: "j-001",
  };

  const validResponse = {
    session_id: "s-001",
    script: {
      sessionId: "s-001",
      title: "Tapping Session",
      estimatedDurationMinutes: 10,
      rounds: [],
    },
    audio_url: null,
    audio_metadata: null,
  };

  test("success path returns script response", async () => {
    mockInvoke.mockResolvedValue({ data: validResponse, error: null });

    const result = await api.generateTappingScript(scriptParams);

    expect(mockInvoke).toHaveBeenCalledWith("generate-tapping-script", {
      body: scriptParams,
    });
    expect(result).toEqual(validResponse);
  });

  test("invoke error with structured code in data throws that code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Reflection required", code: "REFLECTION_REQUIRED" },
      error: { message: "Edge function returned error" },
    });

    await expect(api.generateTappingScript(scriptParams)).rejects.toMatchObject({
      message: "Reflection required",
      code: "REFLECTION_REQUIRED",
    });
  });

  test("invoke error without structured code throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Function crashed" },
    });

    await expect(api.generateTappingScript(scriptParams)).rejects.toMatchObject({
      message: "Function crashed",
      code: "INVOKE_ERROR",
    });
  });

  test("invoke error with data but no code throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Some error" },
      error: { message: "Function error" },
    });

    await expect(api.generateTappingScript(scriptParams)).rejects.toMatchObject({
      message: "Function error",
      code: "INVOKE_ERROR",
    });
  });

  test("empty response throws EMPTY_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.generateTappingScript(scriptParams)).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });

  test("response with error field throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Journey not found", code: "NOT_FOUND" },
      error: null,
    });

    await expect(api.generateTappingScript(scriptParams)).rejects.toMatchObject({
      message: "Journey not found",
      code: "NOT_FOUND",
    });
  });

  test("response missing session_id throws INVALID_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({
      data: { script: { rounds: [] } },
      error: null,
    });

    await expect(api.generateTappingScript(scriptParams)).rejects.toMatchObject({
      message: "Invalid response: missing session_id or script",
      code: "INVALID_RESPONSE",
    });
  });

  test("response missing script throws INVALID_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({
      data: { session_id: "s-001" },
      error: null,
    });

    await expect(api.generateTappingScript(scriptParams)).rejects.toMatchObject({
      message: "Invalid response: missing session_id or script",
      code: "INVALID_RESPONSE",
    });
  });

  test("passes optional params through", async () => {
    mockInvoke.mockResolvedValue({ data: validResponse, error: null });

    const fullParams: GenerateTappingScriptRequest = {
      journey_id: "j-001",
      issue_id: "i-001",
      session_type: "gentle",
      user_override_advance: true,
      repeat_session_id: "s-prev",
    };

    await api.generateTappingScript(fullParams);

    expect(mockInvoke).toHaveBeenCalledWith("generate-tapping-script", {
      body: fullParams,
    });
  });
});

// ── generateExploreAudio ───────────────────────────────────────────────────

describe("api.generateExploreAudio", () => {
  const exploreParams: GenerateExploreAudioRequest = {
    sessions: [
      {
        id: "explore-001",
        script: {
          sessionId: "explore-001",
          title: "Calm Session",
          estimatedDurationMinutes: 8,
          rounds: [],
        },
      },
    ],
  };

  const validResponse = {
    succeeded: 1,
    failed: 0,
    results: [{ id: "explore-001", success: true }],
  };

  test("success path returns explore audio response", async () => {
    mockInvoke.mockResolvedValue({ data: validResponse, error: null });

    const result = await api.generateExploreAudio(exploreParams);

    expect(mockInvoke).toHaveBeenCalledWith("generate-explore-audio", {
      body: exploreParams,
    });
    expect(result).toEqual(validResponse);
  });

  test("invoke error throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Auth failed" },
    });

    await expect(api.generateExploreAudio(exploreParams)).rejects.toMatchObject({
      message: "Auth failed",
      code: "INVOKE_ERROR",
    });
  });

  test("empty response throws EMPTY_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.generateExploreAudio(exploreParams)).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });

  test("response with error field throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Service unavailable", code: "UNAVAILABLE" },
      error: null,
    });

    await expect(api.generateExploreAudio(exploreParams)).rejects.toMatchObject({
      message: "Service unavailable",
      code: "UNAVAILABLE",
    });
  });
});

// ── generateVoice ──────────────────────────────────────────────────────────

describe("api.generateVoice", () => {
  const voiceParams: GenerateVoiceRequest = {
    text: "Even though I feel anxious",
    voice: "alloy",
  };

  test("invoke error throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Not implemented" },
    });

    await expect(api.generateVoice(voiceParams)).rejects.toMatchObject({
      message: "Not implemented",
      code: "INVOKE_ERROR",
    });
  });

  test("response with error field throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Voice gen failed", code: "VOICE_ERROR" },
      error: null,
    });

    await expect(api.generateVoice(voiceParams)).rejects.toMatchObject({
      message: "Voice gen failed",
      code: "VOICE_ERROR",
    });
  });

  test("successful response (no error) still throws UNEXPECTED_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({
      data: { some: "data" },
      error: null,
    });

    await expect(api.generateVoice(voiceParams)).rejects.toMatchObject({
      message: "Unexpected response from generate-voice",
      code: "UNEXPECTED_RESPONSE",
    });
  });

  test("null response with no error throws UNEXPECTED_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.generateVoice(voiceParams)).rejects.toMatchObject({
      message: "Unexpected response from generate-voice",
      code: "UNEXPECTED_RESPONSE",
    });
  });

  test("calls correct function name", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "err" },
    });

    await expect(api.generateVoice(voiceParams)).rejects.toThrow();

    expect(mockInvoke).toHaveBeenCalledWith("generate-voice", {
      body: voiceParams,
    });
  });
});

// ── sendPush ───────────────────────────────────────────────────────────────

describe("api.sendPush", () => {
  const pushParams: SendPushRequest = {
    user_id: "user-001",
    title: "Reminder",
    body: "Time to tap!",
    data: { route: "/session" },
  };

  test("invoke error throws INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Push failed" },
    });

    await expect(api.sendPush(pushParams)).rejects.toMatchObject({
      message: "Push failed",
      code: "INVOKE_ERROR",
    });
  });

  test("response with error field throws with response code", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: "Invalid token", code: "INVALID_PUSH_TOKEN" },
      error: null,
    });

    await expect(api.sendPush(pushParams)).rejects.toMatchObject({
      message: "Invalid token",
      code: "INVALID_PUSH_TOKEN",
    });
  });

  test("successful response (no error) still throws UNEXPECTED_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({
      data: { delivered: true },
      error: null,
    });

    await expect(api.sendPush(pushParams)).rejects.toMatchObject({
      message: "Unexpected response from send-push",
      code: "UNEXPECTED_RESPONSE",
    });
  });

  test("null response with no error throws UNEXPECTED_RESPONSE", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(api.sendPush(pushParams)).rejects.toMatchObject({
      code: "UNEXPECTED_RESPONSE",
    });
  });

  test("calls correct function name with body", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "err" },
    });

    await expect(api.sendPush(pushParams)).rejects.toThrow();

    expect(mockInvoke).toHaveBeenCalledWith("send-push", {
      body: pushParams,
    });
  });
});

// ── completeJourney (RPC) ──────────────────────────────────────────────────

describe("api.completeJourney", () => {
  test("success path returns completion data", async () => {
    const rpcResult = { completed: true, viz_completed: 2, viz_required: 2 };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.completeJourney("j-001", "user-001");

    expect(mockRpc).toHaveBeenCalledWith("complete_journey", {
      p_journey_id: "j-001",
      p_user_id: "user-001",
    });
    expect(result).toEqual(rpcResult);
  });

  test("RPC error throws RPC_ERROR", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Function not found" },
    });

    await expect(api.completeJourney("j-001", "user-001")).rejects.toMatchObject({
      message: "Function not found",
      code: "RPC_ERROR",
    });
  });

  test("null data returns default { completed: false }", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await api.completeJourney("j-001", "user-001");

    expect(result).toEqual({ completed: false });
  });

  test("response with error field throws with response code", async () => {
    mockRpc.mockResolvedValue({
      data: {
        completed: false,
        error: "Need more viz sessions",
        code: "VIZ_SESSIONS_REQUIRED",
      },
      error: null,
    });

    await expect(api.completeJourney("j-001", "user-001")).rejects.toMatchObject({
      message: "Need more viz sessions",
      code: "VIZ_SESSIONS_REQUIRED",
    });
  });

  test("response with error but no code uses UNKNOWN", async () => {
    mockRpc.mockResolvedValue({
      data: {
        completed: false,
        error: "Something went wrong",
      },
      error: null,
    });

    await expect(api.completeJourney("j-001", "user-001")).rejects.toMatchObject({
      message: "Something went wrong",
      code: "UNKNOWN",
    });
  });

  test("already_completed response passes through", async () => {
    const rpcResult = { completed: true, already_completed: true };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.completeJourney("j-001", "user-001");

    expect(result.already_completed).toBe(true);
  });
});

// ── checkReflectionRequired (RPC) ──────────────────────────────────────────

describe("api.checkReflectionRequired", () => {
  test("success path returns reflection check data", async () => {
    const rpcResult = { reflection_required: true, session_id: "s-003" };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.checkReflectionRequired("j-001", "user-001");

    expect(mockRpc).toHaveBeenCalledWith("check_reflection_required", {
      p_journey_id: "j-001",
      p_user_id: "user-001",
    });
    expect(result).toEqual(rpcResult);
  });

  test("RPC error throws RPC_ERROR", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Permission denied" },
    });

    await expect(api.checkReflectionRequired("j-001", "user-001")).rejects.toMatchObject({
      message: "Permission denied",
      code: "RPC_ERROR",
    });
  });

  test("null data returns default { reflection_required: false }", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await api.checkReflectionRequired("j-001", "user-001");

    expect(result).toEqual({ reflection_required: false });
  });

  test("reflection not required returns false", async () => {
    const rpcResult = { reflection_required: false };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.checkReflectionRequired("j-001", "user-001");

    expect(result.reflection_required).toBe(false);
    expect(result.session_id).toBeUndefined();
  });
});

// ── submitQuickReflection (RPC) ──────────────────────────────────────────

describe("api.submitQuickReflection", () => {
  const quickReflectionParams = {
    sessionId: "s-003",
    journeyId: "j-001",
    userId: "user-001",
    rating: "much_better" as const,
  };

  test("success path returns reflection data with recommendation", async () => {
    const rpcResult = {
      success: true,
      recommendation: "advance",
      reflection_id: "ref-001",
    };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.submitQuickReflection(quickReflectionParams);

    expect(mockRpc).toHaveBeenCalledWith("submit_quick_reflection", {
      p_session_id: "s-003",
      p_journey_id: "j-001",
      p_user_id: "user-001",
      p_rating: "much_better",
      p_note: null,
    });
    expect(result).toEqual(rpcResult);
  });

  test("passes optional note to RPC", async () => {
    const rpcResult = {
      success: true,
      recommendation: "advance",
      reflection_id: "ref-001",
    };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    await api.submitQuickReflection({
      ...quickReflectionParams,
      note: "Shoulders feel lighter",
    });

    expect(mockRpc).toHaveBeenCalledWith("submit_quick_reflection", {
      p_session_id: "s-003",
      p_journey_id: "j-001",
      p_user_id: "user-001",
      p_rating: "much_better",
      p_note: "Shoulders feel lighter",
    });
  });

  test("RPC error throws RPC_ERROR", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Function not found" },
    });

    await expect(api.submitQuickReflection(quickReflectionParams)).rejects.toMatchObject({
      message: "Function not found",
      code: "RPC_ERROR",
    });
  });

  test("null data returns default { success: false }", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await api.submitQuickReflection(quickReflectionParams);
    expect(result).toEqual({ success: false });
  });

  test("response with error field throws with response code", async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        error: "Invalid rating",
        code: "VALIDATION_ERROR",
      },
      error: null,
    });

    await expect(api.submitQuickReflection(quickReflectionParams)).rejects.toMatchObject({
      message: "Invalid rating",
      code: "VALIDATION_ERROR",
    });
  });

  test("about_the_same rating returns repeat recommendation", async () => {
    const rpcResult = {
      success: true,
      recommendation: "repeat",
      reflection_id: "ref-002",
    };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.submitQuickReflection({
      ...quickReflectionParams,
      rating: "about_the_same",
    });

    expect(result.recommendation).toBe("repeat");
  });
});

// ── setSessionTarget (RPC) ────────────────────────────────────────────────

describe("api.setSessionTarget", () => {
  test("success path returns target data", async () => {
    const rpcResult = { success: true, total_sessions: 6 };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.setSessionTarget("j-001", "user-001");

    expect(mockRpc).toHaveBeenCalledWith("set_journey_session_target", {
      p_journey_id: "j-001",
      p_user_id: "user-001",
    });
    expect(result).toEqual(rpcResult);
  });

  test("RPC error throws RPC_ERROR", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Journey not found" },
    });

    await expect(api.setSessionTarget("j-001", "user-001")).rejects.toMatchObject({
      message: "Journey not found",
      code: "RPC_ERROR",
    });
  });

  test("null data returns default { success: false }", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await api.setSessionTarget("j-001", "user-001");
    expect(result).toEqual({ success: false });
  });

  test("response with error field throws with response code", async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: "No issues found", code: "NO_ISSUES" },
      error: null,
    });

    await expect(api.setSessionTarget("j-001", "user-001")).rejects.toMatchObject({
      message: "No issues found",
      code: "NO_ISSUES",
    });
  });
});

// ── extendJourney (RPC) ──────────────────────────────────────────────────

describe("api.extendJourney", () => {
  test("success path returns extended target", async () => {
    const rpcResult = { success: true, new_total: 8 };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    const result = await api.extendJourney("j-001", "user-001", 2);

    expect(mockRpc).toHaveBeenCalledWith("extend_journey", {
      p_journey_id: "j-001",
      p_user_id: "user-001",
      p_additional_sessions: 2,
    });
    expect(result).toEqual(rpcResult);
  });

  test("defaults to 2 additional sessions", async () => {
    const rpcResult = { success: true, new_total: 8 };
    mockRpc.mockResolvedValue({ data: rpcResult, error: null });

    await api.extendJourney("j-001", "user-001");

    expect(mockRpc).toHaveBeenCalledWith("extend_journey", {
      p_journey_id: "j-001",
      p_user_id: "user-001",
      p_additional_sessions: 2,
    });
  });

  test("RPC error throws RPC_ERROR", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Permission denied" },
    });

    await expect(api.extendJourney("j-001", "user-001")).rejects.toMatchObject({
      message: "Permission denied",
      code: "RPC_ERROR",
    });
  });

  test("null data returns default { success: false }", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await api.extendJourney("j-001", "user-001");
    expect(result).toEqual({ success: false });
  });

  test("response with error field throws with response code", async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: "Max sessions reached", code: "MAX_REACHED" },
      error: null,
    });

    await expect(api.extendJourney("j-001", "user-001")).rejects.toMatchObject({
      message: "Max sessions reached",
      code: "MAX_REACHED",
    });
  });
});

// ── Edge cases & cross-cutting concerns ────────────────────────────────────

describe("cross-cutting edge cases", () => {
  test("conversation methods spread params correctly", async () => {
    const responseData = {
      message: "Hi",
      crisis_detected: false,
      phase: "intro",
      extracted_data: null,
      message_id: "msg-x",
    };
    mockInvoke.mockResolvedValue({ data: responseData, error: null });

    const fullParams: AiConversationRequest = {
      message: "Test",
      conversation_history: [{ role: "user", content: "Previous" }],
      session_id: "s-001",
      journey_id: "j-001",
      issue_id: "i-001",
      survey_answers: { shifts: ["calmer"], would_repeat: "yes" },
      duration_seconds: 300,
      mood: "good",
      mood_intensity: 7,
    };

    await api.aiConversationIntake(fullParams);

    const calledBody = mockInvoke.mock.calls[0][1].body;
    expect(calledBody.session_id).toBe("s-001");
    expect(calledBody.journey_id).toBe("j-001");
    expect(calledBody.issue_id).toBe("i-001");
    expect(calledBody.survey_answers).toEqual({ shifts: ["calmer"], would_repeat: "yes" });
    expect(calledBody.duration_seconds).toBe(300);
    expect(calledBody.mood).toBe("good");
    expect(calledBody.mood_intensity).toBe(7);
    expect(calledBody.conversation_history).toHaveLength(1);
  });

  test("generateTappingScript: error truthy + data with code uses data code", async () => {
    // This tests the special branch: error is truthy, but data has a structured code
    mockInvoke.mockResolvedValue({
      data: { error: "Reflection gate active", code: "REFLECTION_REQUIRED" },
      error: { message: "non-2xx status code" },
    });

    await expect(api.generateTappingScript({ journey_id: "j-001" })).rejects.toMatchObject({
      message: "Reflection gate active",
      code: "REFLECTION_REQUIRED",
    });
  });

  test("generateTappingScript: error truthy + data without code falls to INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: { some: "unstructured" },
      error: { message: "Edge function 500" },
    });

    await expect(api.generateTappingScript({ journey_id: "j-001" })).rejects.toMatchObject({
      message: "Edge function 500",
      code: "INVOKE_ERROR",
    });
  });

  test("generateTappingScript: error truthy + null data falls to INVOKE_ERROR", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: "Network timeout" },
    });

    await expect(api.generateTappingScript({ journey_id: "j-001" })).rejects.toMatchObject({
      message: "Network timeout",
      code: "INVOKE_ERROR",
    });
  });

  test("api is a singleton instance", async () => {
    // Verify the exported api is consistent
    const { api: api1 } = require("../lib/api-client");
    const { api: api2 } = require("../lib/api-client");
    expect(api1).toBe(api2);
  });
});

// ── getWeeklyRecap (RPC) ──────────────────────────────────────────────────

describe("api.getWeeklyRecap", () => {
  const validRecap = {
    week_start: "2026-03-18",
    week_end: "2026-03-25",
    sessions_completed: 5,
    total_minutes: 42,
    avg_intensity_reduction: 2.8,
    best_session_reduction: 5,
    current_streak: 7,
    top_themes: ["anxiety", "work stress"],
    emotional_shifts: ["From anxious to calm"],
    badges_earned: [{ name: "Five Day Streak", icon: "flame-outline" }],
    journeys_completed: 0,
    has_data: true,
  };

  test("success path returns recap data", async () => {
    mockRpc.mockResolvedValue({ data: validRecap, error: null });

    const result = await api.getWeeklyRecap("user-001");

    expect(mockRpc).toHaveBeenCalledWith("get_weekly_recap", {
      p_user_id: "user-001",
    });
    expect(result).toEqual(validRecap);
  });

  test("RPC error throws RPC_ERROR", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Function not found" },
    });

    await expect(api.getWeeklyRecap("user-001")).rejects.toMatchObject({
      message: "Function not found",
      code: "RPC_ERROR",
    });
  });

  test("null data throws EMPTY_RESPONSE", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    await expect(api.getWeeklyRecap("user-001")).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });

  test("response with error field throws with response code", async () => {
    mockRpc.mockResolvedValue({
      data: { error: "Unauthorized", code: "UNAUTHORIZED" },
      error: null,
    });

    await expect(api.getWeeklyRecap("user-001")).rejects.toMatchObject({
      message: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  });

  test("empty week returns has_data: false", async () => {
    const emptyRecap = {
      ...validRecap,
      sessions_completed: 0,
      total_minutes: 0,
      avg_intensity_reduction: null,
      best_session_reduction: null,
      top_themes: [],
      emotional_shifts: [],
      badges_earned: [],
      has_data: false,
    };
    mockRpc.mockResolvedValue({ data: emptyRecap, error: null });

    const result = await api.getWeeklyRecap("user-001");

    expect(result.has_data).toBe(false);
    expect(result.sessions_completed).toBe(0);
  });
});
