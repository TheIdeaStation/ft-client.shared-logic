/**
 * FeatherTap Typed API Client
 *
 * Wraps all Edge Function and RPC calls with full TypeScript types.
 * Call `createApiClient(supabase)` once per app and use the returned object
 * instead of reaching for supabase.functions.invoke directly.
 *
 * Types are defined in ft-server/api-spec/types.ts (single source of truth).
 * The interfaces below are kept in sync with that file.
 *
 * PLATFORM-FREE BY DESIGN. This module must never import a Supabase client.
 * Each app (mobile / web) constructs its own and injects it, because they differ
 * in auth storage and `detectSessionInUrl`. Only two methods are ever used, so
 * the injected surface stays deliberately tiny — see `SupabaseLike`.
 */

/** Shape of an error returned by supabase-js. */
export interface SupabaseLikeError {
  message: string;
  [key: string]: unknown;
}

/** The only part of a Supabase client this module needs. */
export interface SupabaseLike {
  functions: {
    invoke: (
      name: string,
      options?: { body?: unknown; headers?: Record<string, string> },
    ) => Promise<{ data: unknown; error: SupabaseLikeError | null }>;
  };
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: SupabaseLikeError | null }>;
}

// ── Error Class ─────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = "ApiClientError";
  }
}

// ── Shared Types ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}

export interface ConversationHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

// ── ai-conversation Types ───────────────────────────────────────────────────

export type AiConversationMessageType =
  | "chat"
  | "intake"
  | "check_in"
  | "reflection"
  | "checkin"
  | "chain_analysis";

export type ConversationPhase =
  | "intro"
  | "exploration"
  | "deepening"
  | "sud_rating"
  | "summary"
  | "plan_proposal";

export type ReflectionPhase =
  | "reflection_start"
  | "reflection_exploring"
  | "reflection_complete";

export type CheckinPhase =
  | "checkin_start"
  | "checkin_active"
  | "checkin_complete";

export type MoodValue = "sad" | "meh" | "neutral" | "good" | "great";

export type SessionRecommendation = "advance" | "repeat" | "repeat_gentle";

export interface ScriptSummary {
  round_types: string[];
  setup_statements: string[];
  key_tapping_statements: string[];
  reframe_statements: string[];
}

export interface SurveyAnswers {
  shifts: string[];
  would_repeat: string | null;
}

export interface AssessedIssuePayload {
  id: string;
  title: string;
  description: string;
  intensity: number | null;
  triggers: string[];
  duration: string | null;
  body_locations: string[];
  clarifications: Record<string, unknown>;
}

export interface AiConversationRequest {
  message: string;
  message_type?: AiConversationMessageType;
  conversation_history?: ConversationHistoryMessage[];
  session_id?: string;
  journey_id?: string;
  issue_id?: string;
  survey_answers?: SurveyAnswers;
  duration_seconds?: number;
  script_summary?: ScriptSummary;
  mood?: MoodValue;
  mood_intensity?: number;
  assessed_issues?: AssessedIssuePayload[];
}

export interface ExtractedIssue {
  title: string;
  description: string;
  sud: number | null;
  triggers?: string[];
  body_location?: string;
}

export interface ExtractedIntakeData {
  issues: ExtractedIssue[];
  suggested_journey_title: string | null;
  suggested_journey_goal: string | null;
}

export interface ExtractedReflectionData {
  insights: Record<string, string>;
  key_themes: string[];
  emotional_shift: string | null;
  session_recommendation: SessionRecommendation | null;
}

export interface ExtractedCheckinData {
  updated_sud?: number;
  emotional_shift?: string;
  generate_new_session?: boolean;
}

export interface AiConversationIntakeResponse {
  message: string;
  crisis_detected: boolean;
  phase: ConversationPhase;
  extracted_data: ExtractedIntakeData | null;
  message_id: string;
  system_maintenance?: boolean;
  suggested_categories?: string[];
  _ai_error?: string;
}

export interface AiConversationReflectionResponse {
  message: string;
  crisis_detected: boolean;
  phase: ConversationPhase;
  reflection_phase: ReflectionPhase;
  reflection_data: ExtractedReflectionData | null;
  message_id: string;
  _ai_error?: string;
}

export interface AiConversationCheckinResponse {
  message: string;
  crisis_detected: boolean;
  phase: ConversationPhase;
  checkin_phase: CheckinPhase;
  checkin_data: ExtractedCheckinData | null;
  message_id: string;
}

export interface ChainAnalysisIssue {
  id: string;
  title: string;
  intensity: number;
  priority: number;
  rationale: string;
}

export interface IssueRelationship {
  fromId: string;
  toId: string;
  relationship: "causes" | "worsens" | "blocks";
  description: string;
}

export interface IssueChainAnalysis {
  issues: ChainAnalysisIssue[];
  relationships: IssueRelationship[];
  recommendedOrder: string[];
  chainExplanation: string;
  suggestedJourneyTitle: string;
  suggestedJourneyGoal: string;
}

export interface AiConversationChainAnalysisResponse {
  chain_analysis: IssueChainAnalysis;
}

// ── generate-tapping-script Types ───────────────────────────────────────────

export type TappingPointCode = "KC" | "TH" | "EB" | "SE" | "UE" | "UN" | "CH" | "CB" | "UA";
export type RoundType = "setup" | "tapping" | "positive_reframe";
export type IntensityLevel = "high" | "medium" | "low";
export type SessionType = "standard" | "gentle" | "intensive";

export interface TappingPoint {
  point: TappingPointCode;
  statement: string;
  voiceInstruction: string;
}

export interface TappingRound {
  roundNumber: number;
  type: RoundType;
  intensityLevel: IntensityLevel;
  setupStatement?: string;
  tappingPoints: TappingPoint[];
  breathingPause: boolean;
  sudCheck: boolean;
}

export interface TappingScript {
  sessionId: string;
  title: string;
  estimatedDurationMinutes: number;
  rounds: TappingRound[];
}

export interface AudioSegment {
  roundIndex: number;
  pointIndex: number;
  text: string;
  start_ms: number;
  end_ms: number;
}

export interface AudioMetadata {
  voice_id: string;
  model_id: string;
  total_duration_ms: number;
  segments: AudioSegment[];
}

export interface GenerateTappingScriptRequest {
  journey_id: string;
  issue_id?: string;
  session_type?: SessionType;
  user_override_advance?: boolean;
  repeat_session_id?: string;
}

export interface GenerateTappingScriptResponse {
  session_id: string;
  script: TappingScript;
  audio_url: string | null;
  audio_metadata: AudioMetadata | null;
}

// ── generate-explore-audio Types ────────────────────────────────────────────

export interface ExploreSessionInput {
  id: string;
  script: TappingScript;
}

export interface GenerateExploreAudioRequest {
  sessions: ExploreSessionInput[];
}

export interface ExploreAudioResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface GenerateExploreAudioResponse {
  succeeded: number;
  failed: number;
  results: ExploreAudioResult[];
}

// ── generate-voice Types ────────────────────────────────────────────────────

export interface GenerateVoiceRequest {
  text: string;
  voice?: string;
}

// ── send-push Types ─────────────────────────────────────────────────────────

export interface SendPushRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ── API Client ──────────────────────────────────────────────────────────────

class FeatherTapApi {
  constructor(private readonly supabase: SupabaseLike) {}

  // ── Edge Functions ──────────────────────────────────────────────────────

  /**
   * Send a message to Aria (intake conversation).
   * Requires Pro subscription for intake/chat message types.
   */
  async aiConversationIntake(
    params: AiConversationRequest,
  ): Promise<AiConversationIntakeResponse> {
    const { data, error } = await this.supabase.functions.invoke("ai-conversation", {
      body: { ...params, message_type: params.message_type ?? "intake" },
    });

    if (error) throw new ApiClientError(error.message, "INVOKE_ERROR");
    const response = data as (AiConversationIntakeResponse & ApiError) | null;
    if (!response) throw new ApiClientError("No response received", "EMPTY_RESPONSE");
    if (response.error) throw new ApiClientError(response.error, response.code);
    return response;
  }

  /**
   * Send a reflection message to Aria.
   * Requires session_id and journey_id.
   */
  async aiConversationReflection(
    params: AiConversationRequest,
  ): Promise<AiConversationReflectionResponse> {
    const { data, error } = await this.supabase.functions.invoke("ai-conversation", {
      body: { ...params, message_type: "reflection" },
    });

    if (error) throw new ApiClientError(error.message, "INVOKE_ERROR");
    const response = data as (AiConversationReflectionResponse & ApiError) | null;
    if (!response) throw new ApiClientError("No response received", "EMPTY_RESPONSE");
    if (response.error) throw new ApiClientError(response.error, response.code);
    return response;
  }

  /**
   * Send a check-in message to Aria.
   * Requires journey_id, optionally issue_id.
   */
  async aiConversationCheckin(
    params: AiConversationRequest,
  ): Promise<AiConversationCheckinResponse> {
    const { data, error } = await this.supabase.functions.invoke("ai-conversation", {
      body: { ...params, message_type: "checkin" },
    });

    if (error) throw new ApiClientError(error.message, "INVOKE_ERROR");
    const response = data as (AiConversationCheckinResponse & ApiError) | null;
    if (!response) throw new ApiClientError("No response received", "EMPTY_RESPONSE");
    if (response.error) throw new ApiClientError(response.error, response.code);
    return response;
  }

  /**
   * Run chain analysis on assessed issues.
   * Returns prioritized issue order and relationship graph.
   */
  async aiConversationChainAnalysis(
    params: AiConversationRequest,
  ): Promise<AiConversationChainAnalysisResponse> {
    const { data, error } = await this.supabase.functions.invoke("ai-conversation", {
      body: { ...params, message_type: "chain_analysis" },
    });

    if (error) throw new ApiClientError(error.message, "INVOKE_ERROR");
    const response = data as (AiConversationChainAnalysisResponse & ApiError) | null;
    if (!response) throw new ApiClientError("No response received", "EMPTY_RESPONSE");
    if ("error" in response && (response as unknown as ApiError).error) {
      const errData = response as unknown as ApiError;
      throw new ApiClientError(errData.error, errData.code);
    }
    return response;
  }

  /**
   * Generate a tapping script for a journey.
   * Returns the script, session ID, and optional TTS audio.
   * May return an existing pending session instead of generating new.
   */
  async generateTappingScript(
    params: GenerateTappingScriptRequest,
  ): Promise<GenerateTappingScriptResponse> {
    const { data, error } = await this.supabase.functions.invoke("generate-tapping-script", {
      body: params,
    });

    if (error) {
      // Check if error response body has a structured code
      const errData = data as ApiError | null;
      if (errData?.code) {
        throw new ApiClientError(errData.error, errData.code);
      }
      throw new ApiClientError(error.message, "INVOKE_ERROR");
    }

    const response = data as (GenerateTappingScriptResponse & ApiError) | null;
    if (!response) throw new ApiClientError("No response received", "EMPTY_RESPONSE");
    if (response.error) throw new ApiClientError(response.error, response.code);
    if (!response.session_id || !response.script) {
      throw new ApiClientError("Invalid response: missing session_id or script", "INVALID_RESPONSE");
    }
    return response;
  }

  /**
   * Generate TTS audio for explore (pre-built) sessions.
   * Admin only — requires service_role JWT.
   */
  async generateExploreAudio(
    params: GenerateExploreAudioRequest,
  ): Promise<GenerateExploreAudioResponse> {
    const { data, error } = await this.supabase.functions.invoke("generate-explore-audio", {
      body: params,
    });

    if (error) throw new ApiClientError(error.message, "INVOKE_ERROR");
    const response = data as (GenerateExploreAudioResponse & ApiError) | null;
    if (!response) throw new ApiClientError("No response received", "EMPTY_RESPONSE");
    if (response.error) throw new ApiClientError(response.error, response.code);
    return response;
  }

  /**
   * Generate TTS voice audio (stub — not yet implemented).
   */
  async generateVoice(
    params: GenerateVoiceRequest,
  ): Promise<never> {
    const { data, error } = await this.supabase.functions.invoke("generate-voice", {
      body: params,
    });

    if (error) throw new ApiClientError(error.message, "INVOKE_ERROR");
    const response = data as ApiError | null;
    if (response?.error) throw new ApiClientError(response.error, response.code);
    throw new ApiClientError("Unexpected response from generate-voice", "UNEXPECTED_RESPONSE");
  }

  /**
   * Send push notification to a user (stub — not yet implemented).
   */
  async sendPush(
    params: SendPushRequest,
  ): Promise<never> {
    const { data, error } = await this.supabase.functions.invoke("send-push", {
      body: params,
    });

    if (error) throw new ApiClientError(error.message, "INVOKE_ERROR");
    const response = data as ApiError | null;
    if (response?.error) throw new ApiClientError(response.error, response.code);
    throw new ApiClientError("Unexpected response from send-push", "UNEXPECTED_RESPONSE");
  }
  // ── RPC Calls ──────────────────────────────────────────────────────────────

  /**
   * Submit a quick reflection (5-second rating) after a tapping session.
   * Creates a session_reflections row that satisfies the reflection gate.
   */
  async submitQuickReflection(
    params: SubmitQuickReflectionRequest,
  ): Promise<SubmitQuickReflectionResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)("submit_quick_reflection", {
      p_session_id: params.sessionId,
      p_journey_id: params.journeyId,
      p_user_id: params.userId,
      p_rating: params.rating,
      p_note: params.note ?? null,
    }) as { data: SubmitQuickReflectionResponse | null; error: { message: string } | null };

    if (error) throw new ApiClientError(error.message, "RPC_ERROR");
    const response = data ?? { success: false };
    if (response.error) throw new ApiClientError(response.error, response.code ?? "UNKNOWN");
    return response;
  }

  /**
   * Complete a journey with server-side validation.
   * Requires 2+ visualization sessions before allowing completion.
   */
  async completeJourney(
    journeyId: string,
    userId: string,
  ): Promise<CompleteJourneyResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)("complete_journey", {
      p_journey_id: journeyId,
      p_user_id: userId,
    }) as { data: CompleteJourneyResponse | null; error: { message: string } | null };

    if (error) throw new ApiClientError(error.message, "RPC_ERROR");
    const response = data ?? { completed: false };
    if (response.error) throw new ApiClientError(response.error, response.code ?? "UNKNOWN");
    return response;
  }

  /**
   * Set the session target for a journey based on its issues.
   * Called after journey creation to calculate recommended session count.
   */
  async setSessionTarget(
    journeyId: string,
    userId: string,
  ): Promise<SetSessionTargetResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)("set_journey_session_target", {
      p_journey_id: journeyId,
      p_user_id: userId,
    }) as { data: SetSessionTargetResponse | null; error: { message: string } | null };

    if (error) throw new ApiClientError(error.message, "RPC_ERROR");
    const response = data ?? { success: false };
    if (response.error) throw new ApiClientError(response.error, response.code ?? "UNKNOWN");
    return response;
  }

  /**
   * Extend a journey by adding more sessions to the target.
   * Used when user completes planned sessions but SUD is still elevated.
   */
  async extendJourney(
    journeyId: string,
    userId: string,
    additionalSessions: number = 2,
  ): Promise<ExtendJourneyResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)("extend_journey", {
      p_journey_id: journeyId,
      p_user_id: userId,
      p_additional_sessions: additionalSessions,
    }) as { data: ExtendJourneyResponse | null; error: { message: string } | null };

    if (error) throw new ApiClientError(error.message, "RPC_ERROR");
    const response = data ?? { success: false };
    if (response.error) throw new ApiClientError(response.error, response.code ?? "UNKNOWN");
    return response;
  }

  /**
   * Get the weekly recap summary for the current user.
   * Aggregates sessions, reflections, badges, and streak data from last 7 days.
   */
  async getWeeklyRecap(userId: string): Promise<WeeklyRecapResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)("get_weekly_recap", {
      p_user_id: userId,
    }) as { data: WeeklyRecapResponse | null; error: { message: string } | null };

    if (error) throw new ApiClientError(error.message, "RPC_ERROR");
    if (!data) throw new ApiClientError("No recap data received", "EMPTY_RESPONSE");
    if ((data as unknown as ApiError).error) {
      const errData = data as unknown as ApiError;
      throw new ApiClientError(errData.error, errData.code);
    }
    return data;
  }

  /**
   * Check if a journey requires reflection before the next session can be generated.
   * Server-side function mirrors the reflection gate logic from generate-tapping-script.
   */
  async checkReflectionRequired(
    journeyId: string,
    userId: string,
  ): Promise<ReflectionCheckResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)("check_reflection_required", {
      p_journey_id: journeyId,
      p_user_id: userId,
    }) as { data: ReflectionCheckResponse | null; error: { message: string } | null };

    if (error) throw new ApiClientError(error.message, "RPC_ERROR");
    return data ?? { reflection_required: false };
  }

  /**
   * Get the user's emotional memory profile (Bet 2) — recurring themes, core
   * beliefs, and what has helped most. Powers Aria's "I remember you" surfaces.
   * Therapeutic / general-wellness framing only; beliefs are reflected, never diagnosed.
   */
  async getEmotionalMemory(userId: string): Promise<EmotionalMemoryResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase.rpc as any)("get_emotional_memory", {
      p_user_id: userId,
    }) as { data: EmotionalMemoryResponse | null; error: { message: string } | null };

    if (error) throw new ApiClientError(error.message, "RPC_ERROR");
    if (!data) {
      return { themes: [], beliefs: [], what_worked: [], arc_summary: "", has_data: false };
    }
    if ((data as unknown as ApiError).error) {
      const errData = data as unknown as ApiError;
      throw new ApiClientError(errData.error, errData.code);
    }
    return data;
  }

  /**
   * Ask Aria for a session (Bet 4). The SERVER chooses the tool — tapping,
   * reframe, grounding, breath, affirmation, or meditation — based on the moment
   * (arousal, intensity, journey stage, time of day, memory). The client just
   * describes the moment and renders whatever SessionScript comes back. It NEVER
   * picks a modality (no tabs). A crisis note returns a hand-off instead.
   */
  async generateSession(
    params: GenerateSessionRequest,
  ): Promise<SessionScript | GenerateSessionCrisisResponse> {
    const { data, error } = await this.supabase.functions.invoke("generate-session", {
      body: params,
    });

    if (error) {
      const errData = data as ApiError | null;
      if (errData?.code) throw new ApiClientError(errData.error, errData.code);
      throw new ApiClientError(error.message, "INVOKE_ERROR");
    }

    const response = data as
      | (SessionScript & Partial<GenerateSessionCrisisResponse> & ApiError)
      | null;
    if (!response) throw new ApiClientError("No response received", "EMPTY_RESPONSE");
    if (response.error) throw new ApiClientError(response.error, response.code);
    if (response.crisis_detected) {
      return { message: response.message as string, crisis_detected: true };
    }
    if (!response.sessionId || !response.modality) {
      throw new ApiClientError("Invalid response: missing sessionId or modality", "INVALID_RESPONSE");
    }
    return response as SessionScript;
  }
}

/** True when generateSession returned a crisis hand-off rather than a session. */
export function isCrisisResponse(
  r: SessionScript | GenerateSessionCrisisResponse,
): r is GenerateSessionCrisisResponse {
  return (r as GenerateSessionCrisisResponse).crisis_detected === true;
}

// ── generate-session Types (Bet 4) ───────────────────────────────────────────

export type Modality =
  | "tapping"
  | "reframe"
  | "grounding"
  | "breath"
  | "affirmation"
  | "meditation";

export interface MicroSegment {
  kind: "breath_in" | "breath_out" | "hold" | "cue" | "affirmation" | "guidance";
  text: string;
  durationMs: number;
}

/** Unified session output for any modality: `rounds` for tapping/reframe, `segments` for micro-tools. */
export interface SessionScript {
  sessionId: string;
  modality: Modality;
  title: string;
  estimatedDurationMinutes: number;
  rationale: string;
  rounds?: TappingRound[];
  segments?: MicroSegment[];
  audio_url?: string | null;
  audio_metadata?: AudioMetadata | null;
}

export interface GenerateSessionRequest {
  journey_id?: string;
  issue_id?: string;
  /** True when entered from a moment-of-need / SOS surface. */
  acute_state?: boolean;
  arousal?: "high" | "moderate" | "low";
  current_sud?: number;
  time_of_day?: "day" | "evening" | "night";
  note?: string;
  /** Journey sessions: intensity variant (default "standard"). */
  session_type?: SessionType;
  /** Journey sessions: skip the reflection recommendation and force advance. */
  user_override_advance?: boolean;
  /** Journey sessions: replay a previous session's script instead of generating. */
  repeat_session_id?: string;
}

export interface GenerateSessionCrisisResponse {
  message: string;
  crisis_detected: true;
}

export interface ReflectionCheckResponse {
  reflection_required: boolean;
  session_id?: string;
}

export type BeliefStatus = "active" | "fading" | "resolved";

export interface ThemeStat {
  theme: string;
  count: number;
  last_seen: string;
  avg_intensity: number;
}

export interface BeliefStat {
  belief: string;
  count: number;
  first_seen: string;
  last_seen: string;
  status: BeliefStatus;
}

export interface WhatWorked {
  intervention_type: string;
  avg_sud_delta: number;
  sample_statement: string;
  n: number;
}

export interface EmotionalMemoryResponse {
  themes: ThemeStat[];
  beliefs: BeliefStat[];
  what_worked: WhatWorked[];
  arc_summary: string;
  last_updated?: string;
  has_data: boolean;
}

export type QuickRating = "much_better" | "somewhat_better" | "about_the_same";

export interface SetSessionTargetResponse {
  success: boolean;
  total_sessions?: number;
  issue_count?: number;
  avg_sud?: number;
  error?: string;
  code?: string;
}

export interface ExtendJourneyResponse {
  success: boolean;
  total_sessions?: number;
  previous_total?: number;
  error?: string;
  code?: string;
}

export interface SubmitQuickReflectionRequest {
  sessionId: string;
  journeyId: string;
  userId: string;
  rating: QuickRating;
  note?: string;
}

export interface SubmitQuickReflectionResponse {
  success: boolean;
  reflection_id?: string;
  recommendation?: string;
  already_exists?: boolean;
  error?: string;
  code?: string;
}

export interface CompleteJourneyResponse {
  completed: boolean;
  already_completed?: boolean;
  viz_completed?: number;
  viz_required?: number;
  error?: string;
  code?: string;
}

export interface WeeklyRecapBadge {
  name: string;
  icon: string;
}

export interface WeeklyRecapResponse {
  week_start: string;
  week_end: string;
  sessions_completed: number;
  total_minutes: number;
  avg_intensity_reduction: number | null;
  best_session_reduction: number | null;
  current_streak: number;
  top_themes: string[];
  emotional_shifts: string[];
  badges_earned: WeeklyRecapBadge[];
  journeys_completed: number;
  has_data: boolean;
}

/** Singleton API client instance */
/**
 * Build the typed API client for this app. Call once at startup and share the
 * result; each app injects its own configured Supabase client.
 */
export function createApiClient(client: SupabaseLike): FeatherTapApi {
  return new FeatherTapApi(client);
}

export type { FeatherTapApi };
