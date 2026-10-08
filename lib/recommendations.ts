import type { Database } from "../types/database";
import { CATEGORIES, PRE_BUILT_SESSIONS, type PreBuiltSession } from "../constants/preBuiltSessions";

type Session = Database["public"]["Tables"]["sessions"]["Row"];
type Journey = Database["public"]["Tables"]["journeys"]["Row"];
type Issue = Database["public"]["Tables"]["issues"]["Row"];

export interface RecommendationContext {
  journeys: Journey[];
  issues: Issue[];
  recentSessions: Session[];
  reflectionThemes: string[];
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  lastSessionCategory?: string;
}

export interface Recommendation {
  session: PreBuiltSession;
  reason: string;
  score: number;
}

function getTimeOfDay(): RecommendationContext["timeOfDay"] {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

/** Map issue/goal text to pre-built category IDs */
function issueToCategoryIds(text: string): string[] {
  const lower = text.toLowerCase();
  const matches: string[] = [];
  if (lower.includes("anxiety") || lower.includes("worry") || lower.includes("nervous")) matches.push("anxiety");
  if (lower.includes("stress") || lower.includes("overwhelm") || lower.includes("pressure")) matches.push("stress");
  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("rest")) matches.push("sleep");
  if (lower.includes("confidence") || lower.includes("self-esteem") || lower.includes("worth")) matches.push("confidence");
  if (lower.includes("anger") || lower.includes("frustrat")) matches.push("anger");
  if (lower.includes("grief") || lower.includes("loss") || lower.includes("sad")) matches.push("grief");
  if (lower.includes("focus") || lower.includes("concentration") || lower.includes("productivity")) matches.push("focus");
  return matches;
}

/** Time-of-day category preferences */
const TIME_CATEGORY_BOOST: Record<RecommendationContext["timeOfDay"], string[]> = {
  morning: ["stress", "confidence", "focus"],
  afternoon: ["stress", "anxiety", "focus"],
  evening: ["sleep", "anxiety", "grief"],
  night: ["sleep"],
};

export function getRecommendations(ctx: RecommendationContext): Recommendation[] {
  const scored: Recommendation[] = [];

  for (const session of PRE_BUILT_SESSIONS) {
    let score = 0;
    const reasons: string[] = [];

    // Issue matching
    for (const issue of ctx.issues) {
      const cats = issueToCategoryIds(issue.title + " " + (issue.description ?? ""));
      if (cats.includes(session.categoryId)) {
        score += 30;
        reasons.push(`Matches your "${issue.title}" concern`);
        // Higher SUD = higher priority
        if (issue.current_sud >= 7) score += 15;
        else if (issue.current_sud >= 4) score += 8;
      }
    }

    // Journey goal matching
    for (const journey of ctx.journeys.filter((j) => j.status === "active")) {
      const goalCats = issueToCategoryIds(journey.goal ?? "");
      if (goalCats.includes(session.categoryId)) {
        score += 20;
        if (!reasons.length) reasons.push("Supports your active journey");
      }
    }

    // Time-of-day boost
    const timeCats = TIME_CATEGORY_BOOST[ctx.timeOfDay];
    if (timeCats.includes(session.categoryId)) {
      score += 10;
      if (!reasons.length) {
        const timeLabel = ctx.timeOfDay === "morning" ? "morning" : ctx.timeOfDay === "evening" ? "evening" : ctx.timeOfDay === "night" ? "bedtime" : "afternoon";
        reasons.push(`Great for ${timeLabel}`);
      }
    }

    // Reflection theme matching
    for (const theme of ctx.reflectionThemes) {
      const themeCats = issueToCategoryIds(theme);
      if (themeCats.includes(session.categoryId)) {
        score += 12;
        if (!reasons.length) reasons.push("Based on your recent reflections");
      }
    }

    // Variety penalty — don't repeat the same category as last session
    if (ctx.lastSessionCategory && ctx.lastSessionCategory === session.categoryId) {
      score -= 10;
    }

    // Base score for variety (new users see varied content)
    if (score === 0) {
      score = 5;
      const cat = CATEGORIES.find((c) => c.id === session.categoryId);
      reasons.push(cat?.name ?? "Explore something new");
    }

    scored.push({
      session,
      reason: reasons[0] ?? "Recommended for you",
      score,
    });
  }

  // Sort by score descending, take top results
  return scored.sort((a, b) => b.score - a.score);
}

export function getPostSessionRecommendations(ctx: RecommendationContext & {
  justCompletedCategoryId?: string;
}): Recommendation[] {
  // Override lastSessionCategory with what was just completed
  const adjusted = {
    ...ctx,
    lastSessionCategory: ctx.justCompletedCategoryId ?? ctx.lastSessionCategory,
  };
  return getRecommendations(adjusted).slice(0, 3);
}

export { getTimeOfDay };
