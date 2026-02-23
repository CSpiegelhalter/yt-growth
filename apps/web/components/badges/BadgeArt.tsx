"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import type { BadgeIcon,BadgeRarity } from "@/lib/features/badges";

import s from "./BadgeArt.module.css";

type Props = {
  badgeId: string;
  icon: BadgeIcon;
  rarity: BadgeRarity;
  unlocked: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

/** Rarity-based color schemes */
const RARITY_COLORS: Record<BadgeRarity, {
  primary: string;
  secondary: string;
  glow: string;
  accent: string;
}> = {
  common: {
    primary: "#60a5fa",
    secondary: "#3b82f6",
    glow: "rgba(96, 165, 250, 0.4)",
    accent: "#93c5fd",
  },
  rare: {
    primary: "#a78bfa",
    secondary: "#8b5cf6",
    glow: "rgba(167, 139, 250, 0.5)",
    accent: "#c4b5fd",
  },
  epic: {
    primary: "#f472b6",
    secondary: "#ec4899",
    glow: "rgba(244, 114, 182, 0.5)",
    accent: "#f9a8d4",
  },
  legendary: {
    primary: "#fbbf24",
    secondary: "#f59e0b",
    glow: "rgba(251, 191, 36, 0.6)",
    accent: "#fde68a",
  },
};

const SIZE_MAP = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

const RARITY_CLASS_MAP: Record<BadgeRarity, string> = {
  common: s.common,
  rare: s.rare,
  epic: s.epic,
  legendary: s.legendary,
};

/* ------------------------------------------------------------------ */
/*  Helpers to reduce cyclomatic complexity in the main component     */
/* ------------------------------------------------------------------ */

type IconColors = (typeof RARITY_COLORS)["common"];

type BadgeVisuals = {
  stop0: string;
  stop50: string;
  stop100: string;
  blurStd: number;
  polyStroke: string;
  polyFilter: string | undefined;
  polyClass: string;
  innerStroke: string;
};

function computeBadgeVisuals(
  unlocked: boolean,
  colors: IconColors,
  glowId: string,
): BadgeVisuals {
  if (!unlocked) {
    return {
      stop0: "#9ca3af", stop50: "#6b7280", stop100: "#4b5563",
      blurStd: 0,
      polyStroke: "#6b7280", polyFilter: undefined, polyClass: s.badgeShapeLocked,
      innerStroke: "#9ca3af",
    };
  }
  return {
    stop0: colors.accent, stop50: colors.primary, stop100: colors.secondary,
    blurStd: 4,
    polyStroke: colors.secondary, polyFilter: `url(#${glowId})`, polyClass: s.badgeShape,
    innerStroke: colors.accent,
  };
}

function GlowCircle({ colors }: { colors: IconColors }) {
  return <circle cx="50" cy="50" r="42" fill={colors.glow} className={s.glowCircle} />;
}

function LockOverlay() {
  return (
    <g className={s.lockOverlay}>
      <circle cx="50" cy="50" r="16" fill="#374151" opacity="0.9" />
      <path
        d="M50 42 L50 42 C47.2386 42 45 44.2386 45 47 L45 50 L55 50 L55 47 C55 44.2386 52.7614 42 50 42Z"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="43" y="50" width="14" height="10" rx="2" fill="#9ca3af" />
    </g>
  );
}

function LegendarySparkles() {
  return (
    <g className={s.sparkles}>
      <circle cx="25" cy="20" r="2" fill="#fde68a" className={s.sparkle1} />
      <circle cx="75" cy="25" r="1.5" fill="#fde68a" className={s.sparkle2} />
      <circle cx="80" cy="70" r="2" fill="#fde68a" className={s.sparkle3} />
      <circle cx="20" cy="75" r="1.5" fill="#fde68a" className={s.sparkle4} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon lookup map (replaces 22-case switch)                         */
/* ------------------------------------------------------------------ */

type SvgBaseProps = {
  stroke: string;
  fill: string;
  strokeWidth: number;
  strokeLinecap: "round";
  strokeLinejoin: "round";
};

type IconRenderer = (
  p: SvgBaseProps,
  unlocked: boolean,
  c: IconColors,
) => ReactNode;

const ICON_MAP: Record<string, IconRenderer> = {
  flame: (p, unlocked, c) => (
    <path
      d="M-12 16 C-12 16 -10 8 -8 4 C-4 -4 0 -16 0 -16 C0 -16 4 -4 8 4 C10 8 12 16 12 16 C12 16 8 12 0 12 C-8 12 -12 16 -12 16 Z"
      {...p}
      fill={unlocked ? c.accent : p.fill}
      fillOpacity={0.3}
    />
  ),
  calendar: (p) => (
    <>
      <rect x="-16" y="-12" width="32" height="28" rx="3" {...p} />
      <line x1="-16" y1="-2" x2="16" y2="-2" {...p} />
      <line x1="-8" y1="-18" x2="-8" y2="-8" {...p} />
      <line x1="8" y1="-18" x2="8" y2="-8" {...p} />
    </>
  ),
  rocket: (p) => (
    <path
      d="M0 -18 C8 -10 12 0 12 12 L0 8 L-12 12 C-12 0 -8 -10 0 -18 Z M-8 14 L-12 18 M8 14 L12 18 M0 -4 L0 -4"
      {...p}
    />
  ),
  video: (p) => (
    <>
      <rect x="-18" y="-12" width="28" height="24" rx="3" {...p} />
      <path d="M10 0 L18 -8 L18 8 L10 0 Z" {...p} fill={p.stroke} fillOpacity={0.5} />
    </>
  ),
  shorts: (p) => (
    <>
      <rect x="-10" y="-16" width="20" height="32" rx="3" {...p} />
      <polygon points="-4,-4 6,0 -4,4" fill={p.stroke} />
    </>
  ),
  eye: (p) => (
    <>
      <path d="M-20 0 C-12 -10 12 -10 20 0 C12 10 -12 10 -20 0 Z" {...p} />
      <circle cx="0" cy="0" r="6" {...p} />
    </>
  ),
  users: (p) => (
    <>
      <circle cx="-8" cy="-6" r="6" {...p} />
      <path d="M-18 14 C-18 6 -14 2 -8 2 C-2 2 2 6 2 14" {...p} />
      <circle cx="8" cy="-6" r="6" {...p} />
      <path d="M-2 14 C-2 6 2 2 8 2 C14 2 18 6 18 14" {...p} />
    </>
  ),
  heart: (p, unlocked, c) => (
    <path
      d="M0 -4 C-4 -12 -16 -12 -16 -2 C-16 6 0 16 0 16 C0 16 16 6 16 -2 C16 -12 4 -12 0 -4 Z"
      {...p}
      fill={unlocked ? c.accent : p.fill}
      fillOpacity={0.3}
    />
  ),
  message: (p) => (
    <path
      d="M-16 -10 L16 -10 C18 -10 20 -8 20 -6 L20 8 C20 10 18 12 16 12 L-4 12 L-12 18 L-12 12 L-16 12 C-18 12 -20 10 -20 8 L-20 -6 C-20 -8 -18 -10 -16 -10 Z"
      {...p}
    />
  ),
  chart: (p) => (
    <>
      <path d="M-16 16 L-16 -16" {...p} />
      <path d="M-16 16 L16 16" {...p} />
      <path d="M-12 8 L-4 0 L4 6 L14 -10" {...p} />
    </>
  ),
  target: (p) => (
    <>
      <circle cx="0" cy="0" r="16" {...p} />
      <circle cx="0" cy="0" r="10" {...p} />
      <circle cx="0" cy="0" r="4" {...p} fill={p.stroke} />
    </>
  ),
  star: (p, unlocked, c) => (
    <path
      d="M0 -16 L4 -4 L16 -4 L6 4 L10 16 L0 8 L-10 16 L-6 4 L-16 -4 L-4 -4 Z"
      {...p}
      fill={unlocked ? c.accent : p.fill}
      fillOpacity={0.3}
    />
  ),
  trophy: (p) => (
    <>
      <path d="M-10 -14 L10 -14 L10 0 C10 10 0 14 0 14 C0 14 -10 10 -10 0 L-10 -14 Z" {...p} />
      <path d="M-10 -10 L-16 -10 C-16 -2 -10 2 -10 2" {...p} />
      <path d="M10 -10 L16 -10 C16 -2 10 2 10 2" {...p} />
      <line x1="-6" y1="16" x2="6" y2="16" {...p} />
    </>
  ),
  crown: (p, unlocked, c) => (
    <path
      d="M-16 8 L-12 -8 L-4 0 L0 -16 L4 0 L12 -8 L16 8 L16 14 L-16 14 L-16 8 Z"
      {...p}
      fill={unlocked ? c.accent : p.fill}
      fillOpacity={0.3}
    />
  ),
  zap: (p, unlocked, c) => (
    <path
      d="M4 -16 L-8 2 L2 2 L-4 16 L12 -2 L2 -2 L4 -16 Z"
      {...p}
      fill={unlocked ? c.accent : p.fill}
      fillOpacity={0.3}
    />
  ),
  clock: (p) => (
    <>
      <circle cx="0" cy="0" r="16" {...p} />
      <path d="M0 -8 L0 0 L8 4" {...p} />
    </>
  ),
  trending: (p) => (
    <path
      d="M-16 12 L-6 2 L2 8 L16 -12 M8 -12 L16 -12 L16 -4"
      {...p}
    />
  ),
  sparkle: (p) => (
    <path d="M0 -16 L2 -4 L14 0 L2 4 L0 16 L-2 4 L-14 0 L-2 -4 Z" {...p} fill={p.stroke} fillOpacity={0.3} />
  ),
  seed: (p, unlocked, c) => (
    <>
      <path d="M0 16 L0 0" {...p} />
      <path d="M0 0 C-12 -4 -12 -16 0 -16 C12 -16 12 -4 0 0 Z" {...p} fill={unlocked ? c.accent : p.fill} fillOpacity={0.3} />
      <path d="M-6 12 C-6 8 -2 6 0 6 C2 6 6 8 6 12" {...p} />
    </>
  ),
  medal: (p) => (
    <>
      <circle cx="0" cy="4" r="12" {...p} />
      <path d="M-6 -8 L-10 -16 L-2 -16 L0 -12 L2 -16 L10 -16 L6 -8" {...p} />
    </>
  ),
  lightning: (p, unlocked, c) => (
    <path
      d="M2 -16 L-10 0 L0 0 L-2 16 L10 0 L0 0 L2 -16 Z"
      {...p}
      fill={unlocked ? c.accent : p.fill}
      fillOpacity={0.4}
    />
  ),
  refresh: (p) => (
    <>
      <path d="M16 4 C14 -8 2 -14 -10 -10 C-16 -6 -18 2 -16 8" {...p} />
      <path d="M-16 -4 C-14 8 -2 14 10 10 C16 6 18 -2 16 -8" {...p} />
      <path d="M10 4 L16 4 L16 -2" {...p} />
      <path d="M-10 -4 L-16 -4 L-16 2" {...p} />
    </>
  ),
};

/* ------------------------------------------------------------------ */
/*  BadgeIconSvg - simplified with lookup map                         */
/* ------------------------------------------------------------------ */

function BadgeIconSvg({
  icon,
  unlocked,
  colors,
}: {
  icon: BadgeIcon;
  unlocked: boolean;
  colors: IconColors;
}) {
  const stroke = unlocked ? "#fff" : "#9ca3af";
  const props: SvgBaseProps = {
    stroke,
    fill: "none",
    strokeWidth: 4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const renderer = ICON_MAP[icon as string];
  return renderer
    ? <>{renderer(props, unlocked, colors)}</>
    : <circle cx="0" cy="0" r="12" {...props} />;
}

/* ------------------------------------------------------------------ */
/*  BadgeArt - main component                                         */
/* ------------------------------------------------------------------ */

export default function BadgeArt({
  badgeId,
  icon,
  rarity,
  unlocked,
  size = "md",
  className = "",
}: Props) {
  const colors = RARITY_COLORS[rarity];
  const px = SIZE_MAP[size];
  const rarityClass = useMemo(
    () => (unlocked ? RARITY_CLASS_MAP[rarity] : s.locked),
    [rarity, unlocked],
  );

  const gradientId = `grad-${badgeId}`;
  const glowId = `glow-${badgeId}`;
  const v = computeBadgeVisuals(unlocked, colors, glowId);
  const showHighRarityFx = unlocked && (rarity === "epic" || rarity === "legendary");
  const showSparkles = unlocked && rarity === "legendary";

  return (
    <div
      className={`${s.badgeWrap} ${rarityClass} ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 100 100"
        width={px}
        height={px}
        className={s.badgeSvg}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={v.stop0} />
            <stop offset="50%" stopColor={v.stop50} />
            <stop offset="100%" stopColor={v.stop100} />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={v.blurStd} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <clipPath id="hexClip">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />
          </clipPath>
        </defs>

        {showHighRarityFx && <GlowCircle colors={colors} />}

        <polygon
          points="50,8 88,28 88,72 50,92 12,72 12,28"
          fill={`url(#${gradientId})`}
          stroke={v.polyStroke}
          strokeWidth="2"
          filter={v.polyFilter}
          className={v.polyClass}
        />

        <polygon
          points="50,16 80,32 80,68 50,84 20,68 20,32"
          fill="none"
          stroke={v.innerStroke}
          strokeWidth="1"
          opacity={0.5}
        />

        <g transform="translate(50, 50) scale(0.55)" className={s.iconGroup}>
          <BadgeIconSvg icon={icon} unlocked={unlocked} colors={colors} />
        </g>

        {!unlocked && <LockOverlay />}
        {showSparkles && <LegendarySparkles />}
      </svg>

      {showHighRarityFx && <div className={s.shineOverlay} />}
    </div>
  );
}
