/**
 * MetricCardGrid - Displays key metrics in a visually engaging card grid
 * Server component - no client JS required
 */

type MetricCard = {
  name: string;
  tellsYou: string;
  range: string;
  ifLow: string;
};

type Props = {
  metrics: readonly MetricCard[];
};

export function MetricCardGrid({ metrics }: Props) {
  return (
    <div className="metricCardGrid">
      {metrics.map((metric) => (
        <div key={metric.name} className="metricCard">
          <h4 className="metricCard__name">
            <MetricIcon />
            {metric.name}
          </h4>
          <p className="metricCard__tells">{metric.tellsYou}</p>
          <span className="metricCard__range">{metric.range}</span>
          <p className="metricCard__action">
            <strong>If low:</strong> {metric.ifLow}
          </p>
        </div>
      ))}
    </div>
  );
}

function MetricIcon() {
  return (
    <svg
      className="metricCard__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

// Pre-defined metrics for the YouTube Channel Audit guide
export const AUDIT_METRICS: MetricCard[] = [
  {
    name: "Impressions and CTR",
    tellsYou: "Whether YouTube is showing your videos and whether people click when they see them.",
    range: "CTR typically 2 to 10% depending on traffic source",
    ifLow: "Run 2 to 3 packaging variants (new thumbnail or title) and compare against top competitors in your niche.",
  },
  {
    name: "Avg View Duration",
    tellsYou: "How long viewers stay, and whether your hook is working. Pay special attention to the first 30 seconds.",
    range: "40% or more of video length with minimal early drop",
    ifLow: "Rewatch your first 30 seconds. Cut the setup and lead with value or curiosity.",
  },
  {
    name: "Returning Viewers",
    tellsYou: "Whether people come back for more. A proxy for viewer satisfaction.",
    range: "Growing ratio of returning vs new viewers",
    ifLow: "Nail your niche, end videos with a clear next video CTA, build series content.",
  },
  {
    name: "Watch Time",
    tellsYou: "How much watch time you contribute, both per video and to overall YouTube sessions.",
    range: "Higher is better. Compare to similar length videos.",
    ifLow: "Tighten edits, remove drag sections, link to your other videos with end screens.",
  },
  {
    name: "Browse vs Search Traffic",
    tellsYou: "Where your views come from. Browse means YouTube is recommending you. Search means you rank for terms.",
    range: "Healthy channels have a mix. Growing browse is a good sign.",
    ifLow: "If only search, focus on CTR and retention to unlock browse. If only browse, add searchable topics.",
  },
  {
    name: "End Screen Clicks",
    tellsYou: "Whether viewers binge your content after watching.",
    range: "Higher click through means stronger channel flywheel",
    ifLow: "Add end screens to every video, create playlists, verbally recommend your next video.",
  },
];
