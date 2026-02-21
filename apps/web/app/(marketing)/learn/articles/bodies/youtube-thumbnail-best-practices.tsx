/**
 * Body content for YouTube Thumbnail Best Practices article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { useId } from "react";
import { BRAND } from "@/lib/shared/brand";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";
import u from "./youtube-thumbnail-best-practices.module.css";

export const { meta, toc } = articleExports(LEARN_ARTICLES["youtube-thumbnail-best-practices"]);

/* ============================================================================
 * THUMBNAIL COMPARISON COMPONENT
 * Responsive: Good first on mobile (stacked), Bad left / Good right on desktop
 * ============================================================================ */

type ComparisonExample = {
  title: string;
  badHeadline: string;
  badBullets: string[];
  goodHeadline: string;
  goodBullets: string[];
  badVisual: React.ReactNode;
  goodVisual: React.ReactNode;
};

function ThumbnailComparison({ example }: { example: ComparisonExample }) {
  return (
    <div className={u.comparison}>
      <h3 className={u.comparisonTitle}>{example.title}</h3>
      <div className={u.comparisonGrid}>
        {/* Bad column */}
        <div className={`${u.comparisonColumn} ${u.comparisonColumnBad} ${u.comparisonBad}`}>
          <span className={`${u.comparisonChip} ${u.comparisonChipBad}`}>Bad</span>
          <p className={u.comparisonHeadline}>{example.badHeadline}</p>
          <div className={u.comparisonVisual}>{example.badVisual}</div>
          <ul className={u.comparisonBullets}>
            {example.badBullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
        {/* Good column */}
        <div className={`${u.comparisonColumn} ${u.comparisonColumnGood} ${u.comparisonGood}`}>
          <span className={`${u.comparisonChip} ${u.comparisonChipGood}`}>Good</span>
          <p className={u.comparisonHeadline}>{example.goodHeadline}</p>
          <div className={u.comparisonVisual}>{example.goodVisual}</div>
          <ul className={u.comparisonBullets}>
            {example.goodBullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * DETERMINISTIC SVG THUMBNAIL EXAMPLES
 * All text positioned with safe margins, viewBox 320x180 (16:9), scales responsively
 * ============================================================================ */

function BadTinyTextSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bad thumbnail example: tiny, hard-to-read text crammed into a cluttered layout"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Scattered small elements */}
      <circle cx="60" cy="50" r="20" fill="rgba(255,255,255,0.12)" />
      <rect x="100" y="35" width="70" height="24" rx="6" fill="rgba(255,255,255,0.08)" />
      <rect x="185" y="30" width="50" height="18" rx="5" fill="rgba(255,255,255,0.06)" />
      <rect x="250" y="40" width="45" height="20" rx="5" fill="rgba(255,255,255,0.08)" />
      {/* Tiny text block - positioned in safe zone but deliberately too small */}
      <rect x="24" y="90" width="200" height="50" rx="8" fill="rgba(0,0,0,0.3)" />
      <text x="34" y="108" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.8)">
        THIS IS A VERY LONG SENTENCE
      </text>
      <text x="34" y="122" fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.6)">
        WITH EVEN MORE WORDS BELOW
      </text>
      <text x="34" y="134" fontSize="8" fontWeight="500" fill="rgba(255,255,255,0.5)">
        and some smaller details here
      </text>
      {/* More clutter */}
      <circle cx="280" cy="130" r="15" fill="rgba(255,255,255,0.1)" />
      <rect x="240" y="145" width="60" height="18" rx="4" fill="rgba(255,255,255,0.07)" />
    </svg>
  );
}

function GoodBigShapesSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Good thumbnail example: one large focal shape with bold, readable text"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${id}-accent`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Single dominant focal shape */}
      <circle cx="110" cy="90" r="55" fill={`url(#${id}-accent)`} />
      <circle cx="110" cy="90" r="62" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      {/* Clear, bold text - positioned in safe zone (not overlapping bottom-right) */}
      <rect x="185" y="65" width="110" height="50" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
      <text x="240" y="98" textAnchor="middle" fontSize="28" fontWeight="900" fill="white">
        10X
      </text>
    </svg>
  );
}

function BadMultipleFocalPointsSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bad thumbnail example: multiple competing subjects with no clear focal point"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Multiple competing circles of similar size */}
      <circle cx="70" cy="60" r="28" fill="rgba(251,191,36,0.5)" />
      <circle cx="160" cy="55" r="25" fill="rgba(16,185,129,0.4)" />
      <circle cx="250" cy="65" r="26" fill="rgba(99,102,241,0.4)" />
      <circle cx="115" cy="130" r="22" fill="rgba(244,63,94,0.35)" />
      <circle cx="205" cy="125" r="24" fill="rgba(14,165,233,0.35)" />
      {/* Confused text */}
      <rect x="24" y="145" width="130" height="24" rx="6" fill="rgba(0,0,0,0.25)" />
      <text x="34" y="162" fontSize="11" fontWeight="700" fill="rgba(255,255,255,0.75)">
        WHICH ONE???
      </text>
    </svg>
  );
}

function GoodSingleFocalPointSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Good thumbnail example: single dominant subject with clear visual hierarchy"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Single dominant shape */}
      <circle cx="120" cy="90" r="55" fill={`url(#${id}-gold)`} />
      <circle cx="120" cy="90" r="62" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      {/* Supporting text in safe zone */}
      <rect x="195" y="70" width="100" height="40" rx="10" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
      <text x="245" y="98" textAnchor="middle" fontSize="22" fontWeight="900" fill="white">
        ONE
      </text>
    </svg>
  );
}

function BadLowContrastSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bad thumbnail example: low contrast where subject blends into background"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#475569" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Low contrast circle - blends in */}
      <circle cx="120" cy="90" r="50" fill="rgba(148,163,184,0.25)" />
      {/* Low contrast text */}
      <rect x="190" y="70" width="100" height="40" rx="10" fill="rgba(148,163,184,0.15)" />
      <text x="240" y="97" textAnchor="middle" fontSize="18" fontWeight="800" fill="rgba(255,255,255,0.4)">
        BLENDS
      </text>
    </svg>
  );
}

function GoodHighContrastSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Good thumbnail example: high contrast with clear subject separation"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* High contrast shape */}
      <circle cx="120" cy="90" r="50" fill={`url(#${id}-orange)`} />
      <circle cx="120" cy="90" r="58" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      {/* High contrast text */}
      <rect x="190" y="70" width="100" height="40" rx="10" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" />
      <text x="240" y="97" textAnchor="middle" fontSize="20" fontWeight="900" fill="white">
        POPS
      </text>
    </svg>
  );
}

function BadTextPlacementSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bad thumbnail example: text placed in bottom-right where YouTube duration badge overlaps"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Subject */}
      <circle cx="100" cy="80" r="40" fill="rgba(16,185,129,0.6)" />
      {/* Text in DANGER ZONE - bottom right */}
      <rect x="200" y="125" width="90" height="35" rx="8" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" />
      <text x="245" y="148" textAnchor="middle" fontSize="16" fontWeight="800" fill="white">
        TEXT
      </text>
      {/* YouTube duration badge overlay */}
      <rect x="252" y="148" width="56" height="24" rx="4" fill="rgba(0,0,0,0.8)" />
      <text x="280" y="165" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">
        12:34
      </text>
    </svg>
  );
}

function GoodTextPlacementSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Good thumbnail example: text placed in safe zone away from YouTube overlays"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${id}-green`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Subject */}
      <circle cx="100" cy="95" r="45" fill={`url(#${id}-green)`} />
      <circle cx="100" cy="95" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      {/* Text in SAFE ZONE - top area */}
      <rect x="170" y="30" width="120" height="42" rx="10" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
      <text x="230" y="58" textAnchor="middle" fontSize="20" fontWeight="900" fill="white">
        CLEAR
      </text>
      {/* YouTube duration badge - not overlapping */}
      <rect x="252" y="148" width="56" height="24" rx="4" fill="rgba(0,0,0,0.7)" />
      <text x="280" y="165" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">
        12:34
      </text>
    </svg>
  );
}

function BadRedColorSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Bad thumbnail example: heavy red color that blends with YouTube's UI"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#dc2626" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* White subject on red */}
      <circle cx="110" cy="85" r="45" fill="white" />
      <rect x="175" y="60" width="110" height="50" rx="10" fill="rgba(255,255,255,0.95)" />
      <text x="230" y="93" textAnchor="middle" fontSize="20" fontWeight="900" fill="#dc2626">
        RED BAD
      </text>
      {/* Simulated YouTube red bar at bottom */}
      <rect x="0" y="175" width="320" height="5" fill="#ff0000" opacity="0.8" />
    </svg>
  );
}

function GoodBogyColorSvg() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Good thumbnail example: BOGY colors (Blue/Orange/Green/Yellow) that stand out from YouTube's UI"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="320" y2="180">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      {/* Blue focal point - stands out from YouTube red */}
      <circle cx="110" cy="90" r="50" fill={`url(#${id}-blue)`} />
      <circle cx="110" cy="90" r="57" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      {/* Orange accent text - complementary, not red */}
      <rect x="180" y="65" width="115" height="50" rx="12" fill="rgba(251,146,60,0.95)" />
      <text x="237" y="98" textAnchor="middle" fontSize="22" fontWeight="900" fill="white">
        STANDS
      </text>
      {/* Small green accent */}
      <circle cx="260" cy="145" r="12" fill="#22c55e" />
    </svg>
  );
}

function ThumbnailFormulaDiagram() {
  const id = useId();
  return (
    <div className={u.diagramWrap}>
      <svg
        viewBox="0 0 560 280"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Thumbnail formula diagram: one focal subject plus contrast plus optional 2-4 word text creates effective thumbnails"
      >
        <defs>
          <linearGradient id={`${id}-thumbGrad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0f172a" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
          <linearGradient id={`${id}-accent`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Thumbnail mockup - 16:9 aspect */}
        <rect x="18" y="40" width="320" height="180" rx="16" fill={`url(#${id}-thumbGrad)`} />

        {/* Contrast split visualization */}
        <path d="M18 40 L178 40 L178 220 L18 220 Z" fill="rgba(255,255,255,0.05)" />
        <path d="M178 40 L338 40 L338 220 L178 220 Z" fill="rgba(0,0,0,0.15)" />

        {/* Focal subject - positioned at rule-of-thirds intersection */}
        <circle cx="115" cy="130" r="50" fill={`url(#${id}-accent)`} opacity="0.95" />
        <circle cx="115" cy="130" r="58" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />

        {/* Optional text - positioned in safe zone (not bottom-right) */}
        <rect x="200" y="105" width="115" height="50" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.18)" />
        <text x="257" y="137" textAnchor="middle" fontSize="18" fontWeight="800" fill="white">
          2–4 WORDS
        </text>

        {/* Label: Focal subject */}
        <line x1="115" y1="65" x2="115" y2="40" stroke="#6366f1" strokeWidth="2" />
        <circle cx="115" cy="65" r="4" fill="#6366f1" />
        <text x="115" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6366f1">
          Focal subject
        </text>

        {/* Label: Contrast */}
        <line x1="178" y1="235" x2="178" y2="220" stroke="#8b5cf6" strokeWidth="2" />
        <circle cx="178" cy="235" r="4" fill="#8b5cf6" />
        <text x="178" y="252" textAnchor="middle" fontSize="11" fontWeight="700" fill="#8b5cf6">
          Contrast / separation
        </text>

        {/* Label: Text placement - positioned below the thumbnail */}
        <line x1="257" y1="165" x2="257" y2="220" stroke="#0ea5e9" strokeWidth="2" />
        <circle cx="257" cy="165" r="4" fill="#0ea5e9" />
        <text x="257" y="237" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0ea5e9">
          Safe zone for text
        </text>

        {/* Formula text - right side, stacked with clear spacing */}
        <text x="380" y="50" fontSize="11" fontWeight="700" fill="#64748b" letterSpacing="0.05em">
          THE FORMULA
        </text>
        <text x="380" y="80" fontSize="15" fontWeight="800" fill="#0f172a">
          One idea
        </text>
        <text x="380" y="102" fontSize="15" fontWeight="700" fill="#94a3b8">
          +
        </text>
        <text x="380" y="124" fontSize="15" fontWeight="800" fill="#0f172a">
          One focal point
        </text>
        <text x="380" y="146" fontSize="15" fontWeight="700" fill="#94a3b8">
          +
        </text>
        <text x="380" y="168" fontSize="15" fontWeight="800" fill="#0f172a">
          Emotion / contrast
        </text>
        <text x="380" y="198" fontSize="11" fontWeight="600" fill="#64748b">
          (Text only if it adds meaning.)
        </text>
      </svg>
    </div>
  );
}

function TinyTextAntVisual() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 480 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Illustration showing tiny text on a thumbnail that requires a magnifying glass to read"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1f2937" />
        </linearGradient>
      </defs>

      {/* Thumbnail mock with tiny unreadable text */}
      <rect x="20" y="30" width="180" height="100" rx="10" fill={`url(#${id}-bg)`} />
      <rect x="32" y="46" width="70" height="10" rx="5" fill="rgba(255,255,255,0.18)" />
      <rect x="32" y="62" width="110" height="8" rx="4" fill="rgba(255,255,255,0.10)" />
      <rect x="32" y="76" width="130" height="8" rx="4" fill="rgba(255,255,255,0.10)" />
      <rect x="32" y="90" width="90" height="8" rx="4" fill="rgba(255,255,255,0.10)" />
      <text x="155" y="118" textAnchor="end" fontSize="6" fontWeight="600" fill="rgba(255,255,255,0.45)">
        tiny text
      </text>

      {/* Clear magnifying glass */}
      <circle cx="340" cy="80" r="60" fill="white" stroke="#d1d5db" strokeWidth="4" />
      <circle cx="340" cy="80" r="48" fill="#f9fafb" />
      <line x1="385" y1="125" x2="440" y2="180" stroke="#6b7280" strokeWidth="16" strokeLinecap="round" />
      <line x1="385" y1="125" x2="440" y2="180" stroke="#9ca3af" strokeWidth="11" strokeLinecap="round" />
      
      {/* Zoomed text inside glass - still hard to read */}
      <text x="340" y="74" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6b7280">
        still can't
      </text>
      <text x="340" y="92" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6b7280">
        read it!
      </text>

      {/* Arrow from thumbnail to magnifier */}
      <path d="M210 80 L270 80" stroke="#9ca3af" strokeWidth="2" strokeDasharray="5 4" />
      <polygon points="270,75 285,80 270,85" fill="#9ca3af" />

      {/* Message - positioned below with clear spacing */}
      <text x="240" y="205" textAnchor="middle" fontSize="14" fontWeight="700" fill="#6366f1">
        If it needs a magnifying glass, it's too small.
      </text>
    </svg>
  );
}

function JunkDrawerVsShelfVisual() {
  return (
    <svg
      viewBox="0 0 520 240"
      role="img"
      aria-label="Diagram comparing a cluttered thumbnail to a clean thumbnail"
    >
      <defs>
        <linearGradient id="drawer" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fee2e2" />
          <stop offset="1" stopColor="#fef2f2" />
        </linearGradient>
        <linearGradient id="shelf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dcfce7" />
          <stop offset="1" stopColor="#f0fdf4" />
        </linearGradient>
      </defs>

      {/* Left: junk drawer */}
      <rect x="16" y="30" width="232" height="164" rx="16" fill="url(#drawer)" stroke="#fecaca" />
      <text x="28" y="56" fontSize="12" fontWeight="800" fill="#991b1b">
        Clutter
      </text>
      {[
        [40, 74, 40, 18],
        [92, 74, 54, 18],
        [156, 74, 70, 18],
        [40, 104, 74, 18],
        [122, 104, 44, 18],
        [172, 104, 54, 18],
        [40, 134, 54, 18],
        [100, 134, 60, 18],
        [170, 134, 56, 18],
      ].map(([x, y, w, h], idx) => (
        <rect key={idx} x={x} y={y} width={w} height={h} rx="8" fill="rgba(153,27,27,0.10)" stroke="rgba(153,27,27,0.15)" />
      ))}
      <circle cx="66" cy="168" r="12" fill="rgba(153,27,27,0.18)" />
      <circle cx="104" cy="166" r="8" fill="rgba(153,27,27,0.12)" />
      <circle cx="196" cy="170" r="10" fill="rgba(153,27,27,0.14)" />

      {/* Right: clean shelf */}
      <rect x="272" y="30" width="232" height="164" rx="16" fill="url(#shelf)" stroke="#bbf7d0" />
      <text x="284" y="56" fontSize="12" fontWeight="800" fill="#065f46">
        One focal point
      </text>
      <rect x="288" y="76" width="200" height="10" rx="5" fill="rgba(6,95,70,0.10)" />
      <rect x="288" y="96" width="140" height="10" rx="5" fill="rgba(6,95,70,0.08)" />
      <circle cx="364" cy="146" r="34" fill="rgba(16,185,129,0.25)" />
      <circle cx="364" cy="146" r="24" fill="rgba(16,185,129,0.38)" />
      <rect x="410" y="128" width="78" height="36" rx="12" fill="rgba(6,95,70,0.12)" stroke="rgba(6,95,70,0.14)" />
      <text x="449" y="150" textAnchor="middle" fontSize="14" fontWeight="900" fill="#065f46">
        CLEAR
      </text>

      <path d="M248 112h24" stroke="#64748b" strokeWidth="2" />
      <path d="M256 104l8 8-8 8" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="248" y="214" fontSize="12" fontWeight="600" fill="#475569">
        Same idea, different readability.
      </text>
    </svg>
  );
}

function TextDecisionFlow() {
  return (
    <div className={u.flow} aria-label="Decision flow for when to use thumbnail text">
      <svg viewBox="0 0 700 260" role="img" aria-label="Decision flowchart for thumbnail text">
        <defs>
          <linearGradient id="box" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#f8fafc" />
          </linearGradient>
        </defs>

        <rect x="20" y="24" width="300" height="56" rx="14" fill="url(#box)" stroke="#e2e8f0" />
        <text x="170" y="58" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">
          Does the image communicate the idea?
        </text>

        <path d="M170 80v30" stroke="#94a3b8" strokeWidth="2" />
        <path d="M170 110h-80" stroke="#94a3b8" strokeWidth="2" />
        <path d="M170 110h80" stroke="#94a3b8" strokeWidth="2" />
        <path d="M90 110v18" stroke="#94a3b8" strokeWidth="2" />
        <path d="M250 110v18" stroke="#94a3b8" strokeWidth="2" />

        <text x="90" y="104" textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748b">
          Yes
        </text>
        <text x="250" y="104" textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748b">
          No
        </text>

        <rect x="20" y="128" width="240" height="62" rx="14" fill="#ecfdf5" stroke="#bbf7d0" />
        <text x="140" y="156" textAnchor="middle" fontSize="14" fontWeight="800" fill="#065f46">
          Skip text
        </text>
        <text x="140" y="176" textAnchor="middle" fontSize="12" fontWeight="600" fill="#065f46" opacity="0.9">
          Let the image do the work
        </text>

        <rect x="310" y="128" width="370" height="62" rx="14" fill="#eff6ff" stroke="#bfdbfe" />
        <text x="495" y="156" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1d4ed8">
          Add 2–4 words (only missing context)
        </text>
        <text x="495" y="176" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1d4ed8" opacity="0.9">
          Huge, high-contrast, not repeating the title
        </text>

        <path d="M495 190v28" stroke="#94a3b8" strokeWidth="2" />
        <rect x="310" y="218" width="370" height="30" rx="12" fill="#ffffff" stroke="#e2e8f0" />
        <text x="495" y="238" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
          Position away from the bottom-right duration badge
        </text>
      </svg>
    </div>
  );
}

function CompositionMiniGuide() {
  return (
    <div className={u.miniGuide}>
      <div className={u.miniGuideCard}>
        <h3 className={u.miniGuideTitle}>Foreground / background separation</h3>
        <p className={u.miniGuideText}>
          Make the subject pop with a bright edge, a shadow, or a clean color break.
          If the subject blends in, the scroll wins.
        </p>
        <svg viewBox="0 0 360 160" role="img" aria-label="Foreground and background separation example">
          <defs>
            <linearGradient id="bgA" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0f172a" />
              <stop offset="1" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>

          <rect x="14" y="18" width="332" height="124" rx="16" fill="url(#bgA)" />
          <circle cx="120" cy="82" r="38" fill="url(#fg)" />
          <circle cx="120" cy="82" r="44" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
          <rect x="188" y="58" width="132" height="50" rx="14" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)" />
          <text x="254" y="88" textAnchor="middle" fontSize="16" fontWeight="900" fill="white">
            POPS
          </text>
        </svg>
      </div>

      <div className={u.miniGuideCard}>
        <h3 className={u.miniGuideTitle}>Rule-of-thirds framing</h3>
        <p className={u.miniGuideText}>
          Place the focal subject near an intersection. It creates “intentional” composition without feeling rigid.
        </p>
        <svg viewBox="0 0 360 160" role="img" aria-label="Rule of thirds grid overlay">
          <defs>
            <linearGradient id="bgB" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0b1220" />
              <stop offset="1" stopColor="#1f2937" />
            </linearGradient>
            <linearGradient id="accentB" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          <rect x="14" y="18" width="332" height="124" rx="16" fill="url(#bgB)" />

          {/* thirds grid */}
          <path d="M124 18v124M236 18v124" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
          <path d="M14 59h332M14 101h332" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />

          {/* subject */}
          <circle cx="236" cy="59" r="34" fill="url(#accentB)" opacity="0.95" />
          <circle cx="236" cy="59" r="40" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />

          {/* supporting object */}
          <rect x="44" y="92" width="128" height="34" rx="14" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)" />
          <text x="108" y="114" textAnchor="middle" fontSize="12" fontWeight="800" fill="white" opacity="0.92">
            SUPPORTING
          </text>
        </svg>
      </div>
    </div>
  );
}

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* 1) Hero: Thumbnails are packaging */}
      <section id="thumbnails-are-packaging" className="sectionOpen">
        <div className={u.heroIntro}>
          <p className={u.heroKicker}>Packaging that wins the click</p>
          <h2 className={s.sectionTitle}>Thumbnails are packaging</h2>

          <p className={[s.sectionText, u.leadText].join(" ")}>
            Thumbnails aren’t decoration. They’re packaging — the visual promise that earns the click before anyone hears your intro.
          </p>

          <div className={u.truthLine}>
            If the thumbnail doesn’t communicate in one second, the video doesn’t get a chance.
          </div>

          <div className={u.learnOutcomes}>
            <p className={u.learnOutcomesLabel}>What you’ll learn</p>
            <ul className={u.learnOutcomesItems}>
              <li className={u.pill}>A simple thumbnail formula you can repeat</li>
              <li className={u.pill}>What “good” looks like on mobile</li>
              <li className={u.pill}>A fast A/B testing workflow for CTR</li>
            </ul>
          </div>

          <p className={s.sectionText}>
            CTR only matters if viewers stay. After the click, retention decides whether YouTube keeps recommending you — see{" "}
            <Link href="/learn/youtube-retention-analysis">why retention matters after the click</Link>.
          </p>
        </div>
      </section>

      {/* 2) The Thumbnail Formula */}
      <section id="thumbnail-formula" className="sectionTinted">
        <h2 className={s.sectionTitle}>The Thumbnail Formula (Simple and memorable)</h2>
        <p className={s.sectionText}>
          Great thumbnails are not a list of tricks. They are a single idea communicated instantly — with one clear focal point and enough contrast to read at a glance.
        </p>

        <div className={u.formulaGrid}>
          <div className={u.formulaCard}>
            <p className={u.formulaLine}>One idea + one focal point + one emotion / contrast</p>
            <p className={u.formulaSub}>
              The viewer should be able to answer: “What is this?” and “Why should I care?” without squinting.
            </p>
          </div>
          <ThumbnailFormulaDiagram />
        </div>
      </section>

      {/* 3) What Great Thumbnails Have in Common */}
      <section id="great-thumbnails-principles" className="sectionOpen">
        <h2 className={s.sectionTitle}>What Great Thumbnails Have in Common</h2>
        <p className={s.sectionText}>
          Use these as design constraints. They keep you out of clutter and make your packaging competitive in a feed full of professionals.
        </p>

        <div className={u.principlesGrid}>
          <div className={u.principleCard}>
            <div className={u.principleTitleRow}>
              <h3 className={u.principleName}>Single focal point</h3>
            </div>
            <p className={u.principleWhy}>One dominant subject creates instant understanding and faster clicks.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Do this next</p>
              <ul className={u.doNextList}>
                <li>Make the main subject the largest element.</li>
                <li>Delete anything that competes for attention.</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <div className={u.principleTitleRow}>
              <h3 className={u.principleName}>High contrast / separation</h3>
            </div>
            <p className={u.principleWhy}>Separation keeps your subject readable in dark mode, small sizes, and busy feeds.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Do this next</p>
              <ul className={u.doNextList}>
                <li>Add a clean edge, shadow, or color break around the subject.</li>
                <li>Check the thumbnail in grayscale before publishing.</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <div className={u.principleTitleRow}>
              <h3 className={u.principleName}>Big readable shapes (mobile legibility)</h3>
            </div>
            <p className={u.principleWhy}>Most viewers see thumbnails on a phone. Tiny details don’t survive.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Do this next</p>
              <ul className={u.doNextList}>
                <li>Zoom out until the thumbnail is “postage stamp” size.</li>
                <li>Increase scale until the idea is still obvious.</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <div className={u.principleTitleRow}>
              <h3 className={u.principleName}>Emotion / tension / curiosity gap</h3>
            </div>
            <p className={u.principleWhy}>A small open loop makes a click feel like the natural next step.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Do this next</p>
              <ul className={u.doNextList}>
                <li>Show a “before vs after” or a clear contrast.</li>
                <li>Use one strong word that frames the stakes.</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <div className={u.principleTitleRow}>
              <h3 className={u.principleName}>Consistent style system (brand identity)</h3>
            </div>
            <p className={u.principleWhy}>Consistency earns returning clicks because viewers recognize you instantly.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Do this next</p>
              <ul className={u.doNextList}>
                <li>Pick a repeatable palette and type style.</li>
                <li>Keep one layout motif consistent across uploads.</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <div className={u.principleTitleRow}>
              <h3 className={u.principleName}>Text only if it adds new meaning</h3>
            </div>
            <p className={u.principleWhy}>Text should clarify the idea, not repeat the title the viewer already sees.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Do this next</p>
              <ul className={u.doNextList}>
                <li>Limit text to 2–4 words.</li>
                <li>Use it for the missing context or the “angle.”</li>
              </ul>
            </div>
          </div>
        </div>

        <p className={[s.sectionText, u.mt6].join(" ")}>
          Want ideas for what works in your niche? Study competitor packaging patterns in{" "}
          <Link href="/learn/youtube-competitor-analysis">our YouTube competitor analysis guide</Link>.
        </p>
      </section>

      {/* 4) Examples: Good vs Bad (comparison layout) */}
      <section id="good-vs-bad-examples" className="sectionTinted">
        <h2 className={s.sectionTitle}>Examples: Good vs Bad</h2>
        <p className={s.sectionText}>
          These mock designs illustrate common thumbnail mistakes and their fixes. On mobile, the Good example appears first for better UX; on desktop, Bad is on the left and Good on the right for easy comparison.
        </p>

        <div className={u.gallery}>
          <ThumbnailComparison
            example={{
              title: "Tiny text vs big readable shapes",
              badHeadline: "Cramming sentences into a thumbnail",
              badBullets: [
                "Text is too small to read on mobile",
                "Multiple lines compete for attention",
                "Clutter from scattered elements",
              ],
              goodHeadline: "One bold shape + one short word",
              goodBullets: [
                "Focal point is immediately clear",
                "Text is readable at any size",
                "Clean separation from background",
              ],
              badVisual: <BadTinyTextSvg />,
              goodVisual: <GoodBigShapesSvg />,
            }}
          />

          <ThumbnailComparison
            example={{
              title: "One focal point vs competing subjects",
              badHeadline: "Multiple elements fighting for attention",
              badBullets: [
                "Eye doesn't know where to land",
                "Similar-sized elements create confusion",
                "No clear visual hierarchy",
              ],
              goodHeadline: "Single dominant subject",
              goodBullets: [
                "One hero element draws the eye",
                "Supporting elements are clearly secondary",
                "Instant understanding of the topic",
              ],
              badVisual: <BadMultipleFocalPointsSvg />,
              goodVisual: <GoodSingleFocalPointSvg />,
            }}
          />

          <ThumbnailComparison
            example={{
              title: "Low contrast vs clean separation",
              badHeadline: "Subject blends into background",
              badBullets: [
                "Hard to distinguish on small screens",
                "Gets lost in busy feeds",
                "Fails in dark mode",
              ],
              goodHeadline: "High contrast pops off the page",
              goodBullets: [
                "Strong edge separation",
                "Readable in any context",
                "Works across light and dark modes",
              ],
              badVisual: <BadLowContrastSvg />,
              goodVisual: <GoodHighContrastSvg />,
            }}
          />

          <ThumbnailComparison
            example={{
              title: "Bad text placement vs safe zones",
              badHeadline: "Text covered by YouTube duration badge",
              badBullets: [
                "Bottom-right area blocked by timestamp",
                "Important text gets hidden",
                "Looks unprofessional in feed",
              ],
              goodHeadline: "Text in safe area (top or left)",
              goodBullets: [
                "Avoids YouTube UI overlay zones",
                "All content visible at all times",
                "Professional, intentional placement",
              ],
              badVisual: <BadTextPlacementSvg />,
              goodVisual: <GoodTextPlacementSvg />,
            }}
          />

          <ThumbnailComparison
            example={{
              title: "Red thumbnails vs BOGY colors",
              badHeadline: "Heavy red blends with YouTube UI",
              badBullets: [
                "Merges with YouTube's red branding",
                "Lower visual salience in feed",
                "Progress bar blends into design",
              ],
              goodHeadline: "Blue/Orange/Green/Yellow stand out",
              goodBullets: [
                "Contrasts against YouTube's red UI",
                "Higher salience in recommended feed",
                "Colors pop, not blend",
              ],
              badVisual: <BadRedColorSvg />,
              goodVisual: <GoodBogyColorSvg />,
            }}
          />
        </div>
      </section>

      {/* 5) Funny visuals (tasteful, still useful) */}
      <section id="playful-visuals" className="sectionOpen">
        <h2 className={s.sectionTitle}>Two quick visuals to keep you honest</h2>
        <p className={s.sectionText}>
          Thumbnails are judged at scroll speed. If you design at “editing zoom,” you accidentally build thumbnails that only work for the creator.
        </p>

        <div className={u.playfulGrid}>
          <div className={u.playfulCard}>
            <h3 className={u.playfulTitle}>Tiny text problem</h3>
            <p className={u.playfulText}>
              If your core promise needs reading time, it will lose to a thumbnail that communicates with shapes.
            </p>
            <TinyTextAntVisual />
          </div>

          <div className={u.playfulCard}>
            <h3 className={u.playfulTitle}>Clutter problem</h3>
            <p className={u.playfulText}>
              A cluttered thumbnail feels like homework. A clean one feels like a confident promise.
            </p>
            <JunkDrawerVsShelfVisual />
          </div>
        </div>
      </section>

      {/* 6) Thumbnail text */}
      <section id="thumbnail-text" className="sectionOpen">
        <h2 className={s.sectionTitle}>Thumbnail Text: When to use it (and how)</h2>
        <p className={s.sectionText}>
          Text is a tool, not a requirement. Use it when the image alone can’t communicate the idea fast enough.
        </p>

        <TextDecisionFlow />

        <div className={u.chipSets}>
          <div className={u.chipSet}>
            <p className={u.chipSetTitle}>Good text snippets (short, specific, readable)</p>
            <ul className={u.chipList}>
              <li className={[u.chip, u.chipGood].join(" ")}>THE FIX</li>
              <li className={[u.chip, u.chipGood].join(" ")}>10X FASTER</li>
              <li className={[u.chip, u.chipGood].join(" ")}>STOP THIS</li>
              <li className={[u.chip, u.chipGood].join(" ")}>BEFORE / AFTER</li>
              <li className={[u.chip, u.chipGood].join(" ")}>NO MORE</li>
            </ul>
          </div>

          <div className={u.chipSet}>
            <p className={u.chipSetTitle}>Bad text snippets (too long, too vague, too repetitive)</p>
            <ul className={u.chipList}>
              <li className={[u.chip, u.chipBad].join(" ")}>THIS VIDEO WILL CHANGE YOUR LIFE</li>
              <li className={[u.chip, u.chipBad].join(" ")}>HOW TO DO THE THING</li>
              <li className={[u.chip, u.chipBad].join(" ")}>WATCH UNTIL THE END</li>
              <li className={[u.chip, u.chipBad].join(" ")}>BEST TIPS FOR BEGINNERS</li>
              <li className={[u.chip, u.chipBad].join(" ")}>YOU WON'T BELIEVE WHAT HAPPENS</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7) Color & composition */}
      <section id="color-and-composition" className="sectionOpen">
        <h2 className={s.sectionTitle}>Color Strategy & Composition</h2>
        <p className={s.sectionText}>
          You don’t need theory. You need a few repeatable moves that create separation and intentional framing.
        </p>

        {/* BOGY Color Strategy */}
        <div className={u.colorStrategy}>
          <div className={u.colorCard}>
            <h3 className={u.colorCardTitle}>The BOGY Palette (recommended)</h3>
            <p className={u.colorCardText}>
              Use <strong>Blue, Orange, Green, or Yellow</strong> as your primary accent colors. These create strong contrast against YouTube's interface, making your thumbnail stand out in recommended feeds and search results.
            </p>
            <div className={u.paletteRow}>
              <div className={u.paletteSwatch}>
                <span className={u.paletteDot} style={{ background: "#3b82f6" }} />
                Blue
              </div>
              <div className={u.paletteSwatch}>
                <span className={u.paletteDot} style={{ background: "#f97316" }} />
                Orange
              </div>
              <div className={u.paletteSwatch}>
                <span className={u.paletteDot} style={{ background: "#22c55e" }} />
                Green
              </div>
              <div className={u.paletteSwatch}>
                <span className={u.paletteDot} style={{ background: "#eab308" }} />
                Yellow
              </div>
            </div>
          </div>

          <div className={`${u.colorCard} ${u.avoidCard}`}>
            <h3 className={u.colorCardTitle}>Avoid Heavy Red</h3>
            <p className={u.colorCardText}>
              Red-dominant thumbnails blend into YouTube's branding: the logo, subscribe buttons, notification dots, and progress bars are all red. This reduces your visual salience—the thumbnail competes with the UI instead of standing out.
            </p>
            <div className={u.avoidVisual}>
              <div className={u.avoidItem}>
                <div className={u.avoidSwatch} style={{ background: "#ff0000" }} />
                YouTube red
              </div>
              <div className={u.avoidItem}>
                <div className={u.avoidSwatch} style={{ background: "#cc0000" }} />
                Subscribe btn
              </div>
              <div className={u.avoidItem}>
                <div className={u.avoidSwatch} style={{ background: "#f00" }} />
                Progress bar
              </div>
            </div>
          </div>
        </div>

        <p className={[s.sectionText, u.mt6].join(" ")}>
          <strong>Why this matters:</strong> Thumbnails are judged in milliseconds while scrolling. Colors that contrast with the platform UI have higher visual salience. This is especially important on mobile, where thumbnails appear smaller and compete directly with YouTube's red accents.
        </p>

        <CompositionMiniGuide />
      </section>

      {/* 8) A/B testing & iteration */}
      <section id="ab-testing-and-iteration" className="sectionTinted">
        <h2 className={s.sectionTitle}>A/B Testing & Iteration (packaging workflow)</h2>
        <p className={s.sectionText}>
          Treat packaging like a workflow. Don’t “tweak forever.” Test one variable at a time, measure CTR, keep winners.
        </p>

        <div className={u.principlesGrid}>
          <div className={u.principleCard}>
            <h3 className={u.principleName}>Baseline vs new packaging test</h3>
            <p className={u.principleWhy}>
              Start with a baseline CTR after the video gets real impressions. Then swap packaging and compare the trend.
            </p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>What to do</p>
              <ul className={u.doNextList}>
                <li>Wait for meaningful impressions (not minutes).</li>
                <li>Compare like-for-like traffic sources when possible.</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <h3 className={u.principleName}>What to test (one variable)</h3>
            <p className={u.principleWhy}>If you change five things, you learn nothing. Change one meaningful variable.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Pick one</p>
              <ul className={u.doNextList}>
                <li>Focal subject size</li>
                <li>Text: none vs 2–4 words</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <h3 className={u.principleName}>When to change thumbnails</h3>
            <p className={u.principleWhy}>Swap when CTR is underperforming relative to your typical baseline.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Signals</p>
              <ul className={u.doNextList}>
                <li>Stable impressions, low CTR</li>
                <li>High early drop in retention (promise mismatch)</li>
              </ul>
            </div>
          </div>

          <div className={u.principleCard}>
            <h3 className={u.principleName}>Research competitor packaging patterns</h3>
            <p className={u.principleWhy}>You are competing in the feed, not in a vacuum.</p>
            <div className={u.doNext}>
              <p className={u.doNextLabel}>Do this next</p>
              <ul className={u.doNextList}>
                <li>Screenshot the top results for your keyword.</li>
                <li>Extract 2–3 patterns you can test.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={u.sprint}>
          <p className={u.sprintTitle}>Packaging Sprint (10 minutes)</p>
          <p className={u.sprintText}>
            A fast way to generate three real thumbnail options without spiraling into perfection.
          </p>
          <ol className={u.sprintSteps}>
            <li className={u.sprintStep}>
              <strong>2 minutes:</strong> Write the one-sentence promise (what the viewer gets).
            </li>
            <li className={u.sprintStep}>
              <strong>3 minutes:</strong> Sketch three compositions (focal subject + contrast + optional text).
            </li>
            <li className={u.sprintStep}>
              <strong>3 minutes:</strong> Make “big shape” versions (remove detail, increase scale).
            </li>
            <li className={u.sprintStep}>
              <strong>2 minutes:</strong> Pick one variable to test (text, subject size, or contrast).
            </li>
          </ol>
        </div>

        <p className={[s.sectionText, u.mt6].join(" ")}>
          If you have access to YouTube’s “Test &amp; Compare,” use it. If not, manual swaps still work — just give each version enough time and impressions.
        </p>
      </section>

      {/* 9) Common mistakes table */}
      <section id="common-mistakes-that-kill-ctr" className="sectionOpen">
        <h2 className={s.sectionTitle}>Common Mistakes That Kill CTR</h2>
        <p className={s.sectionText}>
          Most thumbnails fail in predictable ways. Fixing one of these is often enough to move CTR.
        </p>

        <div className={u.tableWrap}>
          <div className={u.tableScroll}>
            <table className={u.table}>
              <thead>
                <tr>
                  <th>Mistake</th>
                  <th>What it causes</th>
                  <th>Fix</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Clutter</strong></td>
                  <td>Viewer can’t decode the idea fast enough.</td>
                  <td>Remove elements until one subject dominates.</td>
                </tr>
                <tr>
                  <td><strong>Low contrast</strong></td>
                  <td>Subject blends into background, especially on mobile.</td>
                  <td>Add separation (edge, shadow, color break).</td>
                </tr>
                <tr>
                  <td><strong>Tiny text</strong></td>
                  <td>Promise is unreadable at scroll speed.</td>
                  <td>Use 2–4 words max, huge and high-contrast.</td>
                </tr>
                <tr>
                  <td><strong>Mismatched promise</strong></td>
                  <td>Click happens, then retention drops quickly.</td>
                  <td>Make the opening deliver the thumbnail promise fast.</td>
                </tr>
                <tr>
                  <td><strong>Too many faces/objects</strong></td>
                  <td>No clear focal point; attention splits.</td>
                  <td>Choose one hero subject and simplify the rest.</td>
                </tr>
                <tr>
                  <td><strong>Inconsistent style</strong></td>
                  <td>Returning viewers don’t recognize your videos.</td>
                  <td>Build a repeatable palette + layout motif.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className={[s.sectionText, u.mt6].join(" ")}>
          If impressions are strong but CTR is low, packaging is the bottleneck. If CTR is strong but the video stalls, the bottleneck is inside the video — start with{" "}
          <Link href="/learn/youtube-retention-analysis">retention analysis</Link>.
        </p>
      </section>

      {/* References */}
      <div className={u.references}>
        <h3 className={u.referencesTitle}>References</h3>
        <ul className={u.referencesList}>
          <li>
            YouTube Help:{" "}
            <a href="https://support.google.com/youtube/answer/72431" target="_blank" rel="noopener noreferrer">
              Add video thumbnails
            </a>{" "}
            — Official thumbnail requirements (1280×720, 16:9, max 2MB)
          </li>
          <li>
            YouTube Creator Academy:{" "}
            <a href="https://creatoracademy.youtube.com/page/lesson/thumbnails" target="_blank" rel="noopener noreferrer">
              Make effective thumbnails and titles
            </a>{" "}
            — Rule of thirds, readability, and avoiding clutter
          </li>
          <li>
            Color contrast and UI salience: Thumbnails using colors that contrast with YouTube's red/white/black interface (such as blue, orange, green, or yellow) achieve higher visual salience in the feed, based on perceptual contrast principles and creator testing.
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Make thumbnails faster without guessing.</strong> {BRAND.name} helps you study competitor packaging patterns, generate better video ideas, and ship more consistently. If you want tools (not just theory),{" "}
          <Link href="/dashboard">try the app</Link>.
        </p>
      </div>
    </>
  );
}
