/**
 * Body content for YouTube Video Ideas article.
 * Server component - no "use client" directive.
 *
 * Workshop / idea lab vibe with lightweight visuals and playful metaphors.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE SVG VISUALS
   Lightweight, mobile-friendly, no external assets
   ───────────────────────────────────────────────────────────────────────────── */

function IdeaGraveyardSvg() {
  return (
    <svg
      width="340"
      height="150"
      viewBox="0 0 340 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Idea graveyard showing common mistakes that kill video ideas"
      style={{ display: "block", margin: "0 auto" }}
    >
      {/* Sky gradient */}
      <rect width="340" height="150" fill="url(#skyGradient)" />

      {/* Moon */}
      <circle cx="300" cy="28" r="16" fill="#fef3c7" opacity="0.8" />
      <circle cx="304" cy="25" r="12" fill="url(#skyGradient)" />

      {/* Tombstone 1 - Celtic cross style */}
      <g>
        <rect x="20" y="75" width="50" height="60" rx="2" fill="#64748b" />
        <rect x="30" y="50" width="30" height="30" rx="2" fill="#64748b" />
        <circle cx="45" cy="45" r="14" fill="#64748b" />
        <circle cx="45" cy="45" r="9" fill="#4b5563" />
        <rect x="40" y="36" width="10" height="40" fill="#64748b" />
        <rect x="30" y="45" width="30" height="8" fill="#64748b" />
        <text x="45" y="80" textAnchor="middle" fontSize="6" fontWeight="500" fill="#94a3b8">R.I.P.</text>
        <text x="45" y="94" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1f2937">No</text>
        <text x="45" y="106" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1f2937">Demand</text>
      </g>

      {/* Tombstone 2 - Classic rounded */}
      <g>
        <path d="M95 135 L95 70 Q95 50, 120 50 Q145 50, 145 70 L145 135 Z" fill="#78716c" />
        <path d="M100 135 L100 73 Q100 57, 120 57 Q140 57, 140 73 L140 135 Z" fill="#57534e" />
        <ellipse cx="120" cy="67" rx="7" ry="5" fill="#78716c" />
        <text x="120" y="80" textAnchor="middle" fontSize="6" fontWeight="500" fill="#a8a29e">HERE LIES</text>
        <text x="120" y="94" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e7e5e4">Copied</text>
        <text x="120" y="106" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e7e5e4">Ideas</text>
      </g>

      {/* Tombstone 3 - Gothic arch */}
      <g>
        <path d="M175 135 L175 65 Q175 45, 200 40 Q225 45, 225 65 L225 135 Z" fill="#71717a" />
        <path d="M180 135 L180 68 Q180 52, 200 48 Q220 52, 220 68 L220 135 Z" fill="#52525b" />
        <text x="200" y="70" textAnchor="middle" fontSize="6" fontWeight="500" fill="#a1a1aa">LOST</text>
        <text x="200" y="86" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e4e4e7">No</text>
        <text x="200" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e4e4e7">Angle</text>
      </g>

      {/* Tombstone 4 - Simple slab */}
      <g>
        <rect x="255" y="60" width="60" height="75" rx="3" fill="#6b7280" />
        <rect x="260" y="65" width="50" height="65" rx="2" fill="#4b5563" />
        <text x="285" y="78" textAnchor="middle" fontSize="5" fontWeight="500" fill="#9ca3af">STUCK IN</text>
        <text x="285" y="87" textAnchor="middle" fontSize="5" fontWeight="500" fill="#9ca3af">DRAFT</text>
        <text x="285" y="103" textAnchor="middle" fontSize="9" fontWeight="700" fill="#d4d4d8">Over-</text>
        <text x="285" y="114" textAnchor="middle" fontSize="9" fontWeight="700" fill="#d4d4d8">thought</text>
      </g>

      {/* Ground layer - covers bottom of tombstones */}
      <path d="M0 115 Q85 108, 170 115 Q255 122, 340 115 L340 150 L0 150 Z" fill="#4b5563" />
      <path d="M0 118 Q85 112, 170 118 Q255 125, 340 118 L340 150 L0 150 Z" fill="#374151" />

      {/* Dirt mounds at base of each tombstone */}
      <ellipse cx="45" cy="120" rx="20" ry="5" fill="#4b5563" />
      <ellipse cx="120" cy="122" rx="22" ry="6" fill="#4b5563" />
      <ellipse cx="200" cy="120" rx="20" ry="5" fill="#4b5563" />
      <ellipse cx="285" cy="119" rx="24" ry="5" fill="#4b5563" />

      {/* Fog effect */}
      <ellipse cx="80" cy="130" rx="50" ry="10" fill="white" opacity="0.12" />
      <ellipse cx="200" cy="135" rx="70" ry="12" fill="white" opacity="0.08" />
      <ellipse cx="300" cy="132" rx="45" ry="8" fill="white" opacity="0.1" />

      {/* Small grass tufts */}
      <path d="M10 120 L13 112 L16 120" stroke="#52525b" strokeWidth="1.5" fill="none" />
      <path d="M155 118 L158 110 L161 118" stroke="#52525b" strokeWidth="1.5" fill="none" />
      <path d="M240 116 L243 108 L246 116" stroke="#52525b" strokeWidth="1.5" fill="none" />
      <path d="M330 119 L333 111 L336 119" stroke="#52525b" strokeWidth="1.5" fill="none" />

      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function GoofyChefSvg() {
  return (
    <svg
      width="320"
      height="190"
      viewBox="0 0 320 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Chef presenting video idea recipe"
      style={{ display: "block", margin: "0 auto 24px" }}
    >
      {/* Recipe card */}
      <g>
        <rect x="130" y="25" width="180" height="155" rx="8" fill="#fffbeb" stroke="#fde68a" strokeWidth="2" />
        <rect x="130" y="25" width="180" height="32" rx="8" fill="#fef3c7" />
        <path d="M130 49 L310 49" stroke="#fde68a" strokeWidth="1" />
        <text x="220" y="47" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e">
          Video Idea Recipe
        </text>

        {/* Ingredients - 2x2 grid, all text inside card */}
        {/* Row 1 */}
        <g>
          <circle cx="152" cy="75" r="9" fill="#6366f1" />
          <text x="152" y="79" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">1</text>
          <text x="168" y="75" fontSize="11" fontWeight="600" fill="#1f2937">Promise</text>
          <text x="168" y="88" fontSize="8" fill="#64748b">What viewers get</text>
        </g>

        <g>
          <circle cx="236" cy="75" r="9" fill="#8b5cf6" />
          <text x="236" y="79" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">2</text>
          <text x="252" y="75" fontSize="11" fontWeight="600" fill="#1f2937">Stakes</text>
          <text x="252" y="88" fontSize="8" fill="#64748b">Why it matters</text>
        </g>

        {/* Row 2 */}
        <g>
          <circle cx="152" cy="120" r="9" fill="#a855f7" />
          <text x="152" y="124" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">3</text>
          <text x="168" y="120" fontSize="11" fontWeight="600" fill="#1f2937">Novelty</text>
          <text x="168" y="133" fontSize="8" fill="#64748b">Your angle</text>
        </g>

        <g>
          <circle cx="236" cy="120" r="9" fill="#c026d3" />
          <text x="236" y="124" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">4</text>
          <text x="252" y="120" fontSize="10" fontWeight="600" fill="#1f2937">Limits</text>
          <text x="252" y="132" fontSize="8" fill="#64748b">Constraints</text>
        </g>

        {/* Decorative corner fold */}
        <path d="M290 160 L310 160 L310 180 Z" fill="#fde68a" />
        <path d="M290 160 L310 180" stroke="#f59e0b" strokeWidth="1" />
      </g>

      {/* Chef character - more polished cartoon style */}
      <g>
        {/* Shadow under chef */}
        <ellipse cx="60" cy="182" rx="40" ry="6" fill="#1f2937" opacity="0.1" />

        {/* Chef coat/body */}
        <path d="M25 105 Q20 140, 25 175 L95 175 Q100 140, 95 105 Q85 95, 60 95 Q35 95, 25 105 Z" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />

        {/* Double breasted buttons */}
        <circle cx="45" cy="125" r="4" fill="#1f2937" />
        <circle cx="75" cy="125" r="4" fill="#1f2937" />
        <circle cx="45" cy="145" r="4" fill="#1f2937" />
        <circle cx="75" cy="145" r="4" fill="#1f2937" />
        <circle cx="45" cy="165" r="4" fill="#1f2937" />
        <circle cx="75" cy="165" r="4" fill="#1f2937" />

        {/* Neck/collar */}
        <path d="M45 95 L50 85 L70 85 L75 95" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
        <path d="M48 92 L55 98 L60 92 L65 98 L72 92" stroke="#e5e7eb" strokeWidth="1" fill="none" />

        {/* Head */}
        <ellipse cx="60" cy="60" rx="28" ry="30" fill="#fcd9b6" />

        {/* Ears */}
        <ellipse cx="32" cy="60" rx="6" ry="8" fill="#fcd9b6" />
        <ellipse cx="88" cy="60" rx="6" ry="8" fill="#fcd9b6" />
        <ellipse cx="32" cy="60" rx="3" ry="5" fill="#f5c09d" />
        <ellipse cx="88" cy="60" rx="3" ry="5" fill="#f5c09d" />

        {/* Chef hat - toque */}
        <ellipse cx="60" cy="32" rx="30" ry="8" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
        <path d="M30 32 Q30 5, 60 5 Q90 5, 90 32" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
        {/* Hat pleats */}
        <path d="M38 28 Q40 15, 45 10" stroke="#f3f4f6" strokeWidth="2" fill="none" />
        <path d="M55 28 Q55 12, 60 8" stroke="#f3f4f6" strokeWidth="2" fill="none" />
        <path d="M72 28 Q70 15, 65 10" stroke="#f3f4f6" strokeWidth="2" fill="none" />

        {/* Eyebrows - one raised */}
        <path d="M42 45 Q50 42, 55 46" stroke="#7c5a3d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M65 43 Q72 40, 78 44" stroke="#7c5a3d" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="50" cy="55" rx="7" ry="8" fill="white" />
        <ellipse cx="72" cy="55" rx="7" ry="8" fill="white" />
        {/* Pupils - looking at recipe */}
        <circle cx="53" cy="55" r="4" fill="#3f3f46" />
        <circle cx="75" cy="55" r="4" fill="#3f3f46" />
        {/* Eye shine */}
        <circle cx="54" cy="53" r="1.5" fill="white" />
        <circle cx="76" cy="53" r="1.5" fill="white" />

        {/* Nose */}
        <ellipse cx="60" cy="65" rx="5" ry="4" fill="#f5c09d" />
        <path d="M55 67 Q60 70, 65 67" stroke="#e5a988" strokeWidth="1" fill="none" />

        {/* Mustache - fancy handlebar */}
        <path d="M45 72 Q52 78, 60 74 Q68 78, 75 72" stroke="#5c4033" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M43 71 Q40 68, 38 70" stroke="#5c4033" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M77 71 Q80 68, 82 70" stroke="#5c4033" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Smile */}
        <path d="M48 78 Q60 88, 72 78" stroke="#b45b3e" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Teeth hint */}
        <path d="M52 80 L68 80" stroke="white" strokeWidth="2" />

        {/* Cheek blush */}
        <ellipse cx="40" cy="68" rx="6" ry="4" fill="#fca5a5" opacity="0.4" />
        <ellipse cx="80" cy="68" rx="6" ry="4" fill="#fca5a5" opacity="0.4" />

        {/* Arm pointing */}
        <path d="M95 115 Q105 105, 125 100" stroke="#fcd9b6" strokeWidth="12" fill="none" strokeLinecap="round" />
        {/* Hand */}
        <circle cx="125" cy="100" r="8" fill="#fcd9b6" />
        {/* Pointing finger */}
        <path d="M130 98 L140 95" stroke="#fcd9b6" strokeWidth="5" strokeLinecap="round" />
        {/* Cuff */}
        <ellipse cx="98" cy="115" rx="8" ry="5" fill="white" stroke="#e5e7eb" strokeWidth="1" />
      </g>
    </svg>
  );
}

function DetectiveBoardSvg() {
  return (
    <svg
      width="300"
      height="140"
      viewBox="0 0 300 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Detective board connecting analytics, competitors, comments, and search"
      style={{ display: "block", margin: "0 auto 24px" }}
    >
      {/* Cork board background */}
      <rect x="10" y="10" width="280" height="120" rx="4" fill="#d4a574" opacity="0.3" />
      <rect x="10" y="10" width="280" height="120" rx="4" stroke="#d4a574" strokeWidth="2" fill="none" />

      {/* Strings connecting clues */}
      <line x1="75" y1="50" x2="150" y2="70" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
      <line x1="225" y1="50" x2="150" y2="70" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
      <line x1="75" y1="100" x2="150" y2="70" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
      <line x1="225" y1="100" x2="150" y2="70" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />

      {/* Center: Idea lightbulb */}
      <circle cx="150" cy="70" r="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="150" y="75" textAnchor="middle" fontSize="10" fontWeight="700" fill="#92400e">IDEA</text>

      {/* Clue cards */}
      <rect x="40" y="30" width="70" height="40" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="75" y="50" textAnchor="middle" fontSize="9" fontWeight="600" fill="#374151">Analytics</text>
      <circle cx="50" cy="32" r="4" fill="#ef4444" />

      <rect x="190" y="30" width="70" height="40" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="225" y="50" textAnchor="middle" fontSize="9" fontWeight="600" fill="#374151">Competitors</text>
      <circle cx="200" cy="32" r="4" fill="#ef4444" />

      <rect x="40" y="80" width="70" height="40" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="75" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#374151">Comments</text>
      <circle cx="50" cy="82" r="4" fill="#ef4444" />

      <rect x="190" y="80" width="70" height="40" rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="225" y="100" textAnchor="middle" fontSize="9" fontWeight="600" fill="#374151">Search</text>
      <circle cx="200" cy="82" r="4" fill="#ef4444" />
    </svg>
  );
}

function IdeaVendingMachineSvg() {
  return (
    <svg
      width="280"
      height="195"
      viewBox="0 0 280 195"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Vending machine dispensing video frameworks"
      style={{ display: "block", margin: "0 auto 20px" }}
    >
      {/* Machine body */}
      <rect x="40" y="15" width="200" height="160" rx="8" fill="#374151" />
      <rect x="50" y="25" width="180" height="100" rx="4" fill="#1f2937" />

      {/* Glass window effect */}
      <rect x="50" y="25" width="180" height="100" rx="4" fill="url(#glassGradient)" opacity="0.3" />

      {/* Framework items on shelves */}
      {/* Row 1 */}
      <rect x="60" y="35" width="50" height="25" rx="3" fill="#f59e0b" />
      <text x="85" y="52" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Compare</text>

      <rect x="115" y="35" width="50" height="25" rx="3" fill="#10b981" />
      <text x="140" y="52" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Challenge</text>

      <rect x="170" y="35" width="50" height="25" rx="3" fill="#6366f1" />
      <text x="195" y="52" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Speedrun</text>

      {/* Row 2 */}
      <rect x="60" y="65" width="50" height="25" rx="3" fill="#ef4444" />
      <text x="85" y="82" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Teardown</text>

      <rect x="115" y="65" width="50" height="25" rx="3" fill="#8b5cf6" />
      <text x="140" y="82" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Myth Bust</text>

      <rect x="170" y="65" width="50" height="25" rx="3" fill="#ec4899" />
      <text x="195" y="82" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Beginner</text>

      {/* Row 3 */}
      <rect x="88" y="95" width="50" height="25" rx="3" fill="#14b8a6" />
      <text x="113" y="112" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Ranking</text>

      <rect x="143" y="95" width="50" height="25" rx="3" fill="#f97316" />
      <text x="168" y="112" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">BTS</text>

      {/* Dispenser slot */}
      <rect x="90" y="135" width="100" height="30" rx="4" fill="#111827" />
      <text x="140" y="155" textAnchor="middle" fontSize="9" fontWeight="500" fill="#6b7280">Pick a framework</text>

      {/* Coin slot */}
      <rect x="245" y="65" width="15" height="40" rx="2" fill="#4b5563" />
      <ellipse cx="252" cy="85" rx="4" ry="8" fill="#1f2937" />

      {/* Machine label */}
      <text x="140" y="188" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6b7280">FRAMEWORK-O-MATIC</text>

      <defs>
        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NicheMenuSvg() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Niche menu showing content categories"
      style={{ display: "block", margin: "0 auto 16px" }}
    >
      {/* Menu background */}
      <rect x="20" y="10" width="160" height="100" rx="4" fill="#fef7ed" stroke="#f59e0b" strokeWidth="1" />

      {/* Header */}
      <text x="100" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400e" fontStyle="italic">
        Today&apos;s Niches
      </text>
      <line x1="40" y1="38" x2="160" y2="38" stroke="#f59e0b" strokeWidth="1" />

      {/* Menu items */}
      <text x="40" y="55" fontSize="9" fill="#78350f">Tech ............ tutorials</text>
      <text x="40" y="70" fontSize="9" fill="#78350f">Gaming ......... guides</text>
      <text x="40" y="85" fontSize="9" fill="#78350f">Finance ....... tips</text>
      <text x="40" y="100" fontSize="9" fill="#78350f">Cooking ....... recipes</text>
    </svg>
  );
}

function TrendRadarSvg() {
  return (
    <svg
      width="200"
      height="160"
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Radar scanning for trending topics"
      style={{ display: "block", margin: "0 auto 16px" }}
    >
      {/* Radar screen */}
      <circle cx="100" cy="80" r="65" fill="#0f172a" />
      <circle cx="100" cy="80" r="65" stroke="#334155" strokeWidth="2" />

      {/* Concentric rings */}
      <circle cx="100" cy="80" r="50" stroke="#334155" strokeWidth="1" fill="none" />
      <circle cx="100" cy="80" r="35" stroke="#334155" strokeWidth="1" fill="none" />
      <circle cx="100" cy="80" r="20" stroke="#334155" strokeWidth="1" fill="none" />

      {/* Cross lines */}
      <line x1="100" y1="15" x2="100" y2="145" stroke="#334155" strokeWidth="1" />
      <line x1="35" y1="80" x2="165" y2="80" stroke="#334155" strokeWidth="1" />

      {/* Radar sweep */}
      <path d="M100 80 L100 20 A60 60 0 0 1 145 50 Z" fill="url(#sweepGradient)" opacity="0.6" />

      {/* Blips - trending topics */}
      <circle cx="120" cy="55" r="5" fill="#10b981">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="70" cy="95" r="4" fill="#f59e0b">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="130" cy="100" r="3" fill="#6366f1">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
      </circle>

      {/* Center dot */}
      <circle cx="100" cy="80" r="4" fill="#10b981" />

      {/* Label */}
      <text x="100" y="155" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">Trend Radar</text>

      <defs>
        <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BODY COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Ideas Fail */}
      <section id="why-ideas-fail" className={s.section}>
        <h2 className={s.sectionTitle}>Why Most Video Ideas Fail</h2>
        <p className={s.sectionText}>
          Most creators brainstorm ideas based on gut feeling or what they personally
          find interesting. The problem is that your interests do not always align
          with what your audience searches for or what the algorithm promotes.
        </p>
        <p className={s.sectionText}>
          Data driven idea generation flips this approach. Instead of guessing what
          might work, you start with what your audience already engages with. You
          study what performs well in your niche, identify patterns, and create
          content where demand is proven.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            A mediocre video on a great topic will outperform an excellent video on a topic nobody cares about.
          </p>
        </div>

        <h3 className={s.subheading}>Common Idea Generation Mistakes</h3>

        <IdeaGraveyardSvg />

        <div className="mistakeCardGrid">
          <div className="mistakeCard">
            <h4 className="mistakeCard__title">Making videos only you care about</h4>
            <p className="mistakeCard__text">Validate demand first. Your interests matter, but audience interest determines views.</p>
          </div>
          <div className="mistakeCard">
            <h4 className="mistakeCard__title">Copying competitors directly</h4>
            <p className="mistakeCard__text">Learn patterns, not executions. Your version should be different and better.</p>
          </div>
          <div className="mistakeCard">
            <h4 className="mistakeCard__title">Ignoring your own analytics</h4>
            <p className="mistakeCard__text">Make more content like your hits. Your past successes show what your audience wants.</p>
          </div>
          <div className="mistakeCard">
            <h4 className="mistakeCard__title">Chasing trends you cannot execute</h4>
            <p className="mistakeCard__text">A trending topic only helps if you can make quality content on it quickly.</p>
          </div>
          <div className="mistakeCard">
            <h4 className="mistakeCard__title">Overthinking before starting</h4>
            <p className="mistakeCard__text">Limit research time, then ship. You learn more from publishing than from planning.</p>
          </div>
          <div className="mistakeCard">
            <h4 className="mistakeCard__title">Saturated topics, no differentiation</h4>
            <p className="mistakeCard__text">If 1000 videos exist on your topic, you need a unique angle to stand out.</p>
          </div>
        </div>
      </section>

      {/* Idea Framework */}
      <section id="idea-framework" className={s.section}>
        <h2 className={s.sectionTitle}>The Video Idea Recipe</h2>
        <p className={s.sectionText}>
          Every strong video idea has four ingredients. When evaluating potential
          topics, check that each element is present and compelling.
        </p>

        <GoofyChefSvg />

        <div className="ingredientCards">
          <div className="ingredientCard ingredientCard--promise">
            <span className="ingredientCard__number">1</span>
            <div className="ingredientCard__content">
              <h3 className="ingredientCard__title">Viewer Promise</h3>
              <p className="ingredientCard__text">
                What will viewers get? Be specific. Not &quot;learn about cameras&quot; but
                &quot;choose the right camera for your budget without wasting money.&quot;
              </p>
            </div>
          </div>

          <div className="ingredientCard ingredientCard--stakes">
            <span className="ingredientCard__number">2</span>
            <div className="ingredientCard__content">
              <h3 className="ingredientCard__title">Stakes</h3>
              <p className="ingredientCard__text">
                Why does this matter? What happens if they do not know this? Stakes create
                urgency. &quot;The settings ruining your photos without you knowing.&quot;
              </p>
            </div>
          </div>

          <div className="ingredientCard ingredientCard--novelty">
            <span className="ingredientCard__number">3</span>
            <div className="ingredientCard__content">
              <h3 className="ingredientCard__title">Novelty</h3>
              <p className="ingredientCard__text">
                What makes your angle different? A new method, contrarian opinion, specific
                constraint, personal experience, or fresh combination of ideas.
              </p>
            </div>
          </div>

          <div className="ingredientCard ingredientCard--constraints">
            <span className="ingredientCard__number">4</span>
            <div className="ingredientCard__content">
              <h3 className="ingredientCard__title">Constraints</h3>
              <p className="ingredientCard__text">
                Constraints make ideas clickable. Compare &quot;learn photography&quot; with
                &quot;learn portrait photography in 7 days with just your phone.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Data-Driven Sources */}
      <section id="idea-sources" className={s.section}>
        <h2 className={s.sectionTitle}>Where to Find Validated Ideas</h2>
        <p className={s.sectionText}>
          Stop guessing. These sources provide ideas based on real viewer behavior.
        </p>

        <DetectiveBoardSvg />

        <div className="sourceCards">
          <div className="sourceCard">
            <div className="sourceCard__icon sourceCard__icon--analytics">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <div className="sourceCard__content">
              <h3 className="sourceCard__title">Your Own Analytics</h3>
              <p className="sourceCard__text">
                Your top performers show what your audience wants. Look for videos with
                high CTR even if views are modest. That packaging worked.
              </p>
            </div>
          </div>

          <div className="sourceCard">
            <div className="sourceCard__icon sourceCard__icon--competitors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="sourceCard__content">
              <h3 className="sourceCard__title">Competitor Outliers</h3>
              <p className="sourceCard__text">
                Channel averaging 10K views has one with 100K? That topic has unusual pull.
                Study what made it work. See our <Link href="/learn/youtube-competitor-analysis">competitor analysis guide</Link>.
              </p>
            </div>
          </div>

          <div className="sourceCard">
            <div className="sourceCard__icon sourceCard__icon--search">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <div className="sourceCard__content">
              <h3 className="sourceCard__title">YouTube Search Suggestions</h3>
              <p className="sourceCard__text">
                Autocomplete shows real queries with real volume. Try the alphabet trick:
                type your topic + a, then b, then c. Each letter surfaces different suggestions.
              </p>
            </div>
          </div>

          <div className="sourceCard">
            <div className="sourceCard__icon sourceCard__icon--comments">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="sourceCard__content">
              <h3 className="sourceCard__title">Comments on Popular Videos</h3>
              <p className="sourceCard__text">
                &quot;Can you make a video about X?&quot; with 200 likes = demand from hundreds
                of potential viewers. They are telling you exactly what they want.
              </p>
            </div>
          </div>

          <div className="sourceCard">
            <div className="sourceCard__icon sourceCard__icon--adjacent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div className="sourceCard__content">
              <h3 className="sourceCard__title">Adjacent Niches</h3>
              <p className="sourceCard__text">
                Day-in-the-life trending in fitness? Could work for your cooking channel.
                Cross-pollinating formats makes content feel fresh while using proven structures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Find Trending Videos */}
      <section id="find-trending" className={s.section}>
        <h2 className={s.sectionTitle}>Spotting Trends Before They Peak</h2>
        <p className={s.sectionText}>
          Trending topics represent current viewer interest. Finding them early
          lets you create timely content before oversaturation.
        </p>

        <TrendRadarSvg />

        <div className="trendSignals">
          <div className="trendSignal">
            <div className="trendSignal__badge trendSignal__badge--hot">Hot Signal</div>
            <h4 className="trendSignal__title">Outlier Performance</h4>
            <p className="trendSignal__text">
              A channel normally gets 20K views. Recent video has 50K. That topic has
              unusual pull worth investigating.
            </p>
          </div>

          <div className="trendSignal">
            <div className="trendSignal__badge trendSignal__badge--hot">Hot Signal</div>
            <h4 className="trendSignal__title">Velocity Matters</h4>
            <p className="trendSignal__text">
              50K views in one week indicates stronger demand than 50K over six months.
              Speed of accumulation reveals current interest.
            </p>
          </div>

          <div className="trendSignal">
            <div className="trendSignal__badge trendSignal__badge--caution">Caution</div>
            <h4 className="trendSignal__title">Recency Check</h4>
            <p className="trendSignal__text">
              A viral video from last year may not reflect current interest. Validate that
              strong performance happened recently.
            </p>
          </div>

          <div className="trendSignal">
            <div className="trendSignal__badge trendSignal__badge--action">Action</div>
            <h4 className="trendSignal__title">Extract the Angle</h4>
            <p className="trendSignal__text">
              What made this video different? Title framing, thumbnail, format? Identify
              the pattern, then apply your unique perspective.
            </p>
          </div>
        </div>
      </section>

      {/* Idea Frameworks */}
      <section id="idea-frameworks" className={s.section}>
        <h2 className={s.sectionTitle}>8 Frameworks That Work</h2>
        <p className={s.sectionText}>
          Proven structures you can apply to any niche. Each taps into fundamental
          viewer motivations.
        </p>

        <IdeaVendingMachineSvg />

        <div className="frameworkGrid">
          <div className="frameworkCard frameworkCard--compare">
            <h3 className="frameworkCard__title">Comparison</h3>
            <p className="frameworkCard__example">X vs Y</p>
            <p className="frameworkCard__text">
              Help viewers decide. iPhone vs Android, Budget vs Expensive. Introduce both,
              test on criteria, declare winners for different use cases.
            </p>
          </div>

          <div className="frameworkCard frameworkCard--challenge">
            <h3 className="frameworkCard__title">Challenge</h3>
            <p className="frameworkCard__example">I tried X for Y days</p>
            <p className="frameworkCard__text">
              Natural story structure with stakes. Viewers want to see the outcome. Did
              waking at 5am actually change anything?
            </p>
          </div>

          <div className="frameworkCard frameworkCard--speedrun">
            <h3 className="frameworkCard__title">Speedrun</h3>
            <p className="frameworkCard__example">How fast can you...</p>
            <p className="frameworkCard__text">
              Time pressure creates urgency. Learning piano in 24 hours proves goals are
              achievable and makes viewers believe they can too.
            </p>
          </div>

          <div className="frameworkCard frameworkCard--teardown">
            <h3 className="frameworkCard__title">Teardown</h3>
            <p className="frameworkCard__example">Why this worked</p>
            <p className="frameworkCard__text">
              Analyze successful examples. Why this video went viral. Viewers learn through
              your analysis and get inside access.
            </p>
          </div>

          <div className="frameworkCard frameworkCard--myth">
            <h3 className="frameworkCard__title">Myth Busting</h3>
            <p className="frameworkCard__example">Everyone gets this wrong</p>
            <p className="frameworkCard__text">
              Challenge common beliefs. Contrarian content stands out and triggers curiosity.
              The lie about X costing you money.
            </p>
          </div>

          <div className="frameworkCard frameworkCard--beginner">
            <h3 className="frameworkCard__title">Beginner to Pro</h3>
            <p className="frameworkCard__example">Complete guide</p>
            <p className="frameworkCard__text">
              Show the progression. What I wish I knew when I started. Serves all skill
              levels and positions you as an authority.
            </p>
          </div>

          <div className="frameworkCard frameworkCard--ranking">
            <h3 className="frameworkCard__title">Ranking</h3>
            <p className="frameworkCard__example">Tier list / best to worst</p>
            <p className="frameworkCard__text">
              Rankings create debate. Viewers agree, disagree, comment. Every camera ranked.
              Engagement baked in.
            </p>
          </div>

          <div className="frameworkCard frameworkCard--bts">
            <h3 className="frameworkCard__title">Behind the Scenes</h3>
            <p className="frameworkCard__example">How I actually...</p>
            <p className="frameworkCard__text">
              Show the process others hide. The real cost of making content. Transparency
              builds trust.
            </p>
          </div>
        </div>
      </section>

      {/* Validating Ideas */}
      <section id="validating-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>Should You Make This Video?</h2>
        <p className={s.sectionText}>
          Before committing to any idea, run it through these filters.
        </p>

        <div className="validationFilters">
          <div className="validationFilter validationFilter--demand">
            <h3 className="validationFilter__title">Demand Check</h3>
            <div className="validationFilter__question">Do people actually want this?</div>
            <p className="validationFilter__text">
              Search suggestions exist? Competitors had success? Comments requesting it?
              No evidence = no demand = skip it.
            </p>
          </div>

          <div className="validationFilter validationFilter--competition">
            <h3 className="validationFilter__title">Competition Check</h3>
            <div className="validationFilter__question">Can you compete?</div>
            <p className="validationFilter__text">
              Only mega channels ranking? Probably too competitive. Smaller creators
              appearing in results? There is room for you.
            </p>
          </div>

          <div className="validationFilter validationFilter--fit">
            <h3 className="validationFilter__title">Audience Fit</h3>
            <div className="validationFilter__question">Will your subscribers care?</div>
            <p className="validationFilter__text">
              Off-brand topics confuse the algorithm and your audience. Does this match
              what people subscribed for?
            </p>
          </div>

          <div className="validationFilter validationFilter--packaging">
            <h3 className="validationFilter__title">Packaging Test</h3>
            <div className="validationFilter__question">Can you imagine the thumbnail?</div>
            <p className="validationFilter__text">
              If you cannot write a compelling title or picture a clickable thumbnail,
              the idea needs refinement.
            </p>
          </div>
        </div>

        <div className="pullQuote" style={{ marginTop: "var(--space-6)" }}>
          When scores are close, pick the one you are most excited to make. Enthusiasm affects quality.
        </div>
      </section>

      {/* Shorts Ideas */}
      <section id="shorts-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Shorts Ideas</h2>
        <p className={s.sectionText}>
          Under 60 seconds to deliver value. The best Shorts ideas are single
          concepts executed quickly and memorably.
        </p>

        <div className="shortsFormats">
          <div className="shortsFormat">
            <h3 className="shortsFormat__title">Quick Win</h3>
            <p className="shortsFormat__text">One tip that solves a specific problem in 30 seconds</p>
          </div>
          <div className="shortsFormat">
            <h3 className="shortsFormat__title">Mistake Fix</h3>
            <p className="shortsFormat__text">Common mistake and the fix shown side by side</p>
          </div>
          <div className="shortsFormat">
            <h3 className="shortsFormat__title">Before/After</h3>
            <p className="shortsFormat__text">Transformation reveal with dramatic results</p>
          </div>
          <div className="shortsFormat">
            <h3 className="shortsFormat__title">Hot Take</h3>
            <p className="shortsFormat__text">Opinion that sparks discussion and comments</p>
          </div>
          <div className="shortsFormat">
            <h3 className="shortsFormat__title">Teaser</h3>
            <p className="shortsFormat__text">Best moment from your long-form video</p>
          </div>
          <div className="shortsFormat">
            <h3 className="shortsFormat__title">Surprising Fact</h3>
            <p className="shortsFormat__text">Challenges assumptions people take for granted</p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "var(--space-5)" }}>
          <p className="realTalk__label">Pipeline Strategy</p>
          <p className="realTalk__text">
            Create Shorts that introduce a concept, then link to a detailed long-form video.
            Turns casual viewers into channel subscribers.
          </p>
        </div>
      </section>

      {/* Niche Ideas */}
      <section id="niche-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Niche Ideas</h2>
        <p className={s.sectionText}>
          Starting a channel? These categories have proven audiences. Success depends
          on finding a specific angle within these broad areas.
        </p>

        <NicheMenuSvg />

        <div className="nicheCategoryGrid">
          <div className="nicheCategory">
            <strong>Technology</strong>
            <span>Reviews, tutorials, tech news, app recommendations</span>
          </div>
          <div className="nicheCategory">
            <strong>Gaming</strong>
            <span>Gameplay, guides, commentary, esports analysis</span>
          </div>
          <div className="nicheCategory">
            <strong>Personal Finance</strong>
            <span>Investing, budgeting, credit, side hustles</span>
          </div>
          <div className="nicheCategory">
            <strong>Health and Fitness</strong>
            <span>Workouts, nutrition, wellness, transformation</span>
          </div>
          <div className="nicheCategory">
            <strong>Cooking and Food</strong>
            <span>Recipes, restaurant reviews, food science</span>
          </div>
          <div className="nicheCategory">
            <strong>Education</strong>
            <span>Explainers, study tips, skill tutorials, language learning</span>
          </div>
          <div className="nicheCategory">
            <strong>DIY and Crafts</strong>
            <span>Home improvement, woodworking, art, handmade items</span>
          </div>
          <div className="nicheCategory">
            <strong>Travel</strong>
            <span>Destinations, travel tips, cultural experiences, budget travel</span>
          </div>
          <div className="nicheCategory">
            <strong>Productivity</strong>
            <span>Time management, tools, habits, work optimization</span>
          </div>
          <div className="nicheCategory">
            <strong>Entertainment</strong>
            <span>Commentary, reactions, analysis, pop culture</span>
          </div>
        </div>

        <div className="funCallout" style={{ marginTop: "var(--space-5)" }}>
          <p className="funCallout__text">
            Cooking is too broad. Budget meal prep for college students is specific enough to build an audience. Find the intersection of a category, an audience, and a unique angle.
          </p>
        </div>
      </section>

      {/* From Idea to Video */}
      <section id="idea-to-video" className={s.section}>
        <h2 className={s.sectionTitle}>From Idea to Publish</h2>
        <p className={s.sectionText}>
          You have a validated idea. Now what?
        </p>

        <div className="processSteps">
          <div className="processStep">
            <div className="processStep__marker">
              <span className="processStep__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </span>
            </div>
            <div className="processStep__content">
              <h3 className="processStep__title">Title First</h3>
              <p className="processStep__text">
                Write 5 different titles before scripting. Forces you to clarify the
                core promise and find the most compelling angle.
              </p>
            </div>
          </div>

          <div className="processStep">
            <div className="processStep__marker">
              <span className="processStep__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </span>
            </div>
            <div className="processStep__content">
              <h3 className="processStep__title">Thumbnail Sketch</h3>
              <p className="processStep__text">
                Rough sketch 2-3 thumbnail concepts. If you cannot imagine a clickable
                thumbnail, the idea needs refinement.
              </p>
            </div>
          </div>

          <div className="processStep">
            <div className="processStep__marker">
              <span className="processStep__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </span>
            </div>
            <div className="processStep__content">
              <h3 className="processStep__title">Hook Script</h3>
              <p className="processStep__text">
                Spend extra time on the first 30 seconds. This determines whether viewers
                stay. Write it word for word.
              </p>
            </div>
          </div>

          <div className="processStep">
            <div className="processStep__marker">
              <span className="processStep__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                </svg>
              </span>
            </div>
            <div className="processStep__content">
              <h3 className="processStep__title">Produce and Cut</h3>
              <p className="processStep__text">
                Film, edit, review for pacing. Cut anything that does not serve the
                viewer promise. Ruthlessly.
              </p>
            </div>
          </div>

          <div className="processStep">
            <div className="processStep__marker">
              <span className="processStep__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              </span>
            </div>
            <div className="processStep__content">
              <h3 className="processStep__title">Publish and Learn</h3>
              <p className="processStep__text">
                Upload and track performance. Check analytics at 48 hours and 7 days.
                What worked? Apply to next video.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Title Templates */}
      <section id="title-thumbnail" className={s.section}>
        <h2 className={s.sectionTitle}>Title Templates That Get Clicks</h2>
        <p className={s.sectionText}>
          Your title determines whether people click. The best idea fails with
          boring packaging.
        </p>

        <div className="titleTemplateGrid">
          <div className="titleTemplate">
            <span className="titleTemplate__category">How-To</span>
            <span className="titleTemplate__template">How to [result] in [timeframe]</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">List</span>
            <span className="titleTemplate__template">[Number] [things] every [audience] should know</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Story</span>
            <span className="titleTemplate__template">I tried [thing] for [timeframe]. Here is what happened.</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Contrarian</span>
            <span className="titleTemplate__template">Why [common belief] is wrong</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Best/Only</span>
            <span className="titleTemplate__template">The [only/best/fastest] way to [result]</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Versus</span>
            <span className="titleTemplate__template">[Thing] vs [thing]: which is actually better?</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Warning</span>
            <span className="titleTemplate__template">Stop doing [mistake] (do this instead)</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Secret</span>
            <span className="titleTemplate__template">What nobody tells you about [topic]</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Value</span>
            <span className="titleTemplate__template">Is [thing] actually worth it?</span>
          </div>
          <div className="titleTemplate">
            <span className="titleTemplate__category">Mistakes</span>
            <span className="titleTemplate__template">[Number] mistakes killing your [result]</span>
          </div>
        </div>

        <h3 className={s.subheading}>Thumbnail Essentials</h3>
        <p className={s.sectionText}>
          Thumbnails must be readable at small sizes, stand out in the feed, and
          communicate the video promise instantly. See our{" "}
          <Link href="/learn/youtube-thumbnail-best-practices">thumbnail guide</Link>
          {" "}for detailed strategies.
        </p>

        <div className="thumbnailRules">
          <div className="thumbnailRule">
            <span className="thumbnailRule__do">Do</span>
            <span className="thumbnailRule__text">High contrast colors that pop</span>
          </div>
          <div className="thumbnailRule">
            <span className="thumbnailRule__do">Do</span>
            <span className="thumbnailRule__text">3 words or less of text</span>
          </div>
          <div className="thumbnailRule">
            <span className="thumbnailRule__do">Do</span>
            <span className="thumbnailRule__text">Faces with clear emotions</span>
          </div>
          <div className="thumbnailRule">
            <span className="thumbnailRule__dont">Avoid</span>
            <span className="thumbnailRule__text">Cluttered, busy backgrounds</span>
          </div>
          <div className="thumbnailRule">
            <span className="thumbnailRule__dont">Avoid</span>
            <span className="thumbnailRule__text">Tiny details invisible at small size</span>
          </div>
        </div>
      </section>

      {/* Example: One Topic to 12 Ideas */}
      <section id="example" className={s.section}>
        <h2 className={s.sectionTitle}>One Topic, Twelve Videos</h2>
        <p className={s.sectionText}>
          Here is how to expand a single topic into multiple video ideas using
          different frameworks. Starting topic: Coffee Brewing.
        </p>

        <div className="exampleGrid">
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Comparison</span>
            <span className="exampleIdea__title">French Press vs Pour Over: Which Makes Better Coffee?</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Challenge</span>
            <span className="exampleIdea__title">I Made Coffee 4 Different Ways Every Day for a Week</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Speedrun</span>
            <span className="exampleIdea__title">How Fast Can I Learn to Make Latte Art?</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Teardown</span>
            <span className="exampleIdea__title">Why This Coffee Shop Makes the Best Espresso in the City</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Myth Busting</span>
            <span className="exampleIdea__title">5 Coffee Myths Ruining Your Morning Brew</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Beginner</span>
            <span className="exampleIdea__title">Complete Coffee Brewing Guide for Absolute Beginners</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Ranking</span>
            <span className="exampleIdea__title">I Ranked Every Coffee Brewing Method from Worst to Best</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">BTS</span>
            <span className="exampleIdea__title">My Morning Coffee Routine and Why It Costs $0.50</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">How-To</span>
            <span className="exampleIdea__title">Cafe Quality Coffee at Home for Under $100</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Mistakes</span>
            <span className="exampleIdea__title">7 Mistakes Ruining Your Home Brewed Coffee</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Gear</span>
            <span className="exampleIdea__title">The Only Coffee Equipment You Actually Need</span>
          </div>
          <div className="exampleIdea">
            <span className="exampleIdea__framework">Transformation</span>
            <span className="exampleIdea__title">I Upgraded My Coffee Setup for $50. Here is What Changed.</span>
          </div>
        </div>

        <p className={s.sectionText} style={{ marginTop: "var(--space-4)" }}>
          One topic becomes 12 distinct videos, each serving different viewer
          intents. Apply this expansion technique to your own niche topics.
        </p>
      </section>

      {/* Tools */}
      <section id="tools" className={s.section}>
        <h2 className={s.sectionTitle}>Free Research Tools</h2>
        <p className={s.sectionText}>
          No paid tools required. These free resources surface real viewer data.
        </p>

        <div className="toolCards">
          <div className="toolCard">
            <h3 className="toolCard__title">YouTube Search</h3>
            <p className="toolCard__text">Autocomplete suggestions are real queries with real volume</p>
          </div>
          <div className="toolCard">
            <h3 className="toolCard__title">YouTube Studio</h3>
            <p className="toolCard__text">Your own analytics are the best data source for your audience</p>
          </div>
          <div className="toolCard">
            <h3 className="toolCard__title">Google Trends</h3>
            <p className="toolCard__text">Compare topic interest over time, spot rising searches</p>
          </div>
          <div className="toolCard">
            <h3 className="toolCard__title">Reddit / Quora</h3>
            <p className="toolCard__text">See what questions real people ask in your niche</p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "var(--space-5)" }}>
          <p className="realTalk__label">Caution</p>
          <p className="realTalk__text">
            Tools show data. They cannot tell you if you can execute well or if it fits
            your audience. Use tools to gather information, then apply judgment.
          </p>
        </div>
      </section>

      {/* When You're Stuck */}
      <section id="when-stuck" className="sectionTinted">
        <h2 className={s.sectionTitle}>Unstick Any Idea</h2>
        <p className={s.sectionText}>
          Three prompts to transform a weak idea into a strong one:
        </p>
        <div className="stuckPrompts">
          <div className="stuckPrompt">
            <span className="stuckPrompt__label">Add a constraint</span>
            <span className="stuckPrompt__text">Budget, time limit, tools, location, audience segment</span>
          </div>
          <div className="stuckPrompt">
            <span className="stuckPrompt__label">Raise the stakes</span>
            <span className="stuckPrompt__text">What happens if they do not know this? What are they losing?</span>
          </div>
          <div className="stuckPrompt">
            <span className="stuckPrompt__label">Make the promise specific</span>
            <span className="stuckPrompt__text">Replace vague outcomes with measurable, concrete results</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Want help finding video ideas?</strong> {BRAND.name} generates
          ideas based on what is working in your niche. See trending topics,
          competitor outliers, and validated ideas without hours of manual
          research. Stop guessing what to make next and start with proven demand.
        </p>
      </div>
    </>
  );
}
