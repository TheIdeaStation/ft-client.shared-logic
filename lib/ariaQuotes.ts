interface AriaQuoteStats {
  completedSessions: number;
  currentStreak: number;
  averageSudReduction: number | null;
  totalTappingMinutes: number;
}

const GENERIC_QUOTES = [
  "Every tap is a gentle step toward the peace you deserve.",
  "You're doing something beautiful for yourself today.",
  "Healing isn't linear, but every session matters.",
  "Your feelings are valid. Let's work through them together.",
  "Small moments of calm create big shifts over time.",
];

export function getContextualAriaQuote(stats: AriaQuoteStats): string {
  const { completedSessions, currentStreak, averageSudReduction, totalTappingMinutes } = stats;

  // No sessions yet — welcoming quote
  if (completedSessions === 0) {
    return "Every journey begins with a single tap. Ready when you are.";
  }

  // Streak-based (high priority — reinforces habit)
  if (currentStreak >= 30) {
    return "30 days of consistency — you've turned self-care into a way of life.";
  }
  if (currentStreak >= 14) {
    return "Two weeks strong. You're rewiring how your nervous system responds to stress.";
  }
  if (currentStreak >= 7) {
    return "A full week of showing up for yourself. That takes real commitment.";
  }
  if (currentStreak >= 3) {
    return `${currentStreak} days in a row — your consistency is creating real change.`;
  }

  // Progress-based
  if (averageSudReduction != null && averageSudReduction >= 3) {
    return "Your average relief is growing. Your body is learning to let go faster.";
  }
  if (averageSudReduction != null && averageSudReduction >= 1.5) {
    return "Your average relief is improving. That's your nervous system learning.";
  }

  // Session count milestones
  if (completedSessions >= 20) {
    return "20+ sessions — you've built a powerful self-care practice.";
  }
  if (completedSessions >= 10) {
    return "Double digits! Each session builds on the last.";
  }
  if (completedSessions >= 5) {
    return "5 sessions in. You're past the starting line — this is real momentum.";
  }

  // Time-based
  if (totalTappingMinutes >= 60) {
    return `${Math.floor(totalTappingMinutes / 60)}+ hours invested in your wellbeing. That's powerful.`;
  }

  // Fallback — rotate generic quotes by day
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return GENERIC_QUOTES[dayOfYear % GENERIC_QUOTES.length];
}
