export type TappingPointCode =
  | "KC"
  | "TH"
  | "EB"
  | "SE"
  | "UE"
  | "UN"
  | "CH"
  | "CB"
  | "UA";

export interface TappingPoint {
  point: TappingPointCode;
  statement: string;
  voiceInstruction: string;
}

export interface TappingRound {
  roundNumber: number;
  type: "setup" | "tapping" | "positive_reframe";
  intensityLevel: "high" | "medium" | "low";
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

export type SessionType = "standard" | "gentle" | "intensive";

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

export interface GenerateScriptRequest {
  journey_id: string;
  issue_id?: string;
  session_type?: SessionType;
}

export interface GenerateScriptResponse {
  session_id: string;
  script: TappingScript;
  audio_url?: string | null;
  audio_metadata?: AudioMetadata | null;
}
