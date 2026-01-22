/**
 * Body content for YouTube Thumbnail Best Practices article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { useId } from "react";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";
import u from "./youtube-thumbnail-best-practices.module.css";

type MockTone = "good" | "bad";

type MockShape =
  | {
      kind: "circle";
      cx: number;
      cy: number;
      r: number;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    };

type MockText = {
  text: string;
  x: number;
  y: number;
  size: number;
  weight: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  letterSpacing?: number;
};

type MockThumbSpec = {
  tone: MockTone;
  bgA: string;
  bgB: string;
  shapes: readonly MockShape[];
  text: readonly MockText[];
  /** Optional "duration overlay" blocker for do/don't positioning examples */
  durationOverlay?: boolean;
};

function ThumbnailMock({
  label,
  hint,
  spec,
}: {
  label: string;
  hint: string;
  spec: MockThumbSpec;
}) {
  const gid = useId();
  const gradientId = `${gid}-bg`;

  return (
    <div className={u.thumbBlock}>
      <div className={u.thumbLabelRow}>
        <p
          className={[
            u.thumbLabel,
            spec.tone === "bad" ? u.thumbLabelBad : u.thumbLabelGood,
          ].join(" ")}
        >
          {label}
        </p>
        <p className={u.thumbHint}>{hint}</p>
      </div>

      <div className={u.thumb} data-variant={spec.tone}>
        <svg
          viewBox="0 0 160 90"
          width="160"
          height="90"
          role="img"
          aria-label={`${label} thumbnail mock`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="160" y2="90">
              <stop offset="0" stopColor={spec.bgA} />
              <stop offset="1" stopColor={spec.bgB} />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="160" height="90" fill={`url(#${gradientId})`} />

          {spec.durationOverlay ? (
            <>
              <rect
                x="126"
                y="72"
                width="30"
                height="14"
                rx="4"
                fill="rgba(0,0,0,0.55)"
                stroke="rgba(255,255,255,0.12)"
              />
              <text x="141" y="82" textAnchor="middle" fontSize="8" fill="white" opacity="0.9">
                12:34
              </text>
            </>
          ) : null}

          {spec.shapes.map((shape, idx) => {
            if (shape.kind === "circle") {
              return (
                <circle
                  key={idx}
                  cx={shape.cx}
                  cy={shape.cy}
                  r={shape.r}
                  fill={shape.fill}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  opacity={shape.opacity}
                />
              );
            }
            return (
              <rect
                key={idx}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                rx={shape.rx}
                fill={shape.fill}
                stroke={shape.stroke}
                strokeWidth={shape.strokeWidth}
                opacity={shape.opacity}
              />
            );
          })}

          {spec.text.map((t, idx) => (
            <text
              key={idx}
              x={t.x}
              y={t.y}
              fontSize={t.size}
              fontWeight={t.weight}
              fill={t.fill}
              stroke={t.stroke}
              strokeWidth={t.strokeWidth}
              opacity={t.opacity}
              letterSpacing={t.letterSpacing}
            >
              {t.text}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function ExamplePair({
  title,
  bad,
  good,
  firstHit,
  whyMobileWins,
}: {
  title: string;
  bad: MockThumbSpec;
  good: MockThumbSpec;
  firstHit: string;
  whyMobileWins: string;
}) {
  return (
    <div className={u.exampleCard}>
      <h3 className={u.exampleTitle}>{title}</h3>

      <div className={u.exampleGrid}>
        <ThumbnailMock
          label="Bad"
          hint="Too much to decode"
          spec={bad}
        />
        <ThumbnailMock
          label="Good"
          hint="One clear promise"
          spec={good}
        />
      </div>

      <div className={u.noteRow}>
        <div className={u.note}>
          <strong>What your eye hits first:</strong> {firstHit}
        </div>
        <div className={u.note}>
          <strong>Why it wins on mobile:</strong> {whyMobileWins}
        </div>
      </div>
    </div>
  );
}

function ThumbnailFormulaDiagram() {
  return (
    <div className={u.diagramWrap}>
      <svg
        viewBox="0 0 560 240"
        role="img"
        aria-label="Diagram showing focal subject, contrast, and optional short text"
      >
        <defs>
          <linearGradient id="thumbGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0f172a" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        <rect x="18" y="28" width="320" height="180" rx="16" fill="url(#thumbGrad)" />
        <rect x="18" y="28" width="320" height="180" rx="16" fill="rgba(255,255,255,0.02)" />

        {/* Contrast split */}
        <path d="M18 28H188V208H18z" fill="rgba(255,255,255,0.04)" />
        <path d="M188 28H338V208H188z" fill="rgba(0,0,0,0.18)" />

        {/* Focal subject */}
        <circle cx="120" cy="120" r="46" fill="url(#accent)" opacity="0.95" />
        <circle cx="120" cy="120" r="54" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />

        {/* Optional text */}
        <rect x="206" y="142" width="112" height="44" rx="12" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.16)" />
        <text x="262" y="170" textAnchor="middle" fontSize="18" fontWeight="800" fill="white">
          2–4 WORDS
        </text>

        {/* Labels */}
        <path d="M120 56 L120 28" stroke="#6366f1" strokeWidth="2" />
        <circle cx="120" cy="56" r="4" fill="#6366f1" />
        <text x="120" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#6366f1">
          Focal subject
        </text>

        <path d="M188 220 L188 208" stroke="#8b5cf6" strokeWidth="2" />
        <circle cx="188" cy="220" r="4" fill="#8b5cf6" />
        <text x="188" y="236" textAnchor="middle" fontSize="12" fontWeight="700" fill="#8b5cf6">
          Contrast / separation
        </text>

        <path d="M338 140 L382 140" stroke="#0ea5e9" strokeWidth="2" />
        <circle cx="338" cy="140" r="4" fill="#0ea5e9" />
        <text x="392" y="144" fontSize="12" fontWeight="700" fill="#0ea5e9">
          Optional: short text
        </text>

        {/* Formula */}
        <text x="372" y="58" fontSize="12" fontWeight="700" fill="#64748b">
          The formula
        </text>
        <text x="372" y="84" fontSize="18" fontWeight="800" fill="#0f172a">
          One idea
        </text>
        <text x="450" y="84" fontSize="18" fontWeight="800" fill="#64748b">
          +
        </text>
        <text x="372" y="112" fontSize="18" fontWeight="800" fill="#0f172a">
          One focal point
        </text>
        <text x="510" y="112" fontSize="18" fontWeight="800" fill="#64748b">
          +
        </text>
        <text x="372" y="140" fontSize="18" fontWeight="800" fill="#0f172a">
          Emotion / contrast
        </text>
        <text x="372" y="166" fontSize="12" fontWeight="600" fill="#475569">
          (Text only if it adds meaning.)
        </text>
      </svg>
    </div>
  );
}

function TinyTextAntVisual() {
  return (
    <svg
      viewBox="0 0 520 240"
      role="img"
      aria-label="Illustration of tiny thumbnail text requiring a microscope"
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#1f2937" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>

      <rect x="16" y="24" width="260" height="146" rx="14" fill="url(#bg)" />
      <rect x="32" y="44" width="112" height="12" rx="6" fill="rgba(255,255,255,0.18)" />
      <rect x="32" y="66" width="168" height="10" rx="5" fill="rgba(255,255,255,0.10)" />
      <rect x="32" y="86" width="196" height="10" rx="5" fill="rgba(255,255,255,0.10)" />
      <rect x="32" y="106" width="140" height="10" rx="5" fill="rgba(255,255,255,0.10)" />

      <text x="220" y="152" textAnchor="end" fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.6)">
        tiny text
      </text>

      {/* Microscope */}
      <path d="M354 170h120" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
      <path d="M416 70c-22 0-40 18-40 40" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
      <path d="M376 110h56" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
      <rect x="392" y="44" width="34" height="44" rx="10" fill="#64748b" />
      <circle cx="438" cy="128" r="36" fill="url(#glass)" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
      <circle cx="438" cy="128" r="18" fill="rgba(255,255,255,0.06)" />

      {/* Ant */}
      <circle cx="314" cy="178" r="10" fill="#0f172a" stroke="rgba(15,23,42,0.5)" />
      <circle cx="334" cy="178" r="8" fill="#0f172a" />
      <circle cx="350" cy="178" r="6" fill="#0f172a" />
      <path d="M322 170l-10-12" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <path d="M342 170l10-12" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <path d="M306 186l-18 10" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
      <path d="M356 186l18 10" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

      <path d="M276 54h220" stroke="rgba(99,102,241,0.35)" strokeWidth="2" strokeDasharray="6 6" />
      <text x="276" y="44" fontSize="12" fontWeight="700" fill="#6366f1">
        If it needs a microscope, it’s too small.
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
  const examples: Array<{
    title: string;
    bad: MockThumbSpec;
    good: MockThumbSpec;
    firstHit: string;
    whyMobileWins: string;
  }> = [
    {
      title: "Tiny text vs big readable shapes",
      bad: {
        tone: "bad",
        bgA: "#111827",
        bgB: "#334155",
        shapes: [
          { kind: "circle", cx: 44, cy: 44, r: 14, fill: "rgba(255,255,255,0.14)" },
          { kind: "rect", x: 66, y: 32, width: 44, height: 16, rx: 6, fill: "rgba(255,255,255,0.10)" },
          { kind: "rect", x: 20, y: 64, width: 120, height: 18, rx: 8, fill: "rgba(0,0,0,0.24)" },
        ],
        text: [
          { text: "THIS IS A VERY LONG SENTENCE", x: 24, y: 76, size: 7, weight: 800, fill: "rgba(255,255,255,0.85)" },
          { text: "WITH MORE WORDS", x: 24, y: 84, size: 7, weight: 700, fill: "rgba(255,255,255,0.65)" },
        ],
      },
      good: {
        tone: "good",
        bgA: "#0b1220",
        bgB: "#1f2937",
        shapes: [
          { kind: "circle", cx: 56, cy: 50, r: 30, fill: "rgba(99,102,241,0.85)", stroke: "rgba(255,255,255,0.18)", strokeWidth: 3 },
          { kind: "rect", x: 86, y: 56, width: 64, height: 26, rx: 10, fill: "rgba(0,0,0,0.35)", stroke: "rgba(255,255,255,0.16)" },
        ],
        text: [{ text: "10X", x: 118, y: 74, size: 18, weight: 900, fill: "white" }],
      },
      firstHit: "The big focal shape (not the words).",
      whyMobileWins: "Legibility survives small sizes; the promise is visible in one glance.",
    },
    {
      title: "One focal point vs multiple competing subjects",
      bad: {
        tone: "bad",
        bgA: "#0f172a",
        bgB: "#475569",
        shapes: [
          { kind: "circle", cx: 42, cy: 38, r: 14, fill: "rgba(251,191,36,0.55)" },
          { kind: "circle", cx: 86, cy: 36, r: 12, fill: "rgba(16,185,129,0.35)" },
          { kind: "circle", cx: 124, cy: 40, r: 13, fill: "rgba(99,102,241,0.35)" },
          { kind: "rect", x: 20, y: 58, width: 120, height: 22, rx: 10, fill: "rgba(0,0,0,0.26)" },
        ],
        text: [
          { text: "WHICH ONE?", x: 26, y: 73, size: 10, weight: 900, fill: "white" },
          { text: "too many things", x: 26, y: 83, size: 8, weight: 700, fill: "rgba(255,255,255,0.7)" },
        ],
      },
      good: {
        tone: "good",
        bgA: "#0b1220",
        bgB: "#1f2937",
        shapes: [
          { kind: "circle", cx: 62, cy: 50, r: 32, fill: "rgba(251,191,36,0.85)", stroke: "rgba(255,255,255,0.18)", strokeWidth: 3 },
          { kind: "rect", x: 98, y: 18, width: 48, height: 18, rx: 8, fill: "rgba(255,255,255,0.10)", stroke: "rgba(255,255,255,0.16)" },
          { kind: "rect", x: 98, y: 46, width: 52, height: 22, rx: 10, fill: "rgba(0,0,0,0.35)", stroke: "rgba(255,255,255,0.16)" },
        ],
        text: [{ text: "ONE", x: 124, y: 62, size: 14, weight: 900, fill: "white" }],
      },
      firstHit: "The largest subject (there is only one).",
      whyMobileWins: "Your viewer does not have to choose what to look at.",
    },
    {
      title: "Low contrast vs clean separation",
      bad: {
        tone: "bad",
        bgA: "#334155",
        bgB: "#475569",
        shapes: [
          { kind: "circle", cx: 58, cy: 50, r: 26, fill: "rgba(148,163,184,0.30)" },
          { kind: "rect", x: 92, y: 56, width: 58, height: 24, rx: 10, fill: "rgba(148,163,184,0.18)" },
        ],
        text: [{ text: "BLENDS IN", x: 98, y: 72, size: 11, weight: 900, fill: "rgba(255,255,255,0.5)" }],
      },
      good: {
        tone: "good",
        bgA: "#0b1220",
        bgB: "#1f2937",
        shapes: [
          { kind: "circle", cx: 58, cy: 50, r: 26, fill: "rgba(251,191,36,0.85)", stroke: "rgba(255,255,255,0.22)", strokeWidth: 4 },
          { kind: "rect", x: 96, y: 56, width: 56, height: 24, rx: 10, fill: "rgba(0,0,0,0.40)", stroke: "rgba(255,255,255,0.16)" },
        ],
        text: [{ text: "POPS", x: 112, y: 72, size: 14, weight: 900, fill: "white" }],
      },
      firstHit: "The high-contrast subject edge.",
      whyMobileWins: "Separation keeps the subject readable even in dark mode feeds.",
    },
    {
      title: "Repeating the title vs adding new meaning",
      bad: {
        tone: "bad",
        bgA: "#0f172a",
        bgB: "#334155",
        shapes: [
          { kind: "rect", x: 16, y: 14, width: 128, height: 26, rx: 10, fill: "rgba(0,0,0,0.28)" },
          { kind: "circle", cx: 132, cy: 56, r: 16, fill: "rgba(255,255,255,0.14)" },
        ],
        text: [
          { text: "HOW TO EDIT VIDEOS", x: 22, y: 31, size: 11, weight: 900, fill: "white" },
          { text: "(same as title)", x: 22, y: 40, size: 8, weight: 700, fill: "rgba(255,255,255,0.65)" },
        ],
      },
      good: {
        tone: "good",
        bgA: "#0b1220",
        bgB: "#1f2937",
        shapes: [
          { kind: "circle", cx: 52, cy: 54, r: 26, fill: "rgba(99,102,241,0.85)", stroke: "rgba(255,255,255,0.18)", strokeWidth: 3 },
          { kind: "rect", x: 88, y: 50, width: 64, height: 30, rx: 12, fill: "rgba(0,0,0,0.40)", stroke: "rgba(255,255,255,0.16)" },
        ],
        text: [{ text: "FAST", x: 120, y: 70, size: 16, weight: 900, fill: "white" }],
      },
      firstHit: "The differentiator word (the new angle).",
      whyMobileWins: "One extra piece of meaning makes the click feel justified.",
    },
    {
      title: "Bad text placement (duration badge) vs safe placement",
      bad: {
        tone: "bad",
        bgA: "#111827",
        bgB: "#334155",
        durationOverlay: true,
        shapes: [
          { kind: "circle", cx: 46, cy: 48, r: 22, fill: "rgba(16,185,129,0.55)" },
          { kind: "rect", x: 104, y: 68, width: 48, height: 18, rx: 8, fill: "rgba(0,0,0,0.38)", stroke: "rgba(255,255,255,0.14)" },
        ],
        text: [{ text: "TEXT", x: 114, y: 81, size: 12, weight: 900, fill: "white" }],
      },
      good: {
        tone: "good",
        bgA: "#0b1220",
        bgB: "#1f2937",
        durationOverlay: true,
        shapes: [
          { kind: "circle", cx: 46, cy: 48, r: 22, fill: "rgba(16,185,129,0.75)", stroke: "rgba(255,255,255,0.18)", strokeWidth: 3 },
          { kind: "rect", x: 92, y: 16, width: 60, height: 22, rx: 10, fill: "rgba(0,0,0,0.40)", stroke: "rgba(255,255,255,0.16)" },
        ],
        text: [{ text: "CLEAR", x: 104, y: 32, size: 12, weight: 900, fill: "white" }],
      },
      firstHit: "The subject and the text (both unobstructed).",
      whyMobileWins: "Nothing important gets covered by UI overlays in the feed.",
    },
    {
      title: "Curiosity without confusion",
      bad: {
        tone: "bad",
        bgA: "#0f172a",
        bgB: "#475569",
        shapes: [
          { kind: "rect", x: 18, y: 18, width: 124, height: 22, rx: 10, fill: "rgba(0,0,0,0.26)" },
          { kind: "circle", cx: 130, cy: 64, r: 18, fill: "rgba(255,255,255,0.12)" },
          { kind: "rect", x: 18, y: 48, width: 62, height: 32, rx: 12, fill: "rgba(255,255,255,0.08)" },
          { kind: "rect", x: 86, y: 50, width: 38, height: 28, rx: 10, fill: "rgba(255,255,255,0.08)" },
        ],
        text: [
          { text: "YOU WON'T BELIEVE THIS", x: 22, y: 34, size: 9, weight: 900, fill: "rgba(255,255,255,0.85)" },
          { text: "??", x: 132, y: 70, size: 16, weight: 900, fill: "rgba(255,255,255,0.75)" },
        ],
      },
      good: {
        tone: "good",
        bgA: "#0b1220",
        bgB: "#1f2937",
        shapes: [
          { kind: "circle", cx: 58, cy: 52, r: 28, fill: "rgba(99,102,241,0.85)", stroke: "rgba(255,255,255,0.18)", strokeWidth: 3 },
          { kind: "rect", x: 92, y: 54, width: 60, height: 26, rx: 10, fill: "rgba(0,0,0,0.42)", stroke: "rgba(255,255,255,0.16)" },
        ],
        text: [{ text: "THE FIX", x: 102, y: 72, size: 12, weight: 900, fill: "white" }],
      },
      firstHit: "The focal subject, then a concrete promise word.",
      whyMobileWins: "Curiosity stays anchored to meaning, not random mystery.",
    },
  ];

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

      {/* 4) Examples: Good vs Bad (original mock thumbnails) */}
      <section id="good-vs-bad-examples" className="sectionTinted">
        <h2 className={s.sectionTitle}>Examples: Good vs Bad (mock thumbnails)</h2>
        <p className={s.sectionText}>
          These are original mock designs. Treat them like pattern recognition drills: what does your eye hit first, and what survives mobile size?
        </p>

        <div className={u.gallery}>
          {examples.map((ex) => (
            <ExamplePair
              key={ex.title}
              title={ex.title}
              bad={ex.bad}
              good={ex.good}
              firstHit={ex.firstHit}
              whyMobileWins={ex.whyMobileWins}
            />
          ))}
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
        <h2 className={s.sectionTitle}>Color & Composition (a practical mini-guide)</h2>
        <p className={s.sectionText}>
          You don’t need theory. You need a few repeatable moves that create separation and intentional framing.
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
