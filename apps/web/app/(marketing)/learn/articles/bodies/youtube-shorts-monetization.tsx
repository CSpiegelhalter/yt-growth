/**
 * Body content for YouTube Shorts Monetization article.
 * Server component - no "use client" directive.
 *
 * Implementation plan:
 * - Fun visuals: coin pool, revenue pizza, slot machine, music tax, funnel, thermometer
 * - Card-based layouts instead of bullet lists
 * - Comprehensive content about Shorts monetization
 * - Mobile-first responsive design
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

/* ================================================
   INLINE SVG VISUALS
   ================================================ */

function CoinPoolSvg() {
  return (
    <svg
      width="320"
      height="160"
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Revenue pool showing ad money flowing to creators"
    >
      <title>Shorts Revenue Pool</title>
      {/* Pool background */}
      <ellipse cx="160" cy="130" rx="140" ry="25" fill="#0ea5e9" opacity="0.2" />
      <ellipse cx="160" cy="125" rx="130" ry="20" fill="#0ea5e9" opacity="0.3" />
      <ellipse cx="160" cy="120" rx="120" ry="15" fill="#0ea5e9" opacity="0.4" />
      
      {/* Pool label */}
      <text x="160" y="127" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0369a1">
        CREATOR POOL
      </text>
      
      {/* Coins falling in */}
      <g>
        <circle cx="80" cy="30" r="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
        <text x="80" y="35" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">$</text>
      </g>
      <g>
        <circle cx="120" cy="50" r="10" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
        <text x="120" y="54" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400e">$</text>
      </g>
      <g>
        <circle cx="160" cy="25" r="14" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
        <text x="160" y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#92400e">$</text>
      </g>
      <g>
        <circle cx="200" cy="45" r="11" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
        <text x="200" y="50" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">$</text>
      </g>
      <g>
        <circle cx="240" cy="35" r="13" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
        <text x="240" y="40" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">$</text>
      </g>
      
      {/* Dotted fall lines */}
      <path d="M80 45 Q90 70, 100 95" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3" fill="none" opacity="0.5" />
      <path d="M120 62 Q130 80, 140 100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3" fill="none" opacity="0.5" />
      <path d="M160 42 L160 100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3" fill="none" opacity="0.5" />
      <path d="M200 58 Q190 80, 180 100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3" fill="none" opacity="0.5" />
      <path d="M240 50 Q230 75, 220 100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3" fill="none" opacity="0.5" />
      
      {/* Label */}
      <text x="160" y="155" textAnchor="middle" fontSize="9" fill="#64748b">
        All Shorts ad revenue pools together each month
      </text>
    </svg>
  );
}

function RevenuePizzaSvg() {
  return (
    <svg
      width="280"
      height="200"
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pie chart showing 45% creator share, 55% YouTube share"
    >
      <title>Revenue Split Pizza</title>
      {/* Pizza/Pie background */}
      <circle cx="140" cy="90" r="70" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
      
      {/* YouTube's 55% slice */}
      <path d="M140 90 L140 20 A70 70 0 0 1 210 90 A70 70 0 0 1 182 147 Z" fill="#ef4444" />
      
      {/* Creator's 45% slice */}
      <path d="M140 90 L182 147 A70 70 0 0 1 70 90 A70 70 0 0 1 140 20 Z" fill="#22c55e" />
      
      {/* Slice labels */}
      <text x="175" y="75" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">55%</text>
      <text x="175" y="90" textAnchor="middle" fontSize="9" fontWeight="600" fill="white">YouTube</text>
      
      <text x="105" y="95" textAnchor="middle" fontSize="16" fontWeight="800" fill="white">45%</text>
      <text x="105" y="110" textAnchor="middle" fontSize="10" fontWeight="600" fill="white">You</text>
      
      {/* Legend */}
      <g>
        <rect x="50" y="175" width="14" height="14" rx="2" fill="#22c55e" />
        <text x="70" y="186" fontSize="10" fill="#374151">Your share: 45%</text>
      </g>
      <g>
        <rect x="160" y="175" width="14" height="14" rx="2" fill="#ef4444" />
        <text x="180" y="186" fontSize="10" fill="#374151">YouTube: 55%</text>
      </g>
    </svg>
  );
}

function SlotMachineSvg() {
  return (
    <svg
      width="300"
      height="350"
      viewBox="0 0 300 350"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Slot machine showing random per-view earnings"
    >
      <title>Per-View Earnings Slot Machine</title>
      
      {/* Machine body - main cabinet */}
      <rect x="40" y="30" width="200" height="255" rx="12" fill="url(#machineGradient)" />
      
      {/* Top decorative border */}
      <rect x="40" y="30" width="200" height="50" rx="12" fill="#5b21b6" />
      <rect x="40" y="70" width="200" height="10" fill="#5b21b6" />
      
      {/* Chrome trim top */}
      <rect x="50" y="75" width="180" height="4" fill="#e2e8f0" rx="2" />
      
      {/* Title banner */}
      <rect x="60" y="40" width="160" height="28" rx="6" fill="#fef3c7" />
      <text x="140" y="60" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7c3aed">
        SHORTS EARNINGS
      </text>
      
      {/* Display window frame */}
      <rect x="55" y="90" width="170" height="95" rx="8" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="3" />
      
      {/* Inner glow */}
      <rect x="62" y="97" width="156" height="81" rx="4" fill="#0f0a2a" />
      
      {/* Reels container */}
      <rect x="68" y="103" width="144" height="68" rx="4" fill="#1a1040" />
      
      {/* Reel 1 */}
      <rect x="75" y="108" width="40" height="58" rx="4" fill="white" />
      <rect x="75" y="108" width="40" height="10" fill="#f1f5f9" rx="4" />
      <text x="95" y="147" textAnchor="middle" fontSize="24" fontWeight="800" fill="#22c55e">$0</text>
      
      {/* Reel 2 */}
      <rect x="120" y="108" width="40" height="58" rx="4" fill="white" />
      <rect x="120" y="108" width="40" height="10" fill="#f1f5f9" rx="4" />
      <text x="140" y="149" textAnchor="middle" fontSize="28" fontWeight="800" fill="#374151">.</text>
      
      {/* Reel 3 */}
      <rect x="165" y="108" width="40" height="58" rx="4" fill="white" />
      <rect x="165" y="108" width="40" height="10" fill="#f1f5f9" rx="4" />
      <text x="185" y="147" textAnchor="middle" fontSize="24" fontWeight="800" fill="#f59e0b">03</text>
      
      {/* "per 1K views" label - more space above the panel */}
      <text x="140" y="182" textAnchor="middle" fontSize="11" fontWeight="600" fill="#a78bfa">
        per 1,000 views
      </text>
      
      {/* Range display panel - moved down for more spacing */}
      <rect x="55" y="198" width="170" height="35" rx="6" fill="#4c1d95" />
      <text x="140" y="213" textAnchor="middle" fontSize="10" fontWeight="600" fill="#c4b5fd">
        TYPICAL RANGE
      </text>
      <text x="140" y="228" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fef3c7">
        $0.01 – $0.05
      </text>
      
      {/* Coin slot */}
      <rect x="115" y="245" width="50" height="12" rx="4" fill="#1e1b4b" stroke="#64748b" strokeWidth="1" />
      <rect x="125" y="249" width="30" height="4" rx="2" fill="#0f172a" />
      
      {/* Pull handle - mounting bracket attached to machine side */}
      <rect x="228" y="100" width="20" height="35" rx="2" fill="#475569" />
      <rect x="225" y="130" width="26" height="8" rx="2" fill="#64748b" />
      
      {/* Pull handle - arm (going down from bracket) */}
      <rect x="233" y="135" width="16" height="100" rx="4" fill="url(#handleGradient)" />
      <rect x="236" y="140" width="10" height="90" rx="3" fill="#94a3b8" />
      
      {/* Pull handle - ball at BOTTOM of arm */}
      <circle cx="241" cy="245" r="16" fill="url(#ballGradient)" />
      <circle cx="237" cy="240" r="4" fill="white" opacity="0.5" />
      
      {/* Decorative lights */}
      <circle cx="60" cy="50" r="6" fill="#fcd34d">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="220" cy="50" r="6" fill="#fcd34d">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
      
      {/* Stars/sparkles */}
      <path d="M70 100 L73 107 L80 107 L74 112 L77 120 L70 115 L63 120 L66 112 L60 107 L67 107 Z" fill="#fcd34d" opacity="0.8" />
      <path d="M210 100 L213 107 L220 107 L214 112 L217 120 L210 115 L203 120 L206 112 L200 107 L207 107 Z" fill="#fcd34d" opacity="0.8" />
      
      {/* Machine base/stand */}
      <rect x="60" y="285" width="160" height="15" rx="3" fill="#4c1d95" />
      
      {/* Bottom label - positioned below machine */}
      <rect x="60" y="310" width="160" height="28" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
      <text x="140" y="329" textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">
        Results vary wildly
      </text>
      
      <defs>
        <linearGradient id="machineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <radialGradient id="ballGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function MusicTaxSvg() {
  return (
    <svg
      width="400"
      height="200"
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Music track reducing creator revenue share"
    >
      <title>Music Track Tax</title>
      
      {/* Title */}
      <text x="200" y="25" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        How Music Affects Your Earnings
      </text>
      
      {/* Background panel */}
      <rect x="15" y="40" width="370" height="125" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Bar width: 100 total for each scenario */}
      
      {/* No music scenario */}
      <g>
        <text x="80" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">No Music</text>
        <rect x="30" y="75" width="100" height="30" rx="6" fill="#22c55e" />
        <text x="80" y="96" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">100% to Pool</text>
        <text x="80" y="120" textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="600">Full share</text>
      </g>
      
      {/* 1 track scenario - aligned bars */}
      <g>
        <text x="200" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">1 Track</text>
        <rect x="150" y="75" width="50" height="30" rx="6" fill="#22c55e" />
        <rect x="200" y="75" width="50" height="30" rx="6" fill="#f59e0b" />
        <text x="175" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">50%</text>
        <text x="225" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">50%</text>
        <text x="200" y="120" textAnchor="middle" fontSize="11" fill="#d97706" fontWeight="600">Half to music</text>
      </g>
      
      {/* 2 tracks scenario - aligned bars */}
      <g>
        <text x="320" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">2 Tracks</text>
        <rect x="270" y="75" width="33" height="30" rx="6" fill="#22c55e" />
        <rect x="303" y="75" width="67" height="30" rx="6" fill="#f59e0b" />
        <text x="286" y="96" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">33%</text>
        <text x="336" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">67%</text>
        <text x="320" y="120" textAnchor="middle" fontSize="11" fill="#b45309" fontWeight="600">More to music</text>
      </g>
      
      {/* Legend */}
      <g>
        <rect x="110" y="145" width="16" height="16" rx="3" fill="#22c55e" />
        <text x="132" y="158" fontSize="12" fill="#374151" fontWeight="500">Creator Pool</text>
        <rect x="230" y="145" width="16" height="16" rx="3" fill="#f59e0b" />
        <text x="252" y="158" fontSize="12" fill="#374151" fontWeight="500">Music Licensing</text>
      </g>
    </svg>
  );
}

function EligibilityThermometerSvg() {
  return (
    <svg
      width="360"
      height="260"
      viewBox="0 0 360 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Thermometer showing monetization requirements"
    >
      <title>Eligibility Thermometer</title>
      
      {/* Title */}
      <text x="180" y="25" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        Your Path to Monetization
      </text>
      
      {/* Thermometer body */}
      <rect x="155" y="45" width="50" height="140" rx="25" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
      <circle cx="180" cy="195" r="35" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
      
      {/* Mercury fill - partially filled */}
      <rect x="167" y="95" width="26" height="90" fill="#ef4444" />
      <circle cx="180" cy="195" r="26" fill="#ef4444" />
      
      {/* Temperature markers */}
      <line x1="210" y1="65" x2="230" y2="65" stroke="#94a3b8" strokeWidth="2" />
      <line x1="210" y1="100" x2="225" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="210" y1="135" x2="230" y2="135" stroke="#94a3b8" strokeWidth="2" />
      
      {/* Labels - Right side */}
      <text x="238" y="70" fontSize="12" fontWeight="700" fill="#16a34a">Partner</text>
      <text x="238" y="85" fontSize="10" fill="#22c55e">Ready to earn!</text>
      
      <text x="238" y="140" fontSize="12" fontWeight="600" fill="#f59e0b">Halfway</text>
      <text x="238" y="155" fontSize="10" fill="#d97706">Keep going!</text>
      
      {/* Requirements - Left side */}
      <g>
        <rect x="10" y="50" width="130" height="60" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
        <text x="75" y="72" textAnchor="middle" fontSize="12" fontWeight="700" fill="#166534">1,000 Subs</text>
        <text x="75" y="88" textAnchor="middle" fontSize="10" fill="#15803d">+ 10M Shorts views</text>
        <text x="75" y="103" textAnchor="middle" fontSize="10" fill="#15803d">or 4K watch hours</text>
        <line x1="140" y1="75" x2="155" y2="65" stroke="#22c55e" strokeWidth="2" />
      </g>
      
      {/* Current position indicator */}
      <circle cx="180" cy="100" r="10" fill="#6366f1" stroke="white" strokeWidth="3" />
      <text x="180" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">?</text>
      
      {/* "You are here" callout */}
      <g>
        <rect x="10" y="125" width="90" height="30" rx="6" fill="#eef2ff" stroke="#6366f1" strokeWidth="1" />
        <text x="55" y="145" textAnchor="middle" fontSize="11" fontWeight="600" fill="#4f46e5">You are here</text>
        <line x1="100" y1="140" x2="170" y2="100" stroke="#6366f1" strokeWidth="1" strokeDasharray="4" />
      </g>
      
      {/* Bottom label - moved down and separated from thermometer */}
      <text x="180" y="252" textAnchor="middle" fontSize="13" fontWeight="600" fill="#64748b">
        Track Your Progress
      </text>
    </svg>
  );
}

function ShortsFunnelSvg() {
  return (
    <svg
      width="400"
      height="300"
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Funnel showing Shorts as discovery leading to long-form revenue"
    >
      <title>Shorts Funnel Strategy</title>
      
      {/* Title */}
      <text x="200" y="25" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        The Smart Shorts Strategy
      </text>
      
      {/* Funnel shape - 3D effect */}
      <path d="M50 50 L350 50 L280 240 L120 240 Z" fill="url(#funnelGradient3d)" opacity="0.2" />
      <path d="M50 50 L350 50 L280 240 L120 240 Z" stroke="url(#funnelStroke)" strokeWidth="3" fill="none" />
      
      {/* Funnel internal lines */}
      <line x1="70" y1="90" x2="330" y2="90" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />
      <line x1="95" y1="140" x2="305" y2="140" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />
      <line x1="115" y1="190" x2="285" y2="190" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />
      
      {/* Stage 1: Shorts */}
      <g>
        <rect x="145" y="58" width="110" height="28" rx="14" fill="#ef4444" />
        <text x="200" y="77" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">SHORTS</text>
      </g>
      
      {/* Arrow 1 */}
      <path d="M200 86 L200 100" stroke="#94a3b8" strokeWidth="2" />
      <polygon points="195,98 200,108 205,98" fill="#94a3b8" />
      
      {/* Stage 2: Subscribe */}
      <g>
        <rect x="150" y="112" width="100" height="26" rx="13" fill="#f59e0b" />
        <text x="200" y="130" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">SUBSCRIBE</text>
      </g>
      
      {/* Arrow 2 */}
      <path d="M200 138 L200 152" stroke="#94a3b8" strokeWidth="2" />
      <polygon points="195,150 200,160 205,150" fill="#94a3b8" />
      
      {/* Stage 3: Long-form */}
      <g>
        <rect x="155" y="162" width="90" height="26" rx="13" fill="#22c55e" />
        <text x="200" y="180" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">LONG-FORM</text>
      </g>
      
      {/* Arrow 3 */}
      <path d="M200 188 L200 202" stroke="#94a3b8" strokeWidth="2" />
      <polygon points="195,200 200,210 205,200" fill="#94a3b8" />
      
      {/* Stage 4: Revenue */}
      <g>
        <rect x="160" y="212" width="80" height="26" rx="13" fill="#6366f1" />
        <text x="200" y="230" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">REVENUE</text>
      </g>
      
      {/* Side annotations - Left */}
      <g>
        <rect x="15" y="58" width="90" height="24" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1" />
        <text x="60" y="75" textAnchor="middle" fontSize="11" fontWeight="600" fill="#dc2626">Discovery</text>
      </g>
      
      <g>
        <rect x="20" y="112" width="80" height="24" rx="6" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
        <text x="60" y="129" textAnchor="middle" fontSize="11" fontWeight="600" fill="#d97706">Build Trust</text>
      </g>
      
      <g>
        <rect x="25" y="165" width="70" height="24" rx="6" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" />
        <text x="60" y="182" textAnchor="middle" fontSize="11" fontWeight="600" fill="#16a34a">Deep Value</text>
      </g>
      
      {/* Side annotations - Right */}
      <g>
        <rect x="295" y="58" width="90" height="24" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1" />
        <text x="340" y="75" textAnchor="middle" fontSize="11" fontWeight="600" fill="#dc2626">Wide Reach</text>
      </g>
      
      <g>
        <rect x="300" y="112" width="80" height="24" rx="6" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
        <text x="340" y="129" textAnchor="middle" fontSize="11" fontWeight="600" fill="#d97706">Loyalty</text>
      </g>
      
      <g>
        <rect x="305" y="165" width="70" height="24" rx="6" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" />
        <text x="340" y="182" textAnchor="middle" fontSize="11" fontWeight="600" fill="#16a34a">Real $$$</text>
      </g>
      
      {/* Money coins at bottom */}
      <circle cx="150" cy="268" r="14" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="150" y="274" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#92400e">$</text>
      
      <circle cx="200" cy="268" r="18" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="200" y="275" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#92400e">$</text>
      
      <circle cx="250" cy="268" r="14" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="250" y="274" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#92400e">$</text>
      
      {/* Sparkles */}
      <path d="M175 255 L178 260 L183 260 L179 264 L181 270 L175 266 L169 270 L171 264 L167 260 L172 260 Z" fill="#fcd34d" />
      <path d="M225 255 L228 260 L233 260 L229 264 L231 270 L225 266 L219 270 L221 264 L217 260 L222 260 Z" fill="#fcd34d" />
      
      <defs>
        <linearGradient id="funnelGradient3d" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="funnelStroke" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IneligibleMuseumSvg() {
  return (
    <svg
      width="420"
      height="220"
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Museum showing views that don't count for revenue"
    >
      <title>Museum of Ineligible Views</title>
      
      {/* Museum sign header */}
      <rect x="100" y="8" width="220" height="38" rx="6" fill="#dc2626" />
      <text x="210" y="34" textAnchor="middle" fontSize="16" fontWeight="800" fill="white">
        VIEWS THAT DON&apos;T COUNT
      </text>
      
      {/* Wall background */}
      <rect x="15" y="50" width="390" height="120" fill="#fef2f2" />
      
      {/* Decorative molding at top */}
      <rect x="15" y="50" width="390" height="10" fill="#fecaca" />
      
      {/* Floor */}
      <rect x="15" y="160" width="390" height="25" fill="#fee2e2" />
      
      {/* Frame 1: Reused Content */}
      <g>
        <rect x="30" y="68" width="80" height="80" rx="4" fill="white" stroke="#dc2626" strokeWidth="3" />
        <rect x="40" y="78" width="60" height="52" fill="#fef2f2" />
        <text x="70" y="100" textAnchor="middle" fontSize="12" fontWeight="800" fill="#991b1b">REUSED</text>
        <text x="70" y="116" textAnchor="middle" fontSize="12" fontWeight="800" fill="#991b1b">CONTENT</text>
        {/* X overlay */}
        <circle cx="70" cy="105" r="30" fill="none" stroke="#dc2626" strokeWidth="3" opacity="0.5" />
        <path d="M50 85 L90 125 M90 85 L50 125" stroke="#dc2626" strokeWidth="4" opacity="0.6" />
        {/* Label plaque */}
        <rect x="42" y="133" width="56" height="12" rx="2" fill="#64748b" />
      </g>
      
      {/* Frame 2: Fake Views */}
      <g>
        <rect x="125" y="68" width="80" height="80" rx="4" fill="white" stroke="#dc2626" strokeWidth="3" />
        <rect x="135" y="78" width="60" height="52" fill="#fef2f2" />
        <text x="165" y="100" textAnchor="middle" fontSize="12" fontWeight="800" fill="#991b1b">FAKE</text>
        <text x="165" y="116" textAnchor="middle" fontSize="12" fontWeight="800" fill="#991b1b">VIEWS</text>
        {/* X overlay */}
        <circle cx="165" cy="105" r="30" fill="none" stroke="#dc2626" strokeWidth="3" opacity="0.5" />
        <path d="M145 85 L185 125 M185 85 L145 125" stroke="#dc2626" strokeWidth="4" opacity="0.6" />
        {/* Label plaque */}
        <rect x="137" y="133" width="56" height="12" rx="2" fill="#64748b" />
      </g>
      
      {/* Frame 3: Not Ad Friendly */}
      <g>
        <rect x="220" y="68" width="80" height="80" rx="4" fill="white" stroke="#dc2626" strokeWidth="3" />
        <rect x="230" y="78" width="60" height="52" fill="#fef2f2" />
        <text x="260" y="97" textAnchor="middle" fontSize="11" fontWeight="800" fill="#991b1b">NOT AD</text>
        <text x="260" y="113" textAnchor="middle" fontSize="11" fontWeight="800" fill="#991b1b">FRIENDLY</text>
        {/* X overlay */}
        <circle cx="260" cy="105" r="30" fill="none" stroke="#dc2626" strokeWidth="3" opacity="0.5" />
        <path d="M240 85 L280 125 M280 85 L240 125" stroke="#dc2626" strokeWidth="4" opacity="0.6" />
        {/* Label plaque */}
        <rect x="232" y="133" width="56" height="12" rx="2" fill="#64748b" />
      </g>
      
      {/* Frame 4: Over 1 Minute */}
      <g>
        <rect x="315" y="68" width="80" height="80" rx="4" fill="white" stroke="#dc2626" strokeWidth="3" />
        <rect x="325" y="78" width="60" height="52" fill="#fef2f2" />
        <text x="355" y="97" textAnchor="middle" fontSize="11" fontWeight="800" fill="#991b1b">OVER</text>
        <text x="355" y="113" textAnchor="middle" fontSize="11" fontWeight="800" fill="#991b1b">1 MINUTE</text>
        {/* X overlay */}
        <circle cx="355" cy="105" r="30" fill="none" stroke="#dc2626" strokeWidth="3" opacity="0.5" />
        <path d="M335 85 L375 125 M375 85 L335 125" stroke="#dc2626" strokeWidth="4" opacity="0.6" />
        {/* Label plaque */}
        <rect x="327" y="133" width="56" height="12" rx="2" fill="#64748b" />
      </g>
      
      {/* Bottom warning message - prominent */}
      <rect x="80" y="188" width="260" height="28" rx="6" fill="#dc2626" />
      <text x="210" y="208" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">
        These views won&apos;t earn you a cent
      </text>
    </svg>
  );
}

function FourStepMachineSvg() {
  return (
    <svg
      width="480"
      height="200"
      viewBox="0 0 480 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Four-step revenue sharing process"
    >
      <title>Revenue Sharing Machine</title>
      
      {/* Title */}
      <text x="240" y="25" textAnchor="middle" fontSize="17" fontWeight="700" fill="#1e293b">
        How Shorts Revenue Works
      </text>
      
      {/* Conveyor belt background - extended to fit all steps */}
      <rect x="20" y="55" width="440" height="90" rx="8" fill="#1e293b" />
      <rect x="20" y="135" width="440" height="12" rx="0" fill="#0f172a" />
      
      {/* Conveyor belt stripes */}
      <line x1="50" y1="141" x2="50" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="100" y1="141" x2="100" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="150" y1="141" x2="150" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="200" y1="141" x2="200" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="250" y1="141" x2="250" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="300" y1="141" x2="300" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="350" y1="141" x2="350" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="400" y1="141" x2="400" y2="147" stroke="#334155" strokeWidth="3" />
      <line x1="445" y1="141" x2="445" y2="147" stroke="#334155" strokeWidth="3" />
      
      {/* Step 1: Pool */}
      <g>
        <rect x="30" y="65" width="90" height="60" rx="8" fill="#3b82f6" />
        <circle cx="75" cy="80" r="12" fill="#60a5fa" />
        <text x="75" y="85" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">1</text>
        <text x="75" y="102" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">POOL</text>
        <text x="75" y="117" textAnchor="middle" fontSize="10" fill="#bfdbfe">Collect ad $</text>
      </g>
      
      {/* Arrow 1 */}
      <path d="M125 95 L137 95" stroke="#fcd34d" strokeWidth="4" />
      <polygon points="134,89 145,95 134,101" fill="#fcd34d" />
      
      {/* Step 2: Split */}
      <g>
        <rect x="150" y="65" width="90" height="60" rx="8" fill="#8b5cf6" />
        <circle cx="195" cy="80" r="12" fill="#a78bfa" />
        <text x="195" y="85" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">2</text>
        <text x="195" y="102" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">SPLIT</text>
        <text x="195" y="117" textAnchor="middle" fontSize="10" fill="#ddd6fe">Music costs</text>
      </g>
      
      {/* Arrow 2 */}
      <path d="M245 95 L257 95" stroke="#fcd34d" strokeWidth="4" />
      <polygon points="254,89 265,95 254,101" fill="#fcd34d" />
      
      {/* Step 3: Allocate */}
      <g>
        <rect x="270" y="65" width="90" height="60" rx="8" fill="#ec4899" />
        <circle cx="315" cy="80" r="12" fill="#f472b6" />
        <text x="315" y="85" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">3</text>
        <text x="315" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">ALLOCATE</text>
        <text x="315" y="117" textAnchor="middle" fontSize="10" fill="#fbcfe8">By view %</text>
      </g>
      
      {/* Arrow 3 */}
      <path d="M365 95 L377 95" stroke="#fcd34d" strokeWidth="4" />
      <polygon points="374,89 385,95 374,101" fill="#fcd34d" />
      
      {/* Step 4: Pay */}
      <g>
        <rect x="390" y="65" width="60" height="60" rx="8" fill="#22c55e" />
        <circle cx="420" cy="80" r="12" fill="#4ade80" />
        <text x="420" y="85" textAnchor="middle" fontSize="13" fontWeight="800" fill="white">4</text>
        <text x="420" y="102" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">PAY</text>
        <text x="420" y="117" textAnchor="middle" fontSize="9" fill="#bbf7d0">45% to you</text>
      </g>
      
      {/* Output coins */}
      <circle cx="400" cy="168" r="14" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="400" y="173" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#92400e">$</text>
      <circle cx="430" cy="172" r="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="430" y="177" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#92400e">$</text>
      
      {/* Input coins (left side) */}
      <circle cx="50" cy="48" r="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="50" y="53" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#92400e">$</text>
      <circle cx="80" cy="44" r="10" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="80" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">$</text>
      
      {/* Bottom label */}
      <text x="240" y="192" textAnchor="middle" fontSize="12" fill="#64748b">
        Revenue flows through 4 steps before reaching your pocket
      </text>
    </svg>
  );
}

function TipJarSvg() {
  return (
    <svg
      width="120"
      height="140"
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tip jar representing Super Thanks feature"
    >
      <title>Super Thanks Tip Jar</title>
      {/* Jar */}
      <path
        d="M25 40 Q20 40 20 45 L20 110 Q20 120 30 120 L90 120 Q100 120 100 110 L100 45 Q100 40 95 40"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      {/* Jar opening */}
      <ellipse cx="60" cy="40" rx="38" ry="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
      {/* Lid */}
      <rect x="40" y="25" width="40" height="12" rx="3" fill="#94a3b8" />
      {/* Slot */}
      <rect x="50" y="28" width="20" height="4" rx="1" fill="#475569" />
      
      {/* Coins inside */}
      <circle cx="45" cy="100" r="10" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
      <text x="45" y="104" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">$</text>
      
      <circle cx="70" cy="95" r="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
      <text x="70" y="100" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#92400e">$</text>
      
      <circle cx="55" cy="78" r="8" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
      <text x="55" y="82" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400e">$</text>
      
      <circle cx="80" cy="85" r="9" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
      <text x="80" y="89" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">$</text>
      
      {/* Hearts */}
      <path d="M35 60 C35 55 42 55 42 60 C42 55 49 55 49 60 C49 70 42 75 42 75 C42 75 35 70 35 60" fill="#f87171" />
      
      {/* Label */}
      <text x="60" y="135" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">
        Super Thanks
      </text>
    </svg>
  );
}

function LongVsShortSvg() {
  return (
    <svg
      width="420"
      height="280"
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Boxers comparing Shorts RPM to Long-form RPM"
    >
      <title>Shorts vs Long-form Revenue Comparison</title>
      
      {/* Title */}
      <text x="210" y="25" textAnchor="middle" fontSize="17" fontWeight="700" fill="#1e293b">
        Revenue Per 1,000 Views
      </text>
      
      {/* Boxing ring floor */}
      <rect x="30" y="220" width="360" height="20" rx="3" fill="#94a3b8" />
      <rect x="40" y="225" width="340" height="12" fill="#cbd5e1" />
      
      {/* Ring ropes */}
      <line x1="45" y1="80" x2="375" y2="80" stroke="#dc2626" strokeWidth="4" />
      <line x1="45" y1="110" x2="375" y2="110" stroke="#f8fafc" strokeWidth="4" />
      <line x1="45" y1="140" x2="375" y2="140" stroke="#3b82f6" strokeWidth="4" />
      
      {/* Corner posts */}
      <rect x="35" y="70" width="12" height="155" rx="2" fill="#475569" />
      <rect x="373" y="70" width="12" height="155" rx="2" fill="#475569" />
      
      {/* VS badge in center */}
      <circle cx="210" cy="155" r="22" fill="#1e293b" stroke="#fcd34d" strokeWidth="3" />
      <text x="210" y="162" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">VS</text>
      
      {/* === FEATHERWEIGHT BOXER (Scrawny - Shorts) === */}
      <g>
        {/* Head */}
        <circle cx="100" cy="115" r="16" fill="#f5d0b8" />
        {/* Hair */}
        <ellipse cx="100" cy="104" rx="12" ry="7" fill="#4a3728" />
        {/* Ears */}
        <ellipse cx="84" cy="115" rx="3" ry="5" fill="#f5d0b8" />
        <ellipse cx="116" cy="115" rx="3" ry="5" fill="#f5d0b8" />
        {/* Eyes - worried look */}
        <circle cx="94" cy="113" r="2.5" fill="#1e293b" />
        <circle cx="106" cy="113" r="2.5" fill="#1e293b" />
        {/* Worried eyebrows */}
        <path d="M90 107 L97 110" stroke="#4a3728" strokeWidth="1.5" fill="none" />
        <path d="M110 107 L103 110" stroke="#4a3728" strokeWidth="1.5" fill="none" />
        {/* Nervous mouth */}
        <path d="M96 121 Q100 119, 104 121" stroke="#1e293b" strokeWidth="1" fill="none" />
        
        {/* Thin neck */}
        <rect x="95" y="131" width="10" height="10" fill="#f5d0b8" />
        
        {/* Scrawny torso - tank top */}
        <path d="M88 141 L88 178 Q88 182, 92 182 L108 182 Q112 182, 112 178 L112 141 Q100 145, 88 141" fill="#ef4444" />
        
        {/* Shorts */}
        <rect x="88" y="182" width="24" height="18" rx="3" fill="#b91c1c" />
        
        {/* Left arm */}
        <path d="M88 145 L78 155 L72 165" stroke="#f5d0b8" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Left boxing glove - thumb on INSIDE (facing body) */}
        <ellipse cx="65" cy="172" rx="12" ry="10" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        <ellipse cx="72" cy="172" rx="4" ry="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
        <path d="M60 167 Q65 165, 70 167" stroke="#b91c1c" strokeWidth="1" fill="none" />
        
        {/* Right arm */}
        <path d="M112 145 L122 155 L128 165" stroke="#f5d0b8" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Right boxing glove - thumb on INSIDE (facing body) */}
        <ellipse cx="135" cy="172" rx="12" ry="10" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        <ellipse cx="128" cy="172" rx="4" ry="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
        <path d="M130 167 Q135 165, 140 167" stroke="#b91c1c" strokeWidth="1" fill="none" />
        
        {/* Skinny legs */}
        <rect x="90" y="200" width="7" height="20" rx="2" fill="#f5d0b8" />
        <rect x="103" y="200" width="7" height="20" rx="2" fill="#f5d0b8" />
      </g>
      
      {/* Shorts label card */}
      <rect x="55" y="45" width="90" height="28" rx="6" fill="#ef4444" />
      <text x="100" y="65" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">SHORTS</text>
      
      {/* Featherweight badge */}
      <rect x="50" y="235" width="100" height="35" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
      <text x="100" y="252" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">FEATHERWEIGHT</text>
      <text x="100" y="265" textAnchor="middle" fontSize="14" fontWeight="800" fill="#ef4444">$0.03</text>
      
      {/* === HEAVYWEIGHT BOXER (Hercules - Long-form) === */}
      <g>
        {/* Massive torso - tank top */}
        <path d="M295 138 L295 195 Q295 200, 305 200 L335 200 Q345 200, 345 195 L345 138 Q320 148, 295 138" fill="#22c55e" />
        {/* Shoulders */}
        <ellipse cx="295" cy="142" rx="10" ry="8" fill="#22c55e" />
        <ellipse cx="345" cy="142" rx="10" ry="8" fill="#22c55e" />
        {/* Chest definition */}
        <path d="M305 152 Q320 147, 335 152" stroke="#16a34a" strokeWidth="2" fill="none" />
        <line x1="320" y1="150" x2="320" y2="172" stroke="#16a34a" strokeWidth="1" />
        
        {/* Thick neck */}
        <rect x="307" y="115" width="26" height="28" rx="6" fill="#f5d0b8" />
        
        {/* Head */}
        <circle cx="320" cy="98" r="20" fill="#f5d0b8" />
        {/* Hair */}
        <ellipse cx="320" cy="84" rx="16" ry="9" fill="#3d2817" />
        {/* Ears */}
        <ellipse cx="300" cy="98" rx="4" ry="5" fill="#f5d0b8" />
        <ellipse cx="340" cy="98" rx="4" ry="5" fill="#f5d0b8" />
        {/* Confident eyes */}
        <circle cx="313" cy="96" r="3" fill="#1e293b" />
        <circle cx="327" cy="96" r="3" fill="#1e293b" />
        {/* Strong brow */}
        <rect x="308" y="90" width="9" height="2" rx="1" fill="#3d2817" />
        <rect x="323" y="90" width="9" height="2" rx="1" fill="#3d2817" />
        {/* Confident grin */}
        <path d="M313 107 Q320 112, 327 107" stroke="#1e293b" strokeWidth="2" fill="none" />
        
        {/* Shorts */}
        <rect x="300" y="200" width="40" height="18" rx="4" fill="#166534" />
        
        {/* Left arm - upper arm (bicep) */}
        <path d="M295 145 Q280 150, 275 165" stroke="#f5d0b8" strokeWidth="14" strokeLinecap="round" fill="none" />
        {/* Left forearm */}
        <path d="M275 165 L268 178" stroke="#f5d0b8" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Left boxing glove - thumb on INSIDE (facing body) */}
        <ellipse cx="262" cy="188" rx="16" ry="14" fill="#22c55e" stroke="#166534" strokeWidth="2" />
        <ellipse cx="272" cy="188" rx="6" ry="9" fill="#22c55e" stroke="#166534" strokeWidth="1" />
        <path d="M255 182 Q262 179, 269 182" stroke="#166534" strokeWidth="1.5" fill="none" />
        
        {/* Right arm - upper arm (bicep) */}
        <path d="M345 145 Q360 150, 365 165" stroke="#f5d0b8" strokeWidth="14" strokeLinecap="round" fill="none" />
        {/* Right forearm */}
        <path d="M365 165 L370 178" stroke="#f5d0b8" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Right boxing glove - thumb on INSIDE (facing body) */}
        <ellipse cx="372" cy="188" rx="16" ry="14" fill="#22c55e" stroke="#166534" strokeWidth="2" />
        <ellipse cx="362" cy="188" rx="6" ry="9" fill="#22c55e" stroke="#166534" strokeWidth="1" />
        <path d="M365 182 Q372 179, 379 182" stroke="#166534" strokeWidth="1.5" fill="none" />
        
        {/* Muscular legs */}
        <ellipse cx="310" cy="218" rx="7" ry="4" fill="#f5d0b8" />
        <ellipse cx="330" cy="218" rx="7" ry="4" fill="#f5d0b8" />
      </g>
      
      {/* Long-form label card */}
      <rect x="265" y="45" width="110" height="28" rx="6" fill="#22c55e" />
      <text x="320" y="65" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">LONG-FORM</text>
      
      {/* Heavyweight badge */}
      <rect x="270" y="235" width="100" height="35" rx="6" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
      <text x="320" y="252" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16a34a">HEAVYWEIGHT</text>
      <text x="320" y="265" textAnchor="middle" fontSize="14" fontWeight="800" fill="#22c55e">$2–10</text>
      
      {/* Multiplier callout - rendered last so it's on top */}
      <rect x="165" y="212" width="90" height="22" rx="11" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="210" y="228" textAnchor="middle" fontSize="12" fontWeight="800" fill="#92400e">50–300x more</text>
    </svg>
  );
}

/* ================================================
   HELPER COMPONENTS
   ================================================ */

type StepCardProps = {
  step: number;
  title: string;
  description: string;
};

function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div className="conveyorStation">
      <span className="conveyorStation__num">{step}</span>
      <div>
        <h4 className="conveyorStation__title">{title}</h4>
        <p className="conveyorStation__desc">{description}</p>
      </div>
    </div>
  );
}

type EarningsCardProps = {
  views: string;
  earnings: string;
  note: string;
};

function EarningsCard({ views, earnings, note }: EarningsCardProps) {
  return (
    <div className="millionViewsCard">
      <span className="millionViewsCard__tier">{views}</span>
      <span className="millionViewsCard__earnings">{earnings}</span>
      <span className="millionViewsCard__example">{note}</span>
    </div>
  );
}

type IncomeStreamCardProps = {
  title: string;
  description: string;
};

function IncomeStreamCard({ title, description }: IncomeStreamCardProps) {
  return (
    <div className="incomeCard">
      <h4 className="incomeCard__title">{title}</h4>
      <p className="incomeCard__desc">{description}</p>
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
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          Making money from YouTube Shorts is possible, but the reality check
          comes fast: the per-view payout is tiny compared to long-form videos.
        </p>

        <p className="standaloneLine">
          Shorts monetization is real, but modest.
        </p>

        <p className={s.sectionText}>
          YouTube Shorts uses a pooled revenue model. Ads play between videos in
          the Shorts feed, that money goes into a shared pool, and creators get
          paid based on their share of total views. Your cut is 45% of what
          YouTube allocates to you.
        </p>

        <div className="inlineIllustration">
          <CoinPoolSvg />
        </div>

        <p className={s.sectionText}>
          This guide covers exactly how Shorts monetization works, what you can
          realistically expect to earn, and why smart creators use Shorts as a
          discovery tool rather than a primary income source.
        </p>
      </section>

      {/* Eligibility */}
      <section id="eligibility" className="sectionTinted">
        <h2 className={s.sectionTitle}>Eligibility Requirements</h2>

        <p className={s.sectionText}>
          Before you earn anything, you need to join the YouTube Partner Program
          and accept the Shorts Monetization Module.
        </p>

        <div className="inlineIllustration">
          <EligibilityThermometerSvg />
        </div>

        <div className="comparisonGrid">
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Route A: Shorts-First</p>
            <p className="comparisonItem__content">
              1,000 subscribers + 10 million public Shorts views in the last 90
              days. Built for creators who focus on short-form content.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Route B: Long-Form Path</p>
            <p className="comparisonItem__content">
              1,000 subscribers + 4,000 public watch hours in the last 12
              months. The traditional path, using long-form videos.
            </p>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Important</p>
          <p className="realTalk__text">
            After joining the Partner Program, you must accept the Shorts
            Monetization Module separately. Revenue sharing only applies from
            the date you accept. Past views before acceptance earn nothing.
          </p>
        </div>

        <p className={s.sectionText}>
          For complete eligibility details, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">
            monetization requirements guide
          </Link>
          .
        </p>
      </section>

      {/* Revenue Model */}
      <section id="revenue-model" className="sectionOpen">
        <h2 className={s.sectionTitle}>How the Revenue Model Works</h2>

        <p className={s.sectionText}>
          Shorts monetization is different from long-form. Instead of ads
          playing on your specific video, ads appear between Shorts as viewers
          scroll. That revenue pools together and gets distributed based on your
          share of views.
        </p>

        <div className="inlineIllustration">
          <FourStepMachineSvg />
        </div>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">1. Pool the Revenue</h4>
            <p className="factorCard__desc">
              All ad revenue from the Shorts feed collects into one pool each
              month. Part goes to creators, part covers music licensing.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">2. Calculate Music Costs</h4>
            <p className="factorCard__desc">
              If your Short uses music, revenue splits between the Creator Pool
              and music partners based on track count.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">3. Allocate by Views</h4>
            <p className="factorCard__desc">
              Your share of the Creator Pool depends on your percentage of total
              engaged Shorts views from monetizing creators.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">4. Apply Revenue Share</h4>
            <p className="factorCard__desc">
              You keep 45% of your allocated revenue. YouTube keeps 55%. This
              split applies regardless of music usage.
            </p>
          </div>
        </div>

        <div className="floatRight" style={{ marginTop: "1rem" }}>
          <RevenuePizzaSvg />
        </div>

        <p className={s.sectionText} style={{ paddingTop: "2rem" }}>
          The 45/55 split is fixed. Unlike long-form where you might see
          variation, Shorts always give you 45% of what gets allocated to you.
          The variable is how much gets allocated in the first place.
        </p>

        <p className={s.sectionText}>
          This pooled model means your effective RPM depends on total Shorts
          views across all monetizing creators, not just your own content.
        </p>
      </section>

      {/* Music Impact */}
      <section id="music-impact" className="sectionTinted">
        <h2 className={s.sectionTitle}>How Music Affects Your Earnings</h2>

        <p className={s.sectionText}>
          Using trending sounds can boost a Short&apos;s reach. But there&apos;s
          a trade-off: music tracks reduce how much revenue flows to the Creator
          Pool.
        </p>

        <div className="inlineIllustration">
          <MusicTaxSvg />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The math</p>
          <p className="realTalk__text">
            No music = 100% to Creator Pool. One track = 50% to Creator Pool,
            50% to music licensing. Two tracks = 33% to Creator Pool, 67% to
            music. Your personal 45% share still applies to whatever reaches
            you.
          </p>
        </div>

        <p className={s.sectionText}>
          This creates a strategic decision: trending sounds might get more
          views, but original audio keeps your full revenue share. For some
          creators, the reach boost from music is worth the reduced per-view
          payout. For others, original audio or voiceovers make more financial
          sense.
        </p>
      </section>

      {/* Earning Potential */}
      <section id="earning-potential" className="sectionOpen">
        <h2 className={s.sectionTitle}>Realistic Earning Potential</h2>

        <div className="floatRight">
          <SlotMachineSvg />
        </div>

        <p className={s.sectionText}>
          Shorts RPM hovers around $0.01 to $0.05 per 1,000 views, with $0.02 to
          $0.03 being typical. This is dramatically lower than long-form, where
          $2 to $10 per 1,000 views is common depending on niche.
        </p>

        <div className="millionViewsGrid" style={{ marginTop: "24px" }}>
          <EarningsCard
            views="100K views"
            earnings="$2–$5"
            note="A good Short"
          />
          <EarningsCard
            views="1M views"
            earnings="$20–$50"
            note="Viral territory"
          />
          <EarningsCard
            views="10M views"
            earnings="$200–$500"
            note="Monetization threshold"
          />
        </div>

        <p className={s.sectionText} style={{ marginTop: "24px" }}>
          These numbers vary based on audience geography, music usage, time of
          year, and overall ad spend. Q4 typically pays better due to holiday
          advertising; January often dips as budgets reset.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            A creator getting 20 million Shorts views per month at $0.03 RPM
            earns around $600 from ads. That same effort in long-form could
            yield 10 to 50 times more revenue per view.
          </p>
        </div>
      </section>

      {/* Shorts vs Long-Form */}
      <section id="shorts-vs-long" className="sectionTinted">
        <h2 className={s.sectionTitle}>Shorts vs Long-Form Revenue</h2>

        <p className={s.sectionText}>
          The gap between Shorts and long-form revenue is not a bug. It reflects
          fundamental differences in how ads work on each format.
        </p>

        <div className="inlineIllustration">
          <LongVsShortSvg />
        </div>

        <div className="comparisonGrid">
          <div className="comparisonItem comparisonItem--bad">
            <p className="comparisonItem__label">Why Shorts Pay Less</p>
            <p className="comparisonItem__content">
              Ads are pooled, not placed on your video. Quick format means lower
              engagement signals. Viewers scroll fast, reducing ad
              effectiveness.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Why Long-Form Pays More</p>
            <p className="comparisonItem__content">
              Multiple ad slots per video. Ads placed directly on your content.
              Longer watch sessions signal higher intent to advertisers.
            </p>
          </div>
        </div>

        <p className={s.sectionText}>
          This does not mean Shorts are worthless. Think of them as serving
          different purposes: Shorts excel at discovery and reach. Long-form is
          where you convert that attention into meaningful ad revenue.
        </p>
      </section>

      {/* Ineligible Views */}
      <section id="ineligible-views" className="sectionOpen">
        <h2 className={s.sectionTitle}>Views That Don&apos;t Count</h2>

        <p className={s.sectionText}>
          Not every view earns money. YouTube only counts &quot;engaged
          views&quot; that meet specific criteria. Certain content is
          automatically excluded.
        </p>

        <div className="inlineIllustration">
          <IneligibleMuseumSvg />
        </div>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">Non-Original Content</h4>
            <p className="factorCard__desc">
              Unedited clips from movies, TV shows, or other creators. Reuploads
              without meaningful transformation.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Fake or Bot Views</h4>
            <p className="factorCard__desc">
              Artificial views from automated clicks or scroll bots. These get
              filtered out of payment calculations.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Not Advertiser-Friendly</h4>
            <p className="factorCard__desc">
              Content violating advertiser-friendly guidelines. Inappropriate
              language, violence, or sensitive topics.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Over 1 Minute with Music</h4>
            <p className="factorCard__desc">
              Shorts over one minute containing claimed music content are
              blocked from monetization entirely.
            </p>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Content policy</p>
          <p className="realTalk__text">
            Your channel must follow all YouTube Partner Program policies,
            Community Guidelines, Terms of Service, and Copyright rules.
            Violations can result in losing monetization access.
          </p>
        </div>
      </section>

      {/* Strategy */}
      <section id="strategy" className="sectionTinted">
        <h2 className={s.sectionTitle}>The Smart Shorts Strategy</h2>

        <p className={s.sectionText}>
          The creators making real money treat Shorts as the top of a funnel,
          not a standalone income source. A Short that earns $5 directly but
          brings 100 new subscribers who watch your long-form content is worth
          far more than its RPM suggests.
        </p>

        <div className="inlineIllustration">
          <ShortsFunnelSvg />
        </div>

        <div className="stageCards">
          <div className="stageCard">
            <div className="stageCard__header">
              <span className="stageCard__stage">Stage 1</span>
              <span className="stageCard__subs">Shorts</span>
            </div>
            <span className="stageCard__income">Discovery Engine</span>
            <p className="stageCard__insight">
              Reach viewers who would never click a long video. Showcase your
              personality and expertise in under 60 seconds.
            </p>
          </div>
          <div className="stageCard">
            <div className="stageCard__header">
              <span className="stageCard__stage">Stage 2</span>
              <span className="stageCard__subs">Subscribe</span>
            </div>
            <span className="stageCard__income">Build Relationship</span>
            <p className="stageCard__insight">
              Convert casual viewers into subscribers. Give them a reason to
              follow through consistency and value.
            </p>
          </div>
          <div className="stageCard">
            <div className="stageCard__header">
              <span className="stageCard__stage">Stage 3</span>
              <span className="stageCard__subs">Long-Form</span>
            </div>
            <span className="stageCard__income">Real Revenue</span>
            <p className="stageCard__insight">
              Deliver deeper content with multiple ad slots. This is where ad
              revenue becomes meaningful.
            </p>
          </div>
        </div>
      </section>

      {/* Beyond Ads */}
      <section id="beyond-ads" className="sectionOpen">
        <h2 className={s.sectionTitle}>Income Beyond Shorts Ads</h2>

        <p className={s.sectionText}>
          Smart creators do not rely solely on Shorts ad revenue. The real money
          often comes from other sources that Shorts help amplify.
        </p>

        <div className="floatLeft">
          <TipJarSvg />
        </div>

        <div className="incomeGrid" style={{ marginTop: "24px" }}>
          <IncomeStreamCard
            title="Super Thanks"
            description="Viewers can tip directly on your Shorts. Tips are highlighted in comments, building community connection."
          />
          <IncomeStreamCard
            title="Sponsorships"
            description="Brands pay for integrated mentions. A 60-second Short with millions of views attracts sponsor interest."
          />
          <IncomeStreamCard
            title="Affiliate Links"
            description="Recommend products in your Shorts, link in bio or comments. Earn commission on resulting sales."
          />
          <IncomeStreamCard
            title="Channel Memberships"
            description="Shorts drive subscribers who may join paid memberships. Even 100 members at $5 beats most Shorts ad revenue."
          />
          <IncomeStreamCard
            title="Product Sales"
            description="Feature your own products in Shorts. A viral Short can drive significant traffic to your store."
          />
          <IncomeStreamCard
            title="Long-Form Bridge"
            description="Tease topics in Shorts, deliver full content in long-form videos with proper ad monetization."
          />
        </div>

        <div className="funCallout" style={{ marginTop: "24px" }}>
          <p className="funCallout__text">
            A single sponsorship deal on a viral Short can pay more than months
            of ad revenue. Use Shorts to build the audience that makes
            sponsorships possible.
          </p>
        </div>
      </section>

      {/* Maximizing Earnings */}
      <section id="maximizing-earnings" className="sectionTinted">
        <h2 className={s.sectionTitle}>Maximizing What You Earn</h2>

        <p className={s.sectionText}>
          Since Shorts revenue is tied to total views and engagement, your
          levers are straightforward: get more views, keep more of the revenue
          per view, and publish consistently.
        </p>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">Hook Immediately</h4>
            <p className="factorCard__desc">
              Viewers swipe fast. Your first second determines if they stay.
              Lead with intrigue, not setup.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Design for Loops</h4>
            <p className="factorCard__desc">
              Content that loops well gets rewatched. Rewatches count toward
              engaged views. End where your beginning makes sense.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Original Audio Wins</h4>
            <p className="factorCard__desc">
              Voiceovers and original sounds keep your full Creator Pool
              allocation. Music splits your revenue with rights holders.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Consistency Compounds</h4>
            <p className="factorCard__desc">
              Regular publishing increases your share of the pool over time. One
              viral Short is luck; consistent volume is strategy.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Stay Advertiser-Friendly</h4>
            <p className="factorCard__desc">
              Content that violates guidelines earns nothing. Keep it clean to
              keep your views monetized.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Build Series</h4>
            <p className="factorCard__desc">
              Recognizable formats bring viewers back. Returning viewers are
              more likely to subscribe and watch more.
            </p>
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section id="how-to-start" className="sectionOpen">
        <h2 className={s.sectionTitle}>How to Start Monetizing Shorts</h2>

        <p className={s.sectionText}>
          Here is the path from zero to earning from your Shorts.
        </p>

        <div className="conveyorSteps">
          <StepCard
            step={1}
            title="Meet Partner Requirements"
            description="Get 1,000 subscribers plus either 10M Shorts views (90 days) or 4,000 watch hours (12 months)."
          />
          <StepCard
            step={2}
            title="Apply to Partner Program"
            description="Through YouTube Studio, accept base terms and connect an AdSense account."
          />
          <StepCard
            step={3}
            title="Accept Shorts Module"
            description="Separately accept the Shorts Monetization Module to enable revenue sharing on Shorts."
          />
          <StepCard
            step={4}
            title="Keep Creating"
            description="Revenue applies from acceptance date forward. Stay active to maintain monetization status."
          />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Stay active</p>
          <p className="realTalk__text">
            YouTube may pause monetization if you have not posted for 6 months
            or more. Consistent publishing protects your monetization status.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Use Shorts to earn attention. Use long-form to earn revenue.
        </h3>
        <p
          style={{
            fontSize: "1.125rem",
            marginBottom: "1.5rem",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {BRAND.name} helps you track which Shorts drive subscribers and
          identify content that converts viewers into fans.
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
