/**
 * @feathertap/shared-logic — platform-free domain logic shared by the
 * FeatherTap mobile app and web app.
 *
 * RULE: nothing in this package may import react-native, expo-*, next/*, or a
 * Supabase client. Anything platform-specific belongs in the consuming app and
 * is injected (see `createApiClient`). React is allowed for pure hooks only.
 */

// ── API client (inject your own Supabase client) ─────────────────────────────
export { createApiClient, ApiClientError, isCrisisResponse } from "./lib/api-client";
export type { SupabaseLike, SupabaseLikeError, FeatherTapApi } from "./lib/api-client";
export type * from "./lib/api-client";

// ── Domain logic ─────────────────────────────────────────────────────────────
export * from "./lib/audioSync";
export * from "./lib/audioUrl";
export * from "./lib/conversationLogic";
export * from "./lib/ariaQuotes";
export * from "./lib/errorMessages";
export * from "./lib/firstTap";
export * from "./lib/journeyProgress";
export * from "./lib/microSession";
export * from "./lib/sessionScript";
export * from "./lib/sessionTarget";
export * from "./lib/timeOfDay";
export * from "./lib/weeklyRecap";

// `recommendations` has its own `getTimeOfDay` — a different function from
// `lib/timeOfDay`'s (it returns a recommendation bucket, not a clock bucket).
// Re-exported under a distinct name so both remain reachable.
export { getTimeOfDay as getRecommendationTimeOfDay } from "./lib/recommendations";
export type { RecommendationContext, Recommendation } from "./lib/recommendations";
export { getRecommendations, getPostSessionRecommendations } from "./lib/recommendations";

// ── Session player state machine (pure useReducer) ───────────────────────────
export * from "./hooks/useSessionPlayer";

// ── Content constants ────────────────────────────────────────────────────────
export * from "./constants/preBuiltSessions";

// ── Types ────────────────────────────────────────────────────────────────────
// NOTE: `lib/api-client.ts` re-declares 21 of these types (13 conversation,
// 7 tapping, 1 survey). That duplication predates this package and lives in the
// mobile app; the API-client copies win here because they track the server's
// OpenAPI contract. Only the non-duplicated members are re-exported below.
// Deduplicating properly is tracked as follow-up work.
export type { Database, Json } from "./types/database";

export type {
  AssessedIssue, BodyLocation, ChatMessage, CheckinConversationResponse,
  ClarificationQuestion, ConversationRequest, ConversationResponse,
  DurationCategory, GuidedIntakePhase, ReflectionConversationRequest,
  ReflectionConversationResponse, StructuredMessageType, TriggerCategory,
} from "./types/conversation";
export { BODY_LOCATION_LABELS, DURATION_LABELS, TRIGGER_LABELS } from "./types/conversation";

export type { GenerateScriptRequest, GenerateScriptResponse } from "./types/tapping";

export type { RepeatOption, ShiftOption } from "./types/survey";
export { REPEAT_LABELS, SHIFT_LABELS } from "./types/survey";
