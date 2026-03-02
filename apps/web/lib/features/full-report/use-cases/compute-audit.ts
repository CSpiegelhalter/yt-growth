import type { AuditItem, VideoSignals } from "../types";

type CheckDef = {
  criterion: string;
  passed: boolean;
  passDetail: string;
  failDetail: string;
  failAction: string;
};

function toItem(def: CheckDef): AuditItem {
  return {
    criterion: def.criterion,
    passed: def.passed,
    detail: def.passed ? def.passDetail : def.failDetail,
    action: def.passed ? null : def.failAction,
  };
}

export function computeDeterministicAudits(signals: VideoSignals): AuditItem[] {
  const tl = signals.titleLength;
  const hc = signals.hashtagCount;
  const dl = signals.descriptionLinkCount;
  const cc = signals.ctaCount;

  const checks: CheckDef[] = [
    {
      criterion: "Title Length",
      passed: tl >= 30 && tl <= 70,
      passDetail: `Title is ${tl} characters — within optimal range`,
      failDetail: `Title is ${tl} characters — aim for 40-70 for best CTR`,
      failAction: "Adjust title length to 40-70 characters",
    },
    {
      criterion: "Captions",
      passed: signals.hasCaptions,
      passDetail: "Video has captions — boosts accessibility and SEO",
      failDetail: "No captions found — add subtitles for +80% discoverability",
      failAction: "Add captions or subtitles",
    },
    {
      criterion: "Timestamps",
      passed: signals.hasTimestamps,
      passDetail: "Description includes timestamps — helps navigation",
      failDetail: "No timestamps in description — add chapter markers",
      failAction: "Add timestamps to description",
    },
    {
      criterion: "Hashtags",
      passed: hc >= 3,
      passDetail: `${hc} hashtags found — good for discovery`,
      failDetail: `Only ${hc} hashtag${hc === 1 ? "" : "s"} — add 3-5 relevant hashtags`,
      failAction: "Add 3-5 relevant hashtags",
    },
    {
      criterion: "Description Links",
      passed: dl >= 1,
      passDetail: `${dl} link${dl === 1 ? "" : "s"} in description — driving traffic`,
      failDetail: "No links in description — add relevant links",
      failAction: "Add relevant links to description",
    },
    {
      criterion: "Call to Action",
      passed: cc >= 1,
      passDetail: `${cc} CTA${cc === 1 ? "" : "s"} detected in transcript`,
      failDetail: "No call to action found — add subscribe/engagement CTA",
      failAction: "Add a subscribe or engagement CTA",
    },
  ];

  return checks.map(toItem);
}
