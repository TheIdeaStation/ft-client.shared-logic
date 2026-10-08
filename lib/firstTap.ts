/**
 * First Tap experience utilities.
 *
 * Logic for detecting first-time users and providing a low-friction
 * entry to EFT tapping before committing to a full journey.
 */

import { CATEGORIES, PRE_BUILT_SESSIONS, type PreBuiltCategory, type PreBuiltSession } from "../constants/preBuiltSessions";

/**
 * Is this a first-time user who hasn't tapped yet?
 */
export function isFirstTimeUser(completedSessions: number, journeyCount: number): boolean {
  return completedSessions === 0 && journeyCount === 0;
}

/**
 * Should we show the "Ready for something deeper?" CTA?
 * After first session but before creating any journey.
 */
export function shouldShowPersonalizedCTA(completedSessions: number, journeyCount: number): boolean {
  return completedSessions > 0 && journeyCount === 0;
}

/**
 * Get the top N categories for quick tap (ordered by popularity).
 */
export function getQuickTapCategories(count: number = 3): PreBuiltCategory[] {
  return CATEGORIES.slice(0, count);
}

/**
 * Find the first free session in a category.
 */
export function getFirstFreeSession(categoryId: string): PreBuiltSession | null {
  return PRE_BUILT_SESSIONS.find((s) => s.categoryId === categoryId) ?? null;
}

/**
 * Time-of-day greeting.
 */
export function getQuickTapGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * CTA content for the post-first-session personalized journey prompt.
 */
export function getPersonalizedCTAText(): {
  title: string;
  subtitle: string;
  buttonLabel: string;
} {
  return {
    title: "Ready for something deeper?",
    subtitle: "That was a taste of EFT tapping. Aria can create a personalized journey just for you — tailored to your specific concerns.",
    buttonLabel: "Talk to Aria",
  };
}
