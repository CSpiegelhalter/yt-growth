/**
 * Human-readable labels for retention analysis
 * Replaces internal enum codes with user-friendly copy
 */

export type RetentionEventCode =
  | "hook_end"
  | "intro_end"
  | "payoff_delayed"
  | "topic_shift"
  | "steepest_drop"
  | "crossed_50"
  | "slow_transition"
  | "dead_air"
  | "overlong_intro"
  | "unclear_promise";

type LabelEntry = {
  label: string;
  description: string;
  whyItMatters: string;
  whatToDo: string;
};

const RETENTION_LABELS: Record<RetentionEventCode, LabelEntry> = {
  hook_end: {
    label: "End of the intro/hook",
    description: "Viewers left right when your hook finished",
    whyItMatters: "This moment often decides whether viewers keep watching. If your hook doesn't immediately deliver value or spark curiosity, viewers bounce.",
    whatToDo: "Make your first 5-10 seconds impossible to skip. Lead with your biggest insight, a surprising fact, or a bold claim.",
  },
  intro_end: {
    label: "Intro ends",
    description: "Viewers dropped off after your introduction",
    whyItMatters: "Long intros test viewer patience. Modern audiences expect value within the first 30 seconds.",
    whatToDo: "Cut your intro in half. Jump straight to the value. Move logos and channel plugs to the end.",
  },
  payoff_delayed: {
    label: "Payoff came too late",
    description: "Viewers expected the main content sooner",
    whyItMatters: "When viewers click, they expect the title's promise quickly. Too much buildup loses impatient viewers.",
    whatToDo: "Front-load a 'mini payoff' - give a taste of the main value within 30 seconds, then expand.",
  },
  topic_shift: {
    label: "Abrupt topic shift",
    description: "Viewers left during a sudden change in content direction",
    whyItMatters: "Unexpected pivots can feel like a bait-and-switch. Viewers came for one thing and got another.",
    whatToDo: "Signpost transitions clearly: 'Now here's where it gets interesting...' or 'But before we dive into that...'",
  },
  steepest_drop: {
    label: "Sharp audience decline",
    description: "A sudden spike in viewers leaving at this exact moment",
    whyItMatters: "Something specific triggered a mass exodus. This is a critical moment to analyze and fix.",
    whatToDo: "Watch this exact moment in your video. What changed? Did energy drop? Did you lose the thread?",
  },
  crossed_50: {
    label: "Below 50% retention",
    description: "More than half your viewers have left by this point",
    whyItMatters: "This is the make-or-break threshold. YouTube's algorithm rewards videos that keep over 50% watching.",
    whatToDo: "Add pattern interrupts (cuts, B-roll, questions) every 15-20 seconds leading up to this point.",
  },
  slow_transition: {
    label: "Slow transition",
    description: "The pacing slowed down between sections",
    whyItMatters: "Momentum matters. When energy dips, viewers mentally check out and reach for something else.",
    whatToDo: "Tighten transitions. Cut dead air. Use jump cuts to maintain energy between topics.",
  },
  dead_air: {
    label: "Energy drop",
    description: "A noticeable lull in energy or pacing",
    whyItMatters: "Viewers subconsciously track engagement. When you lose steam, they lose interest.",
    whatToDo: "Record in shorter bursts. Re-read your script for energy. Add visual variety during 'talking head' sections.",
  },
  overlong_intro: {
    label: "Intro running too long",
    description: "Viewers left before you reached the main content",
    whyItMatters: "Every second of intro is a viewer you might lose. Respect their time.",
    whatToDo: "Start with your hook, not your intro. 'What's up everyone' can come 30 seconds in.",
  },
  unclear_promise: {
    label: "Promise unclear",
    description: "Viewers weren't sure what they would get from continuing",
    whyItMatters: "If viewers don't know the destination, they won't enjoy the journey.",
    whatToDo: "State exactly what viewers will learn/see/experience within the first 10 seconds.",
  },
};

/**
 * Get human-readable label for a retention event code
 */
export function getRetentionLabel(code: string | null | undefined): string {
  if (!code) return "Unknown";
  const entry = RETENTION_LABELS[code as RetentionEventCode];
  return entry?.label ?? formatCodeAsLabel(code);
}

/**
 * Get full description for a retention event
 */
export function getRetentionDescription(code: string | null | undefined): string {
  if (!code) return "We couldn't determine the specific cause.";
  const entry = RETENTION_LABELS[code as RetentionEventCode];
  return entry?.description ?? "Viewers left at this point in the video.";
}

/**
 * Get 'why it matters' explanation
 */
export function getWhyItMatters(code: string | null | undefined): string {
  if (!code) return "Understanding why viewers leave helps you create more engaging content.";
  const entry = RETENTION_LABELS[code as RetentionEventCode];
  return entry?.whyItMatters ?? "This moment is significant for your retention curve.";
}

/**
 * Get actionable advice for fixing this type of drop-off
 */
export function getWhatToDo(code: string | null | undefined): string {
  if (!code) return "Review this section of your video and look for pacing or engagement issues.";
  const entry = RETENTION_LABELS[code as RetentionEventCode];
  return entry?.whatToDo ?? "Consider adding pattern interrupts or tightening the pacing around this moment.";
}

/**
 * Convert snake_case code to Title Case (fallback)
 */
function formatCodeAsLabel(code: string): string {
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Map old API reason codes to human labels
 */
export function formatReasonHuman(reason: string | null | undefined): {
  label: string;
  description: string;
  whyItMatters: string;
  whatToDo: string;
} {
  // Map API codes to our standard codes
  const codeMap: Record<string, RetentionEventCode> = {
    steepest_drop: "steepest_drop",
    crossed_50: "crossed_50",
    hook_end: "hook_end",
    intro_end: "intro_end",
    payoff_delayed: "payoff_delayed",
    topic_shift: "topic_shift",
  };

  const mappedCode = reason ? codeMap[reason] : undefined;
  
  return {
    label: getRetentionLabel(mappedCode),
    description: getRetentionDescription(mappedCode),
    whyItMatters: getWhyItMatters(mappedCode),
    whatToDo: getWhatToDo(mappedCode),
  };
}

