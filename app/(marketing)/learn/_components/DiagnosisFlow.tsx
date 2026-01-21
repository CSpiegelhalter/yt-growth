/**
 * DiagnosisFlow - Decision tree for diagnosing channel issues
 * Server component - no client JS required
 */

import Link from "next/link";

type DiagnosisBranch = {
  condition: string;
  why: string;
  actions: readonly string[];
  link: {
    href: string;
    label: string;
  };
};

type Props = {
  branches: readonly DiagnosisBranch[];
};

export function DiagnosisFlow({ branches }: Props) {
  return (
    <div className="diagnosisFlow">
      {branches.map((branch, index) => (
        <div key={index} className="diagnosisFlow__branch">
          <h4 className="diagnosisFlow__condition">
            <ConditionIcon />
            {branch.condition}
          </h4>
          <p className="diagnosisFlow__why">{branch.why}</p>
          <ul className="diagnosisFlow__actions">
            {branch.actions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
          <Link href={branch.link.href} className="diagnosisFlow__link">
            {branch.link.label}
            <ArrowIcon />
          </Link>
        </div>
      ))}
    </div>
  );
}

function ConditionIcon() {
  return (
    <svg
      className="diagnosisFlow__conditionIcon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Pre-defined diagnosis branches for the YouTube Channel Audit guide
export const DIAGNOSIS_BRANCHES: DiagnosisBranch[] = [
  {
    condition: "If impressions are low",
    why: "YouTube isn't recommending your content. This is often a niche, topic, or SEO problem.",
    actions: [
      "Pick a clearer niche and commit to 20 or more videos in it",
      "Research what competitors rank for and create your take",
      "Optimize titles and descriptions for search terms people actually use",
    ],
    link: {
      href: "/learn/youtube-seo",
      label: "Learn YouTube SEO strategies",
    },
  },
  {
    condition: "If impressions are fine but CTR is low",
    why: "YouTube is showing your videos but people aren't clicking. This is a packaging problem.",
    actions: [
      "Study thumbnails of top videos in your niche. What makes them click?",
      "Test 2 to 3 completely different thumbnail styles on one video",
      "Rewrite titles to add curiosity or clarify the benefit",
    ],
    link: {
      href: "/learn/youtube-thumbnail-best-practices",
      label: "Master thumbnail design",
    },
  },
  {
    condition: "If CTR is fine but retention drops fast",
    why: "People click but leave quickly. Your hook isn't delivering on the promise, or your content drags.",
    actions: [
      "Cut the intro. Start with the payoff or a strong curiosity hook.",
      "Use YouTube Editor to trim slow sections",
      "Watch your video at 2x speed and cut anything you'd skip",
    ],
    link: {
      href: "/learn/youtube-retention-analysis",
      label: "Fix retention problems",
    },
  },
  {
    condition: "If retention is good but growth is slow",
    why: "Your content is solid but you need more momentum. Focus on consistency, community, and discoverability.",
    actions: [
      "Commit to a realistic upload schedule and stick to it",
      "Add end screens and cards to keep viewers watching",
      "Reply to comments, build community, consider series content",
    ],
    link: {
      href: "/learn/how-to-get-more-subscribers",
      label: "Grow your subscriber base",
    },
  },
];
