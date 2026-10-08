export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  crisisDetected: boolean;
}

export type ConversationPhase =
  | "intro"
  | "exploration"
  | "deepening"
  | "sud_rating"
  | "summary"
  | "plan_proposal";

export interface ConversationHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationRequest {
  message: string;
  message_type: "intake";
  conversation_history: ConversationHistoryMessage[];
}

export interface ExtractedIssue {
  title: string;
  description: string;
  sud: number | null;
}

export interface ExtractedIntakeData {
  issues: ExtractedIssue[];
  suggested_journey_title: string | null;
  suggested_journey_goal: string | null;
}

// ============================================================================
// Guided Intake: Express -> Assess -> Plan
// ============================================================================

/** Trigger categories for issue assessment */
export type TriggerCategory =
  | "work"
  | "family"
  | "relationships"
  | "social"
  | "health"
  | "financial"
  | "self_image"
  | "past_trauma"
  | "uncertainty"
  | "other";

export const TRIGGER_LABELS: Record<TriggerCategory, string> = {
  work: "Work",
  family: "Family",
  relationships: "Relationships",
  social: "Social",
  health: "Health",
  financial: "Financial",
  self_image: "Self-Image",
  past_trauma: "Past Experience",
  uncertainty: "Uncertainty",
  other: "Other",
};

/** Duration categories */
export type DurationCategory = "days" | "weeks" | "months" | "years";

export const DURATION_LABELS: Record<DurationCategory, string> = {
  days: "Days",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
};

/** Body sensation locations */
export type BodyLocation =
  | "head"
  | "throat"
  | "chest"
  | "stomach"
  | "shoulders"
  | "back"
  | "hands"
  | "legs"
  | "none";

export const BODY_LOCATION_LABELS: Record<BodyLocation, string> = {
  head: "Head",
  throat: "Throat",
  chest: "Chest",
  stomach: "Stomach",
  shoulders: "Shoulders",
  back: "Back",
  hands: "Hands",
  legs: "Legs",
  none: "Nowhere specific",
};

/** AI-generated clarification question */
export interface ClarificationQuestion {
  id: string;
  text: string;
  type: "yes_no" | "scale" | "choice";
  options?: string[]; // for "choice" type
}

/** Single issue extracted by AI with user assessment data */
export interface AssessedIssue {
  id: string;
  title: string;
  description: string;
  // User-assessed fields (filled during Phase 2)
  intensity: number | null;
  triggers: TriggerCategory[];
  duration: DurationCategory | null;
  bodyLocations: BodyLocation[];
  clarifications: Record<string, string | boolean | number>;
  // AI-generated fields
  suggestedClarifications: ClarificationQuestion[];
}

/** Issue relationship for chain analysis (Phase 3) */
export interface IssueRelationship {
  fromId: string;
  toId: string;
  relationship: "causes" | "worsens" | "blocks";
  description: string;
}

/** Full chain analysis result from AI */
export interface IssueChainAnalysis {
  issues: Array<{
    id: string;
    title: string;
    intensity: number;
    priority: number;
    rationale: string;
  }>;
  relationships: IssueRelationship[];
  recommendedOrder: string[];
  chainExplanation: string;
  suggestedJourneyTitle: string;
  suggestedJourneyGoal: string;
}

/** Intake flow phase */
export type GuidedIntakePhase =
  | "express"       // Phase 1: Free chat
  | "confirm"       // AI extracted issues, user confirms
  | "assess"        // Phase 2: Per-issue structured assessment
  | "analyze"       // Loading: AI analyzing chains
  | "plan"          // Phase 3: Show chain + priority, user confirms
  | "creating";     // Creating journey

/** Structured message types for chat */
export type StructuredMessageType =
  | "text"              // Regular chat bubble
  | "issue_extraction"  // AI extracted issues — render as cards
  | "assessment_complete" // All issues assessed — trigger analysis
  | "chain_analysis";   // Chain result — render as visual

export interface ConversationResponse {
  message: string;
  crisis_detected: boolean;
  phase: ConversationPhase;
  extracted_data: ExtractedIntakeData | null;
  message_id: string;
  // Smart mock fallback fields
  system_maintenance?: boolean;
  suggested_categories?: string[];
}

// Reflection types
export type ReflectionPhase =
  | "reflection_start"
  | "reflection_exploring"
  | "reflection_complete";

export type SessionRecommendation = "advance" | "repeat" | "repeat_gentle";

export interface ExtractedReflectionData {
  insights: Record<string, string>;
  key_themes: string[];
  emotional_shift: string | null;
  session_recommendation: SessionRecommendation | null;
}

export interface ScriptSummary {
  round_types: string[];
  setup_statements: string[];
  key_tapping_statements: string[];
  reframe_statements: string[];
}

export interface ReflectionConversationRequest {
  message: string;
  message_type: "reflection";
  session_id: string;
  journey_id: string;
  conversation_history: ConversationHistoryMessage[];
  survey_answers?: {
    shifts: string[];
    would_repeat: string | null;
  };
  duration_seconds?: number;
  script_summary?: ScriptSummary;
}

export interface ReflectionConversationResponse {
  message: string;
  crisis_detected: boolean;
  phase: ConversationPhase;
  reflection_phase: ReflectionPhase;
  reflection_data: ExtractedReflectionData | null;
  message_id: string;
}

// Check-in types
export type MoodValue = "sad" | "meh" | "neutral" | "good" | "great";

export type CheckinPhase =
  | "checkin_start"
  | "checkin_active"
  | "checkin_complete";

export interface ExtractedCheckinData {
  updated_sud?: number;
  emotional_shift?: string;
  generate_new_session?: boolean;
}

export interface CheckinConversationResponse {
  message: string;
  crisis_detected: boolean;
  phase: ConversationPhase;
  checkin_phase: CheckinPhase;
  checkin_data: ExtractedCheckinData | null;
  message_id: string;
}
