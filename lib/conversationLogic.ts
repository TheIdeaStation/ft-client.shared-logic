/**
 * Pure logic behind Aria's intake conversation.
 *
 * Shared so mobile and web treat the same reply identically — what the user is
 * shown, and what happens when the server's chain analysis is unavailable.
 */

import type { AssessedIssue, IssueChainAnalysis } from "../types/conversation";

/**
 * Remove the structured tags Aria emits alongside her prose.
 *
 * The model is instructed to wrap extracted data in <extraction>, <reflection>
 * or <checkin> tags. This is the safety net that keeps them off the screen if
 * one slips through, including an UNCLOSED tag — a truncated response would
 * otherwise leak raw markup into the chat.
 */
export function stripAiTags(text: string): string {
  return text
    .replace(/<(extraction|reflection|checkin)>[\s\S]*?<\/\1>/g, "")
    .replace(/<(extraction|reflection|checkin)>[\s\S]*/g, "")
    .trim();
}

/**
 * A plain-language goal built from what the user told us, used when the server
 * could not produce one.
 */
export function buildFallbackGoal(issues: readonly AssessedIssue[]): string {
  const top = issues[0];
  if (!top) return "Build emotional resilience through personalized tapping sessions";

  const parts: string[] = [];
  const bodyParts = top.bodyLocations.filter((b) => b !== "none");
  if (bodyParts.length > 0) parts.push(`release tension in your ${bodyParts.join(" and ")}`);
  if (top.triggers.length > 0) parts.push(`reduce reactivity to ${top.triggers.join(" and ")} triggers`);
  if (top.intensity && top.intensity >= 5) {
    parts.push(`bring distress from ${top.intensity}/10 to a manageable level`);
  }
  if (parts.length === 0) parts.push(`address ${top.title.toLowerCase()}`);

  return `${parts.join(", ")}, and build a calmer, more resilient response through targeted tapping sessions`;
}

/**
 * A simple chain in the order the user gave, used when the server's analysis is
 * missing or errored.
 *
 * Deliberately never throws: being unable to order someone's issues must not
 * strand them mid-intake, which is the point in the funnel where they are most
 * likely to leave.
 */
export function buildFallbackAnalysis(
  issues: readonly AssessedIssue[],
): IssueChainAnalysis {
  return {
    issues: issues.map((issue, i) => ({
      id: issue.id,
      title: issue.title,
      intensity: issue.intensity ?? 5,
      priority: i + 1,
      rationale: issue.description,
    })),
    relationships: [],
    recommendedOrder: issues.map((issue) => issue.id),
    chainExplanation:
      "Based on what you've shared, here's the order I'd recommend tackling your issues.",
    suggestedJourneyTitle: issues[0]?.title ?? "My Journey",
    suggestedJourneyGoal: buildFallbackGoal(issues),
  };
}

/**
 * Should the intake move from free conversation to confirming extracted issues?
 *
 * Only on the FIRST extraction: a later reply that repeats the data must not
 * bounce the user back to a screen they already completed.
 */
export function shouldEnterConfirmPhase(
  extractedIssueCount: number,
  currentPhase: string,
): boolean {
  return extractedIssueCount > 0 && currentPhase === "express";
}
