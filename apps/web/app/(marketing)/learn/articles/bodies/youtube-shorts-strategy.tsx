/**
 * Body content for YouTube Shorts Strategy article.
 * Server component - no "use client" directive.
 *
 * A practical playbook for Shorts creators covering:
 * - Module 1: Niche Discovery
 * - Module 2: Trend-Driven Shorts (without being a clone)
 * - Module 3: Competitor Pattern Mining
 * - Module 4: Idea Generation
 * - Module 5: Packaging (hooks, retention)
 * - Module 6: Titles, Tags, Metadata
 *
 * Monetization content lives in youtube-shorts-monetization.tsx
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

/* ================================================
   INLINE SVG VISUALS
   ================================================ */

function NicheTargetSvg() {
  return (
    <svg
      width="280"
      height="180"
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Target with arrow representing niche focus"
    >
      <title>Niche Discovery Target</title>
      {/* Outer ring */}
      <circle
        cx="140"
        cy="90"
        r="70"
        fill="#fee2e2"
        stroke="#fca5a5"
        strokeWidth="2"
      />
      {/* Middle ring */}
      <circle
        cx="140"
        cy="90"
        r="50"
        fill="#fef3c7"
        stroke="#fcd34d"
        strokeWidth="2"
      />
      {/* Inner ring */}
      <circle
        cx="140"
        cy="90"
        r="30"
        fill="#dcfce7"
        stroke="#86efac"
        strokeWidth="2"
      />
      {/* Bullseye */}
      <circle cx="140" cy="90" r="12" fill="#22c55e" />

      {/* Arrow hitting bullseye */}
      <line x1="60" y1="30" x2="130" y2="82" stroke="#1e293b" strokeWidth="3" />
      <polygon points="130,82 122,74 126,84 120,86" fill="#1e293b" />
      <circle
        cx="56"
        cy="26"
        r="6"
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth="2"
      />

      {/* Labels */}
      <text
        x="140"
        y="170"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#64748b"
      >
        Find your focused niche
      </text>
    </svg>
  );
}

function PatternMiningSvg() {
  return (
    <svg
      width="320"
      height="160"
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Magnifying glass analyzing video patterns"
    >
      <title>Pattern Mining</title>

      {/* Video thumbnails */}
      <rect
        x="20"
        y="40"
        width="60"
        height="45"
        rx="4"
        fill="#e0e7ff"
        stroke="#6366f1"
        strokeWidth="2"
      />
      <rect
        x="90"
        y="40"
        width="60"
        height="45"
        rx="4"
        fill="#e0e7ff"
        stroke="#6366f1"
        strokeWidth="2"
      />
      <rect
        x="160"
        y="40"
        width="60"
        height="45"
        rx="4"
        fill="#dcfce7"
        stroke="#22c55e"
        strokeWidth="3"
      />

      {/* Play buttons on thumbnails */}
      <polygon points="45,55 45,75 60,65" fill="#6366f1" />
      <polygon points="115,55 115,75 130,65" fill="#6366f1" />
      <polygon points="185,55 185,75 200,65" fill="#22c55e" />

      {/* View counts */}
      <text x="50" y="100" textAnchor="middle" fontSize="9" fill="#64748b">
        12K
      </text>
      <text x="120" y="100" textAnchor="middle" fontSize="9" fill="#64748b">
        8K
      </text>
      <text
        x="190"
        y="100"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#16a34a"
      >
        890K
      </text>

      {/* Magnifying glass */}
      <circle
        cx="260"
        cy="70"
        r="35"
        fill="none"
        stroke="#1e293b"
        strokeWidth="4"
      />
      <line
        x1="285"
        y1="95"
        x2="305"
        y2="115"
        stroke="#1e293b"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Sparkle inside magnifying glass */}
      <path
        d="M250 60 L252 65 L257 65 L253 69 L255 75 L250 71 L245 75 L247 69 L243 65 L248 65 Z"
        fill="#f59e0b"
      />
      <text
        x="260"
        y="82"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#1e293b"
      >
        WHY?
      </text>

      {/* Label */}
      <text
        x="160"
        y="145"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#64748b"
      >
        Study what works, understand why
      </text>
    </svg>
  );
}

function IdeaLightbulbSvg() {
  return (
    <svg
      width="160"
      height="180"
      viewBox="0 0 160 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Lightbulb representing idea generation"
    >
      <title>Idea Generation</title>

      {/* Lightbulb glow */}
      <circle cx="80" cy="70" r="55" fill="#fef3c7" opacity="0.5" />

      {/* Lightbulb glass */}
      <path
        d="M80 20 C50 20 30 50 30 75 C30 95 45 110 55 120 L55 130 L105 130 L105 120 C115 110 130 95 130 75 C130 50 110 20 80 20"
        fill="#fcd34d"
        stroke="#f59e0b"
        strokeWidth="3"
      />

      {/* Lightbulb base */}
      <rect x="55" y="130" width="50" height="8" rx="2" fill="#94a3b8" />
      <rect x="58" y="138" width="44" height="6" rx="2" fill="#94a3b8" />
      <rect x="62" y="144" width="36" height="6" rx="2" fill="#94a3b8" />
      <rect x="68" y="150" width="24" height="10" rx="4" fill="#64748b" />

      {/* Filament */}
      <path
        d="M70 80 Q75 60 80 80 Q85 100 90 80"
        stroke="#f97316"
        strokeWidth="3"
        fill="none"
      />

      {/* Sparkles */}
      <path
        d="M25 50 L28 55 L33 55 L29 59 L31 65 L25 61 L19 65 L21 59 L17 55 L22 55 Z"
        fill="#f59e0b"
      />
      <path
        d="M135 50 L138 55 L143 55 L139 59 L141 65 L135 61 L129 65 L131 59 L127 55 L132 55 Z"
        fill="#f59e0b"
      />
      <path
        d="M80 5 L82 10 L87 10 L83 14 L85 20 L80 16 L75 20 L77 14 L73 10 L78 10 Z"
        fill="#f59e0b"
      />

      {/* Label */}
      <text
        x="80"
        y="175"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#64748b"
      >
        Ideas from data
      </text>
    </svg>
  );
}

function HookRetentionSvg() {
  return (
    <svg
      width="360"
      height="160"
      viewBox="0 0 360 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hook catching viewers with retention graph"
    >
      <title>Hook and Retention</title>

      {/* Graph background */}
      <rect
        x="100"
        y="20"
        width="240"
        height="100"
        rx="8"
        fill="#f8fafc"
        stroke="#e2e8f0"
        strokeWidth="2"
      />

      {/* Y axis */}
      <line
        x1="120"
        y1="30"
        x2="120"
        y2="110"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      <text x="115" y="40" textAnchor="end" fontSize="9" fill="#64748b">
        100%
      </text>
      <text x="115" y="110" textAnchor="end" fontSize="9" fill="#64748b">
        0%
      </text>

      {/* X axis */}
      <line
        x1="120"
        y1="110"
        x2="320"
        y2="110"
        stroke="#94a3b8"
        strokeWidth="1"
      />
      <text x="140" y="125" textAnchor="middle" fontSize="9" fill="#64748b">
        Hook
      </text>
      <text x="220" y="125" textAnchor="middle" fontSize="9" fill="#64748b">
        Middle
      </text>
      <text x="300" y="125" textAnchor="middle" fontSize="9" fill="#64748b">
        End
      </text>

      {/* Good retention curve (green) */}
      <path
        d="M120 35 C150 38 180 45 220 55 C260 65 290 75 320 85"
        stroke="#22c55e"
        strokeWidth="3"
        fill="none"
      />

      {/* Bad retention curve (red, dashed) */}
      <path
        d="M120 35 C130 50 140 75 160 95 C180 105 200 108 320 108"
        stroke="#ef4444"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
      />

      {/* Hook icon */}
      <path
        d="M30 60 C30 30 60 20 60 50 L60 90 C60 110 40 110 40 90"
        stroke="#6366f1"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="30" cy="60" r="6" fill="#6366f1" />

      {/* Arrow from hook to graph */}
      <path
        d="M70 60 L100 45"
        stroke="#6366f1"
        strokeWidth="2"
        strokeDasharray="4 2"
      />
      <polygon points="98,50 108,43 100,40" fill="#6366f1" />

      {/* Legend */}
      <line
        x1="130"
        y1="145"
        x2="150"
        y2="145"
        stroke="#22c55e"
        strokeWidth="3"
      />
      <text x="155" y="148" fontSize="10" fill="#374151">
        Strong hook
      </text>
      <line
        x1="230"
        y1="145"
        x2="250"
        y2="145"
        stroke="#ef4444"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <text x="255" y="148" fontSize="10" fill="#374151">
        Weak hook
      </text>
    </svg>
  );
}

function TrendRadarSvg() {
  return (
    <svg
      width="320"
      height="180"
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Radar detecting trend signals from multiple sources"
    >
      <title>Trend Detection</title>

      {/* Radar dish */}
      <ellipse
        cx="80"
        cy="120"
        rx="50"
        ry="20"
        fill="#e0e7ff"
        stroke="#6366f1"
        strokeWidth="2"
      />
      <path
        d="M80 120 L80 60 Q80 50 90 45 L130 30"
        stroke="#6366f1"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="130" cy="30" r="8" fill="#6366f1" />

      {/* Radar waves */}
      <path
        d="M140 35 Q180 20 200 40"
        stroke="#a5b4fc"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M145 45 Q190 25 215 50"
        stroke="#a5b4fc"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M150 55 Q200 30 230 60"
        stroke="#a5b4fc"
        strokeWidth="2"
        fill="none"
        opacity="0.2"
      />

      {/* Signal sources */}
      <rect
        x="200"
        y="50"
        width="40"
        height="30"
        rx="4"
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="2"
      />
      <text x="220" y="70" textAnchor="middle" fontSize="10" fill="#92400e">
        YT
      </text>

      <rect
        x="250"
        y="80"
        width="40"
        height="30"
        rx="4"
        fill="#dcfce7"
        stroke="#22c55e"
        strokeWidth="2"
      />
      <text x="270" y="100" textAnchor="middle" fontSize="10" fill="#166534">
        X
      </text>

      <rect
        x="260"
        y="120"
        width="40"
        height="30"
        rx="4"
        fill="#fee2e2"
        stroke="#ef4444"
        strokeWidth="2"
      />
      <text x="280" y="140" textAnchor="middle" fontSize="10" fill="#991b1b">
        GT
      </text>

      {/* Detected signals */}
      <circle cx="180" cy="90" r="6" fill="#22c55e" />
      <circle cx="195" cy="110" r="4" fill="#f59e0b" />
      <circle cx="210" cy="95" r="5" fill="#6366f1" />

      {/* Label */}
      <text
        x="160"
        y="170"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#64748b"
      >
        Detect signals, validate before acting
      </text>
    </svg>
  );
}

/* ================================================
   HELPER COMPONENTS
   ================================================ */

type TrendSignalCardProps = {
  source: string;
  signal: string;
  meaning: string;
  ignoreWhen: string;
};

function TrendSignalCard({
  source,
  signal,
  meaning,
  ignoreWhen,
}: TrendSignalCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <h4
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#6366f1",
          margin: "0 0 12px",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {source}
      </h4>
      <div style={{ marginBottom: "12px" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            margin: "0 0 4px",
          }}
        >
          Signal to look for:
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {signal}
        </p>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            margin: "0 0 4px",
          }}
        >
          What it often means:
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {meaning}
        </p>
      </div>
      <div
        style={{
          paddingTop: "12px",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-tertiary)",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          <strong style={{ color: "var(--text-secondary)" }}>
            Ignore when:
          </strong>{" "}
          {ignoreWhen}
        </p>
      </div>
    </div>
  );
}

type TransformPlayCardProps = {
  name: string;
  description: string;
  example: {
    trend: string;
    transform: string;
    hook: string;
  };
};

function TransformPlayCard({
  name,
  description,
  example,
}: TransformPlayCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <h4
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 8px",
        }}
      >
        {name}
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          margin: "0 0 16px",
        }}
      >
        {description}
      </p>
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "8px",
          padding: "12px",
          border: "1px solid var(--border-light)",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 8px",
          }}
        >
          Example
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            margin: "0 0 4px",
          }}
        >
          <strong>Trend:</strong> {example.trend}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            margin: "0 0 4px",
          }}
        >
          <strong>Transform:</strong> {example.transform}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#6366f1",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          <strong>Hook:</strong> &quot;{example.hook}&quot;
        </p>
      </div>
    </div>
  );
}

type ModuleHeaderProps = {
  number: number;
  title: string;
  description: string;
};

function ModuleHeader({ number, title, description }: ModuleHeaderProps) {
  return (
    <div
      style={{
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "10px",
          }}
        >
          {number}
        </span>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text)",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <p
        style={{
          fontSize: "15px",
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
}

type StrategyCardProps = {
  letter: string;
  title: string;
  description: string;
  lookFor: string[];
};

function StrategyCard({
  letter,
  title,
  description,
  lookFor,
}: StrategyCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            background: "#e0e7ff",
            color: "#4f46e5",
            fontSize: "13px",
            fontWeight: 700,
            borderRadius: "6px",
          }}
        >
          {letter}
        </span>
        <h4
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text)",
            margin: 0,
          }}
        >
          {title}
        </h4>
      </div>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          margin: "0 0 12px",
        }}
      >
        {description}
      </p>
      <div
        style={{
          fontSize: "12px",
          color: "var(--text-tertiary)",
          paddingTop: "12px",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <strong
          style={{
            color: "var(--text-secondary)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          What to look for:
        </strong>
        <ul
          style={{
            margin: 0,
            paddingLeft: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {lookFor.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type ScorecardItemProps = {
  label: string;
  question: string;
};

function ScorecardItem({ label, question }: ScorecardItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px",
        background: "white",
        borderRadius: "8px",
        border: "1px solid var(--border-light)",
      }}
    >
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          border: "2px solid #6366f1",
          flexShrink: 0,
          marginTop: "2px",
        }}
      />
      <div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text)",
            margin: "0 0 2px",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          {question}
        </p>
      </div>
    </div>
  );
}

type HookTemplateCardProps = {
  template: string;
  example: string;
};

function HookTemplateCard({ template, example }: HookTemplateCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <p
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#6366f1",
          margin: "0 0 8px",
          lineHeight: 1.4,
        }}
      >
        {template}
      </p>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          margin: 0,
          fontStyle: "italic",
          lineHeight: 1.4,
        }}
      >
        &quot;{example}&quot;
      </p>
    </div>
  );
}

type ToolCtaCardProps = {
  title: string;
  description: string;
  href: string;
  bestFor?: string;
};

function ToolCtaCard({ title, description, href, bestFor }: ToolCtaCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "24px",
      }}
    >
      {bestFor && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {bestFor}
        </span>
      )}
      <h4
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--text)",
          margin: bestFor ? "6px 0 8px" : "0 0 8px",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--primary)",
          textDecoration: "none",
          padding: "8px 16px",
          background: "white",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          transition: "all 0.15s ease",
        }}
      >
        Try it free
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

/* ================================================
   BODY COMPONENT
   ================================================ */

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className="sectionOpen">
        <p
          className={s.sectionText}
          style={{ fontSize: "1.125rem", fontWeight: 500 }}
        >
          Creating Shorts that perform is not about luck. The creators who grow
          consistently have systems: they find niches methodically, study what
          works, generate ideas from data, and package content with intention.
        </p>

        <p className={s.sectionText}>
          This guide is a practical playbook covering five core workflows. Each
          module gives you a repeatable process you can apply to your own
          channel, along with tools that can speed up the work.
        </p>

        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">What This Guide Covers</p>
          <p className="realTalk__text">
            <strong>Module 1:</strong> Niche Discovery (finding promising
            pockets). <strong>Module 2:</strong> Trend-Driven Shorts (acting on
            trends without cloning). <strong>Module 3:</strong> Competitor
            Pattern Mining (what works and why). <strong>Module 4:</strong> Idea
            Generation (ideas from real data). <strong>Module 5:</strong>{" "}
            Packaging (hooks, pacing, retention). <strong>Module 6:</strong>{" "}
            Metadata (titles, tags, descriptions).
          </p>
        </div>

        <div className="funCallout" style={{ marginTop: "1rem" }}>
          <p className="funCallout__text">
            Looking for monetization info? See our{" "}
            <Link href="/learn/youtube-shorts-monetization">
              Shorts Monetization guide
            </Link>{" "}
            for eligibility requirements, the revenue model, and how to set up
            your channel for monetization success.
          </p>
        </div>
      </section>

      {/* Module 1: Niche Discovery */}
      <section id="niche-discovery" className="sectionTinted">
        <ModuleHeader
          number={1}
          title="Niche Discovery"
          description="Finding a niche is not about picking a topic. It is about finding a pocket where you can create repeatable content for a clear audience with manageable production effort."
        />

        <div className="inlineIllustration">
          <NicheTargetSvg />
        </div>

        <p className={s.sectionText}>
          Here are three strategies you could try for discovering promising
          niches:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <StrategyCard
            letter="A"
            title="Incognito Scroll + Pattern Spotting"
            description="Open YouTube Shorts in an incognito window (no personalization) and scroll with intention. Notice which formats consistently appear and get engagement."
            lookFor={[
              "Recurring visual formats (split screen, before/after, POV)",
              "Hook styles that make you stop scrolling",
              "Topics that appear repeatedly from different creators",
              "Comment sections with high engagement",
            ]}
          />
          <StrategyCard
            letter="B"
            title="Fresh Channel Scanning"
            description="Find channels under 6 months old that are growing. They reveal what is working right now rather than legacy audience effects."
            lookFor={[
              "Recent upload baseline (views on newest videos)",
              "Repeatable format they use across videos",
              "Language and audience fit for your capabilities",
              "Series patterns you could adapt",
            ]}
          />
          <StrategyCard
            letter="C"
            title="Trend Adjacency"
            description="When a topic breaks out, look for adjacent angles rather than copying directly. Same audience, new perspective."
            lookFor={[
              "Underserved angles on trending topics",
              "Questions in comments that creators are not answering",
              "Formats that could apply to the trending topic",
              "Opposite takes or contrarian views with substance",
            ]}
          />
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Niche Scorecard
        </h3>
        <p className={s.sectionText}>
          Before committing to a niche, evaluate it against these criteria:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <ScorecardItem
            label="Repeatable Format"
            question="Can you make 50+ videos without running out of topics?"
          />
          <ScorecardItem
            label="Clear Audience"
            question="Can you describe who watches this content specifically?"
          />
          <ScorecardItem
            label="Manageable Production"
            question="Can you create this content consistently with your resources?"
          />
          <ScorecardItem
            label="Comment Velocity"
            question="Do videos in this niche generate active discussion?"
          />
          <ScorecardItem
            label="Subscribe Potential"
            question="Would viewers want more of this content regularly?"
          />
          <ScorecardItem
            label="Monetization Path"
            question="Are there products, sponsors, or services relevant to this audience?"
          />
        </div>

        <div className="funCallout" style={{ marginTop: "24px" }}>
          <p className="funCallout__text">
            <strong>Trends can reveal niches.</strong> When you see a topic
            gaining traction, look beyond the obvious angle. The trend itself
            might be crowded, but adjacent subtopics or underserved audiences
            within that trend often have room for new creators. Module 2 covers
            how to spot and act on trends without becoming a clone.
          </p>
        </div>

        <ToolCtaCard
          title="Research Competitors in Any Niche"
          description="See which channels are growing in niches you are considering. Analyze their content patterns and performance."
          href="/competitors"
          bestFor="Best for niche research"
        />
      </section>

      {/* Module 2: Trend-Driven Shorts */}
      <section id="trend-driven-shorts" className="sectionOpen">
        <ModuleHeader
          number={2}
          title="Trend-Driven Shorts (Without Being a Clone)"
          description="Trends offer a timing advantage, not a permission to copy. The goal is finding topics with momentum and adding your own angle before the window closes."
        />

        <div className="inlineIllustration">
          <TrendRadarSvg />
        </div>

        <h3 className={s.subheading}>A) Find Trends You Can Act On</h3>
        <p className={s.sectionText}>
          Different sources reveal different types of signals. Here are four
          surfaces worth checking regularly, with guidance on what to look for
          and when to ignore noise.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <TrendSignalCard
            source="YouTube Trending + Shorts"
            signal="Formats appearing repeatedly from different creators. Topics in your niche showing up in Trending. Comments asking for more."
            meaning="The topic has active demand and the algorithm is testing it across audiences. Formats that appear often have proven engagement patterns."
            ignoreWhen="The content requires resources you lack (expensive production, celebrity access). Or you see only one creator succeeding and no pattern."
          />
          <TrendSignalCard
            source="Google Trends (YouTube Search)"
            signal="Rising queries in your category over the past 30 days. Breakout topics showing 100%+ growth. Related queries revealing subtopics."
            meaning="Search demand is growing before video supply catches up. Early mover advantage is possible if you publish quality content quickly."
            ignoreWhen="The spike is a one-day news event with no staying power. Or the topic has no clear connection to your expertise or audience."
          />
          <TrendSignalCard
            source="Twitter/X Trending + Grok"
            signal="Viral posts in your niche with high engagement. Repeated conversation themes. Grok can surface trending stocks, topics, or events."
            meaning="Immediate interest exists. For news-style content, speed matters. The topic is already in public conversation."
            ignoreWhen="The topic is too ephemeral (hours, not days). Or requires breaking news access you do not have."
          />
          <TrendSignalCard
            source="Outlier Detection (Small Channels)"
            signal="Videos from channels under 50K subs getting 10x their typical views. Mediocre production with strong performance."
            meaning="The topic or format has demand that exceeds the current supply quality. A better version could capture significant audience."
            ignoreWhen="The outlier is a one-off lucky hit with no pattern. Or the topic requires specialized knowledge you lack."
          />
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          B) Separate Spikes from Waves
        </h3>
        <p className={s.sectionText}>
          Not all trends are equal. Some spike for a day and vanish. Others
          build into repeatable waves you can ride for months. Knowing the
          difference saves wasted effort.
        </p>

        <div className="comparisonGrid" style={{ marginTop: "16px" }}>
          <div className="comparisonItem comparisonItem--bad">
            <p className="comparisonItem__label">Momentary Spikes</p>
            <p className="comparisonItem__content">
              Single news events, celebrity drama, one-off viral moments. They
              peak within 24-48 hours and disappear. Worth covering only if you
              can publish extremely fast with minimal production effort. Most
              creators should skip these.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Repeatable Waves</p>
            <p className="comparisonItem__content">
              Topics that grow steadily over weeks or months. Multiple creators
              finding success with different angles. Subtopics emerging.
              Examples: AI tools, productivity systems, niche hobbies gaining
              mainstream attention. These offer time to produce quality content.
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "24px" }}>
          <p className="realTalk__label">How to Tell the Difference</p>
          <p className="realTalk__text">
            <strong>Check Google Trends over 90 days</strong> (not just 7).
            Spikes show a sharp peak then crash. Waves show sustained growth or
            a plateau that holds. <strong>Look for multiple winners.</strong> If
            only one channel benefits, it might be their audience, not the
            topic. If several channels see lifts, the wave is real.
          </p>
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          C) Turn a Trend Into an Original Short
        </h3>
        <p className={s.sectionText}>
          Copying trending videos leads to weak clones that underperform.
          Instead, transform the trend using one of these three approaches:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <TransformPlayCard
            name="Angle Swap"
            description="Same topic, different point-of-view or question. Ask what aspect of the trend is underexplored or what audience is being ignored."
            example={{
              trend: "AI tools for productivity",
              transform:
                "AI tools that actually waste your time (contrarian take)",
              hook: "Everyone is recommending these AI tools. Here is why 3 of them made me less productive.",
            }}
          />
          <TransformPlayCard
            name="Format Swap"
            description="Same topic, different structure. Take a talking-head explanation and make it a visual demonstration. Turn a list into a story arc."
            example={{
              trend: "Morning routines of successful people",
              transform:
                "A week testing the most extreme morning routine I found",
              hook: "I tried the 4AM ice bath routine for 7 days. Here is what actually happened.",
            }}
          />
          <TransformPlayCard
            name="Audience Swap"
            description="Same topic, different viewer promise. Target beginners when everyone targets experts, or vice versa. Myth-bust common advice."
            example={{
              trend: "How to start a YouTube channel",
              transform: "What nobody tells you after your first 100 videos",
              hook: "I wish someone had told me this before I hit upload 100 times.",
            }}
          />
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          D) Trend to Script to Scenes
        </h3>
        <p className={s.sectionText}>
          Once you identify a trend worth pursuing, use this workflow to move
          from signal to publishable Short:
        </p>

        <div className="conveyorSteps" style={{ marginTop: "16px" }}>
          <div className="conveyorStation">
            <span className="conveyorStation__num">1</span>
            <div>
              <h4 className="conveyorStation__title">
                Capture 5-10 Reference Videos
              </h4>
              <p className="conveyorStation__desc">
                Find videos on the trending topic that perform well. Save links.
                Include a mix of formats and creator sizes.
              </p>
            </div>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">2</span>
            <div>
              <h4 className="conveyorStation__title">Extract What Matters</h4>
              <p className="conveyorStation__desc">
                For each reference, note: hook type (question, claim, visual),
                pacing (fast cuts vs slow build), core loop (what keeps viewers
                watching), payoff (how it ends).
              </p>
            </div>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">3</span>
            <div>
              <h4 className="conveyorStation__title">
                Define Your Single Viewer Promise
              </h4>
              <p className="conveyorStation__desc">
                What will viewers get from YOUR video that they cannot get from
                the others? One clear promise, not three vague ones.
              </p>
            </div>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">4</span>
            <div>
              <h4 className="conveyorStation__title">
                Choose One Transform and Outline
              </h4>
              <p className="conveyorStation__desc">
                Pick angle swap, format swap, or audience swap. Outline 3-5
                scenes that deliver your promise with that transform applied.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "24px",
            border: "1px solid var(--border-light)",
          }}
        >
          <h4
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text)",
              margin: "0 0 12px",
            }}
          >
            What to Record (Quick Reference)
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  margin: "0 0 4px",
                }}
              >
                Hook (0-2s)
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                Visual or verbal grab
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  margin: "0 0 4px",
                }}
              >
                Setup (2-8s)
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                Context for the promise
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  margin: "0 0 4px",
                }}
              >
                Delivery (8-50s)
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                Main content with pacing
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  margin: "0 0 4px",
                }}
              >
                Payoff (final 2-5s)
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  margin: 0,
                }}
              >
                Satisfying close or loop
              </p>
            </div>
          </div>
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          E) Validate Before You Over-Produce
        </h3>
        <p className={s.sectionText}>
          Trends can fade faster than you expect. Before investing heavy
          production time, do lightweight validation:
        </p>

        <div className="factorGrid" style={{ marginTop: "16px" }}>
          <div className="factorCard">
            <h4 className="factorCard__title">Compare Across Channels</h4>
            <p className="factorCard__desc">
              If only one channel succeeds with a topic, it might be their
              audience effect, not the topic. Look for 3+ channels with
              above-average performance on similar content.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Check Baseline vs Outlier</h4>
            <p className="factorCard__desc">
              A video with 500K views means different things on a 10K subscriber
              channel vs a 1M subscriber channel. Calculate the multiplier
              against their typical performance.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Read Comment Themes</h4>
            <p className="factorCard__desc">
              Comments reveal what viewers actually want. Repeated questions
              signal content gaps. Complaints about existing videos signal
              improvement opportunities.
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "24px" }}>
          <p className="realTalk__label">Honest Expectations</p>
          <p className="realTalk__text">
            Trends improve your odds, they do not guarantee success. A
            well-timed video on a rising topic performs better than the same
            video published six months later. But timing alone does not
            compensate for weak hooks, poor retention, or content that fails to
            deliver on its promise. Trends are a multiplier, not a magic fix.
          </p>
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Micro-Examples: Trend to Original Short
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #fcd34d",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#92400e",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "0 0 8px",
              }}
            >
              Example: AI Tools Trend
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#78350f",
                margin: "0 0 12px",
                lineHeight: 1.6,
              }}
            >
              <strong>Signal:</strong> Google Trends shows &quot;AI image
              generator&quot; rising 80% over 90 days. Multiple small channels
              getting outlier views on tool reviews.
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#78350f",
                margin: "0 0 12px",
                lineHeight: 1.6,
              }}
            >
              <strong>Non-clone angle (Audience Swap):</strong> Instead of
              &quot;Best AI image generators,&quot; target a specific use case
              most reviews ignore: &quot;AI image tools for YouTube thumbnails
              specifically.&quot;
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#92400e",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              <strong>Hook:</strong> &quot;I tested 12 AI tools to make
              thumbnails. Only 2 were actually usable.&quot;
            </p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #86efac",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#166534",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "0 0 8px",
              }}
            >
              Example: Productivity Wave
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#14532d",
                margin: "0 0 12px",
                lineHeight: 1.6,
              }}
            >
              <strong>Signal:</strong> &quot;Dopamine detox&quot; shows
              sustained growth on Google Trends over 6 months. Reddit
              discussions predate the YouTube surge. Multiple creators
              benefiting.
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#14532d",
                margin: "0 0 12px",
                lineHeight: 1.6,
              }}
            >
              <strong>Non-clone angle (Format Swap):</strong> Instead of
              explaining the concept, document attempting it: &quot;7 days of
              dopamine detox as a content creator.&quot;
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#166534",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              <strong>Hook:</strong> &quot;Day 1: No phone, no YouTube, no
              editing. Here is what happened to my creativity.&quot;
            </p>
          </div>
        </div>

        <ToolCtaCard
          title="Search Competitor Channels and Videos"
          description="Validate a trend by finding channels succeeding with similar content. See which videos outperform their baseline."
          href="/competitors"
          bestFor="Best for trend validation"
        />

        <div style={{ marginTop: "16px" }}>
          <ToolCtaCard
            title="Extract Tags from Trending Videos"
            description="Capture recurring topic language across trending winners. Useful for understanding how successful creators frame similar content."
            href="/tags/extractor"
            bestFor="Best for topic framing"
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <ToolCtaCard
            title="Generate Ideas from Trends"
            description="Turn a trending topic into multiple angles and series ideas. Get variations you can test rather than copying what exists."
            href="/ideas"
            bestFor="Best for angle generation"
          />
        </div>
      </section>

      {/* Module 3: Competitor Pattern Mining */}
      <section id="competitor-patterns" className="sectionTinted">
        <ModuleHeader
          number={3}
          title="Competitor Pattern Mining"
          description="Studying competitors is not about copying. It is about understanding patterns that work so you can adopt and improve them with your own perspective."
        />

        <div className="inlineIllustration">
          <PatternMiningSvg />
        </div>

        <h3 className={s.subheading}>The Analysis Process</h3>
        <p className={s.sectionText}>
          Here is a repeatable workflow for mining competitor patterns:
        </p>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">1. Select 3 Competitors</h4>
            <p className="factorCard__desc">
              Choose channels in your niche or adjacent niches that are 1-2
              steps ahead of you. Avoid mega-channels where success factors are
              hard to isolate.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">2. Pick 10 Top Shorts Each</h4>
            <p className="factorCard__desc">
              Sort by most viewed in the last 90 days. Look for outliers that
              significantly outperformed their average. These signal audience
              demand.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">3. Capture Pattern Elements</h4>
            <p className="factorCard__desc">
              For each video, note: hook type, pacing style, on-screen text
              approach, story arc, series format, and recurring comment themes.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">4. Identify Adopt + Improve</h4>
            <p className="factorCard__desc">
              Find one pattern you could adopt directly and one you could
              improve (stronger hook, tighter pacing, better payoff, clearer
              conflict).
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "24px" }}>
          <p className="realTalk__label">What to Capture Per Video</p>
          <p className="realTalk__text">
            <strong>Hook:</strong> What happens in the first 1-2 seconds?{" "}
            <strong>Pacing:</strong> How fast are cuts and scene changes?{" "}
            <strong>Text:</strong> How is on-screen text used?{" "}
            <strong>Arc:</strong> Is there setup, conflict, payoff?{" "}
            <strong>Series:</strong> Is this part of a repeatable format?{" "}
            <strong>Comments:</strong> What do viewers say they want more of?
          </p>
        </div>

        <div className="comparisonGrid" style={{ marginTop: "24px" }}>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Pattern to Adopt</p>
            <p className="comparisonItem__content">
              Find one structural element that works well: maybe it is a
              specific hook type, a pacing cadence, or a series format. Adopt
              the pattern while applying your own topic and style.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Pattern to Improve</p>
            <p className="comparisonItem__content">
              Find one weakness in what competitors do: maybe their hooks are
              slow, their payoffs are weak, or they miss an obvious angle. Your
              version can be better in that specific way.
            </p>
          </div>
        </div>

        <div className="funCallout" style={{ marginTop: "24px" }}>
          <p className="funCallout__text">
            <strong>Validate trends with competitor baselines.</strong> When you
            spot a potential trend, use competitor analysis to check if multiple
            channels see above-average performance on that topic. A single viral
            video might be luck. Three channels with 5x their usual views on
            similar content suggests real demand.
          </p>
        </div>

        <ToolCtaCard
          title="Analyze Any YouTube Channel"
          description="See a channel's top performing content, upload patterns, and growth trajectory. Find outlier videos that signal audience demand."
          href="/competitors"
          bestFor="Best for competitor analysis"
        />
      </section>

      {/* Module 4: Idea Generation */}
      <section id="idea-generation" className="sectionOpen">
        <ModuleHeader
          number={4}
          title="Idea Generation"
          description="Running out of ideas is usually a system problem, not a creativity problem. These workflows generate ideas from real audience signals instead of guessing."
        />

        <div className="floatRight">
          <IdeaLightbulbSvg />
        </div>

        <h3 className={s.subheading}>Three Idea Generation Methods</h3>

        <div className="factorGrid" style={{ marginTop: "16px" }}>
          <div className="factorCard">
            <h4 className="factorCard__title">Comment Mining</h4>
            <p className="factorCard__desc">
              Go to your own videos and competitors&apos; videos. Look for
              questions that appear repeatedly: &quot;How do you...?&quot;
              &quot;Can you show...?&quot; &quot;What about...?&quot; Each
              question is a video idea with built-in demand.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Format Remix</h4>
            <p className="factorCard__desc">
              Take a format that works (split screen comparison, before/after,
              day in the life) and apply it to a new topic in your niche. Same
              structure, fresh content.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Series Thinking</h4>
            <p className="factorCard__desc">
              Instead of single videos, plan series of 10 episodes from one
              premise. &quot;5 tools I use daily&quot; becomes 5 separate
              videos. Series create momentum and make batch creation easier.
            </p>
          </div>
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Idea Prompts
        </h3>
        <p className={s.sectionText}>
          When you are stuck, work through these prompts:
        </p>

        <div className="realTalk" style={{ marginTop: "16px" }}>
          <p className="realTalk__text">
            <strong>What did I learn recently</strong> that surprised me in my
            niche? <strong>What mistake</strong> do beginners make that I could
            explain? <strong>What tool, method, or trick</strong> do I use that
            others might not know? <strong>What question</strong> do I get asked
            most often? <strong>What did I wish</strong> someone had told me
            when I started? <strong>What controversy</strong> exists in my niche
            that I have an informed take on?
          </p>
        </div>

        <div className="funCallout" style={{ marginTop: "24px" }}>
          <p className="funCallout__text">
            <strong>Batch your ideation.</strong> Spend 30 minutes once a week
            generating 10-20 ideas. Store them in a simple document. When it is
            time to create, pick from your list rather than staring at a blank
            screen.
          </p>
        </div>

        <ToolCtaCard
          title="Generate Ideas Based on What Works"
          description="Get video ideas tailored to your niche based on what is performing for channels like yours."
          href="/ideas"
          bestFor="Best for idea generation"
        />
      </section>

      {/* Module 5: Packaging */}
      <section id="packaging" className="sectionTinted">
        <ModuleHeader
          number={5}
          title="Packaging for Shorts"
          description="Packaging is how your content presents itself in the first few seconds. Strong hooks and intentional pacing are what separate Shorts that perform from Shorts that get scrolled past."
        />

        <div className="inlineIllustration">
          <HookRetentionSvg />
        </div>

        <h3 className={s.subheading}>Hook Templates</h3>
        <p className={s.sectionText}>
          The first 1-2 seconds determine whether viewers keep watching. Here
          are proven hook formats with examples:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <HookTemplateCard
            template="Stop doing X. Do this instead..."
            example="Stop editing on your phone. Do this on desktop instead."
          />
          <HookTemplateCard
            template="I wasted [time] until I learned this..."
            example="I wasted 6 months until I learned this one setting."
          />
          <HookTemplateCard
            template="Here is the fastest way to [result]..."
            example="Here is the fastest way to edit Shorts without expensive software."
          />
          <HookTemplateCard
            template="Watch to the end because..."
            example="Watch to the end because step 3 is why most people fail."
          />
          <HookTemplateCard
            template="This [thing] costs [amount] and does [impressive result]..."
            example="This free app does what I used to pay $50/month for."
          />
          <HookTemplateCard
            template="POV: You just discovered..."
            example="POV: You just discovered the setting that doubles your reach."
          />
          <HookTemplateCard
            template="The [niche] secret nobody talks about..."
            example="The thumbnail secret that most YouTubers miss."
          />
          <HookTemplateCard
            template="I tested [thing] so you do not have to..."
            example="I tested 30 AI tools so you do not have to."
          />
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Retention Mechanics
        </h3>

        <div className="comparisonGrid" style={{ marginTop: "16px" }}>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Pattern Interrupts</p>
            <p className="comparisonItem__content">
              Visual changes every 1-2 seconds reset attention. Camera angle
              shifts, zoom cuts, b-roll inserts, text appearing, or scene
              changes. The brain notices change and keeps watching.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Cut Dead Air</p>
            <p className="comparisonItem__content">
              Remove pauses, ums, slow transitions, and anything that does not
              move the video forward. Every second needs to earn its place in a
              Short.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Text as Pacing</p>
            <p className="comparisonItem__content">
              On-screen text should appear word by word or phrase by phrase, not
              as paragraphs. Use it to emphasize key points and keep eyes
              engaged.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Loop-Friendly Endings</p>
            <p className="comparisonItem__content">
              End where the beginning makes sense. Seamless loops encourage
              rewatches which count as additional engaged views.
            </p>
          </div>
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Story Structures
        </h3>

        <div className="factorGrid" style={{ marginTop: "16px" }}>
          <div className="factorCard">
            <h4 className="factorCard__title">Simple Linear Arc</h4>
            <p className="factorCard__desc">
              Setup → Demonstration → Result. Works for tutorials, tips, and
              how-tos. Clear and efficient. Best when the value is obvious and
              does not need drama.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Conflict Arc</h4>
            <p className="factorCard__desc">
              Problem → Struggle/Attempt → Resolution. Creates more emotional
              engagement. Works for stories, challenges, and transformations.
              Takes more setup time.
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "24px" }}>
          <p className="realTalk__label">One CTA Only</p>
          <p className="realTalk__text">
            Multiple calls to action kill retention. Pick one: follow, comment,
            check bio, or watch next. Put it at the end, not the middle. The CTA
            should feel like a natural next step, not an interruption.
          </p>
        </div>

        <ToolCtaCard
          title="Create Thumbnail Assets"
          description="Design thumbnails and channel art that match your Shorts brand. Consistent visual packaging builds recognition."
          href="/thumbnails"
          bestFor="Best for visual branding"
        />
      </section>

      {/* Module 6: Metadata */}
      <section id="metadata" className="sectionOpen">
        <ModuleHeader
          number={6}
          title="Titles, Tags, and Metadata"
          description="Metadata helps YouTube understand what your content is about. It is a supporting element, not a magic growth lever. Get it right, but do not overthink it."
        />

        <h3 className={s.subheading}>Where Tags Actually Matter</h3>
        <p className={s.sectionText}>
          Tags are a minor ranking signal compared to retention and engagement.
          They help YouTube understand your content context but will not save a
          video with weak hooks or poor retention. Think of them as helpful
          context, not a growth hack.
        </p>

        <div className="factorGrid" style={{ marginTop: "16px" }}>
          <div className="factorCard">
            <h4 className="factorCard__title">Tags Help With</h4>
            <p className="factorCard__desc">
              Disambiguation (clarifying what your video is about), discovery
              context (related content grouping), and search indexing (appearing
              for specific queries).
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Tags Do Not Help With</h4>
            <p className="factorCard__desc">
              Making a boring video interesting, fixing poor retention, or
              gaming the algorithm. No tag strategy compensates for weak
              content.
            </p>
          </div>
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Tag Capture Workflow
        </h3>
        <p className={s.sectionText}>
          Here is a practical workflow for building useful tag sets:
        </p>

        <div className="conveyorSteps" style={{ marginTop: "16px" }}>
          <div className="conveyorStation">
            <span className="conveyorStation__num">1</span>
            <div>
              <h4 className="conveyorStation__title">
                Extract from Top Performers
              </h4>
              <p className="conveyorStation__desc">
                Find 5 videos in your niche that perform well. Extract their
                tags using a tag extractor tool.
              </p>
            </div>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">2</span>
            <div>
              <h4 className="conveyorStation__title">Find Recurring Tags</h4>
              <p className="conveyorStation__desc">
                Compare across all 5 videos. Tags that appear in multiple videos
                signal relevance to your niche.
              </p>
            </div>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">3</span>
            <div>
              <h4 className="conveyorStation__title">Build a Base Set</h4>
              <p className="conveyorStation__desc">
                Create a core tag set (10-15 tags) aligned to your channel and
                series. Reuse this as a starting point for each video.
              </p>
            </div>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">4</span>
            <div>
              <h4 className="conveyorStation__title">
                Add Video-Specific Tags
              </h4>
              <p className="conveyorStation__desc">
                For each video, add 3-5 tags specific to that video&apos;s
                topic. Keep total tags reasonable (under 500 characters).
              </p>
            </div>
          </div>
        </div>

        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Title Guidelines
        </h3>

        <div className="realTalk" style={{ marginTop: "16px" }}>
          <p className="realTalk__text">
            <strong>Front-load keywords:</strong> Put the main topic in the
            first 40 characters since titles get truncated.{" "}
            <strong>Match the hook:</strong> The title should promise what the
            hook delivers. <strong>Avoid clickbait:</strong> Misleading titles
            hurt retention when viewers feel deceived.{" "}
            <strong>Test variations:</strong> Try different title styles across
            videos and see what performs for your audience.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <ToolCtaCard
            title="Extract Tags from Any Video"
            description="See what tags successful videos in your niche are using. Build your tag strategy from real data."
            href="/tags/extractor"
            bestFor="Best for tag research"
          />
          <ToolCtaCard
            title="Generate Relevant Tags"
            description="Get tag suggestions based on your video topic. Creates a starting point you can refine."
            href="/tags/generator"
            bestFor="Best for new videos"
          />
        </div>
      </section>

      {/* Sustainable Publishing */}
      <section id="publishing" className="sectionOpen">
        <h2 className={s.sectionTitle}>Sustainable Publishing</h2>

        <p className={s.sectionText}>
          Consistency matters more than volume. The goal is a publishing rhythm
          you can maintain without burning out, where each Short is better than
          your last.
        </p>

        <div className="factorGrid" style={{ marginTop: "16px" }}>
          <div className="factorCard">
            <h4 className="factorCard__title">Minimum Viable Schedule</h4>
            <p className="factorCard__desc">
              3-5 Shorts per week is sustainable for most creators. More volume
              only helps if quality stays consistent. Find your sustainable
              pace.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Batch Production</h4>
            <p className="factorCard__desc">
              Film 5-10 Shorts in one session. Edit in batches. Schedule
              releases. This prevents burnout and keeps quality consistent
              across videos.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Run 1-2 Series</h4>
            <p className="factorCard__desc">
              Recognizable formats train repeat viewing and make batch creation
              easier. Series like &quot;Tool of the day&quot; or &quot;3 things
              about X&quot; work well.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Evaluate Within 24 Hours</h4>
            <p className="factorCard__desc">
              Check first-hour views, retention curve shape, and comment
              sentiment. If a Short underperforms, note why and adjust the next
              one.
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "24px" }}>
          <p className="realTalk__label">The Improvement Loop</p>
          <p className="realTalk__text">
            Publishing is not the end. After each batch, review what worked and
            what did not. Identify one thing to improve in your next batch:
            maybe it is hooks, pacing, or topic selection. Small improvements
            compound over time.
          </p>
        </div>
      </section>

      {/* Cross-link to Monetization */}
      <section className="sectionTinted">
        <h2 className={s.sectionTitle}>Ready to Monetize Your Shorts?</h2>

        <p className={s.sectionText}>
          Once you are creating Shorts consistently, monetization becomes the
          next milestone. Understanding eligibility requirements, the revenue
          model, and what YouTube considers &quot;original content&quot; helps
          you set up for success.
        </p>

        <div
          style={{
            background: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",
            border: "2px solid #22c55e",
            borderRadius: "12px",
            padding: "24px",
            marginTop: "24px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#166534",
              margin: "0 0 12px",
            }}
          >
            YouTube Shorts Monetization Guide
          </h3>
          <p
            style={{
              fontSize: "15px",
              color: "#15803d",
              margin: "0 0 16px",
              lineHeight: 1.6,
            }}
          >
            Learn about eligibility tiers, the pooled revenue model, how music
            affects earnings, and what YouTube considers original and
            transformative content.
          </p>
          <Link
            href="/learn/youtube-shorts-monetization"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "15px",
              fontWeight: 600,
              color: "white",
              textDecoration: "none",
              padding: "12px 20px",
              background: "#22c55e",
              borderRadius: "8px",
              transition: "all 0.15s ease",
            }}
          >
            Read Monetization Guide
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Create Shorts with better data behind them
        </h3>
        <p
          style={{
            fontSize: "1.125rem",
            marginBottom: "1.5rem",
            maxWidth: "520px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {BRAND.name} helps you research competitors, generate ideas, and track
          which Shorts are driving growth for your channel.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            background: "white",
            color: "#6366f1",
            fontWeight: 600,
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          Try {BRAND.name} Free
        </Link>
      </div>
    </>
  );
}
