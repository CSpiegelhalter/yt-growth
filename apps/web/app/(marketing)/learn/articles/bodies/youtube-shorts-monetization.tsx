/**
 * Body content for YouTube Shorts Monetization article.
 * Server component - no "use client" directive.
 *
 * Focused on monetization setup and eligibility:
 * - Eligibility tiers (early access vs full ads)
 * - Revenue model (pooled, music impact, engaged views)
 * - Original + transformative content requirements
 * - Common approval blockers
 * - Step-by-step path to monetization
 * 
 * Strategy/creation content lives in youtube-shorts-strategy.tsx
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
      
      {/* No music scenario */}
      <g>
        <text x="80" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">No Music</text>
        <rect x="30" y="75" width="100" height="30" rx="6" fill="#22c55e" />
        <text x="80" y="96" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">100% to Pool</text>
        <text x="80" y="120" textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="600">Full share</text>
      </g>
      
      {/* 1 track scenario */}
      <g>
        <text x="200" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">1 Track</text>
        <rect x="150" y="75" width="50" height="30" rx="6" fill="#22c55e" />
        <rect x="200" y="75" width="50" height="30" rx="6" fill="#f59e0b" />
        <text x="175" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">50%</text>
        <text x="225" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">50%</text>
        <text x="200" y="120" textAnchor="middle" fontSize="11" fill="#d97706" fontWeight="600">Half to music</text>
      </g>
      
      {/* 2 tracks scenario */}
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
      width="400"
      height="300"
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Two-tier eligibility showing fan funding and full ads thresholds"
    >
      <title>Two Doors to Monetization</title>
      
      {/* Title */}
      <text x="200" y="25" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        Two Doors to YouTube Monetization
      </text>
      
      {/* Door 1: Early Access (Lower Tier) */}
      <g>
        <rect x="30" y="50" width="150" height="200" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
        <rect x="40" y="60" width="130" height="30" rx="4" fill="#f59e0b" />
        <text x="105" y="81" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">DOOR 1</text>
        
        <text x="105" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400e">Early Access</text>
        <text x="105" y="125" textAnchor="middle" fontSize="10" fill="#a16207">(where available)</text>
        
        <rect x="45" y="138" width="120" height="45" rx="4" fill="white" stroke="#fcd34d" strokeWidth="1" />
        <text x="105" y="157" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e293b">500 subscribers</text>
        <text x="105" y="173" textAnchor="middle" fontSize="10" fill="#64748b">+ 3K hrs or 3M Shorts</text>
        
        <rect x="45" y="192" width="120" height="48" rx="4" fill="#fffbeb" />
        <text x="105" y="210" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">Unlocks:</text>
        <text x="105" y="224" textAnchor="middle" fontSize="9" fill="#a16207">Super Thanks, Memberships</text>
        <text x="105" y="236" textAnchor="middle" fontSize="9" fill="#a16207">Shopping (fan funding)</text>
      </g>
      
      {/* Arrow between doors */}
      <path d="M190 150 L210 150" stroke="#94a3b8" strokeWidth="2" />
      <polygon points="208,145 218,150 208,155" fill="#94a3b8" />
      
      {/* Door 2: Full YPP (Higher Tier) */}
      <g>
        <rect x="220" y="50" width="150" height="200" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="3" />
        <rect x="230" y="60" width="130" height="30" rx="4" fill="#22c55e" />
        <text x="295" y="81" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">DOOR 2</text>
        
        <text x="295" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#166534">Full Ad Revenue</text>
        <text x="295" y="125" textAnchor="middle" fontSize="10" fill="#15803d">(Shorts + Watch Page)</text>
        
        <rect x="235" y="138" width="120" height="45" rx="4" fill="white" stroke="#86efac" strokeWidth="1" />
        <text x="295" y="157" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e293b">1,000 subscribers</text>
        <text x="295" y="173" textAnchor="middle" fontSize="10" fill="#64748b">+ 4K hrs or 10M Shorts</text>
        
        <rect x="235" y="192" width="120" height="48" rx="4" fill="#f0fdf4" />
        <text x="295" y="210" textAnchor="middle" fontSize="10" fontWeight="600" fill="#166534">Unlocks:</text>
        <text x="295" y="224" textAnchor="middle" fontSize="9" fill="#15803d">Shorts Feed ad revenue</text>
        <text x="295" y="236" textAnchor="middle" fontSize="9" fill="#15803d">Watch Page ads + all above</text>
      </g>
      
      {/* Bottom note */}
      <rect x="60" y="262" width="280" height="28" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
      <text x="200" y="281" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
        Door 2 is required for Shorts ad revenue sharing
      </text>
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
        <text x="355" y="97" textAnchor="middle" fontSize="11" fontWeight="800" fill="#991b1b">&gt;1 MIN +</text>
        <text x="355" y="113" textAnchor="middle" fontSize="11" fontWeight="800" fill="#991b1b">CLAIMED</text>
        {/* X overlay */}
        <circle cx="355" cy="105" r="30" fill="none" stroke="#dc2626" strokeWidth="3" opacity="0.5" />
        <path d="M335 85 L375 125 M375 85 L335 125" stroke="#dc2626" strokeWidth="4" opacity="0.6" />
        {/* Label plaque */}
        <rect x="327" y="133" width="56" height="12" rx="2" fill="#64748b" />
      </g>
      
      {/* Bottom warning message */}
      <rect x="80" y="188" width="260" height="28" rx="6" fill="#dc2626" />
      <text x="210" y="208" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">
        These won&apos;t earn you a cent
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
      
      {/* Conveyor belt background */}
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

function MoneyStackSvg() {
  return (
    <svg
      width="180"
      height="140"
      viewBox="0 0 180 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Stack of money representing multiple income streams"
    >
      <title>Multiple Income Streams</title>
      
      {/* Stack of bills */}
      <rect x="30" y="85" width="120" height="20" rx="3" fill="#22c55e" stroke="#16a34a" strokeWidth="2" />
      <rect x="35" y="70" width="110" height="20" rx="3" fill="#4ade80" stroke="#22c55e" strokeWidth="2" />
      <rect x="40" y="55" width="100" height="20" rx="3" fill="#86efac" stroke="#4ade80" strokeWidth="2" />
      
      {/* Dollar signs on bills */}
      <text x="90" y="100" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">$$$</text>
      <text x="90" y="85" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#166534">$$$</text>
      <text x="90" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">$$$</text>
      
      {/* Coins scattered */}
      <circle cx="45" cy="40" r="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="45" y="45" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">$</text>
      
      <circle cx="135" cy="45" r="10" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="135" y="49" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e">$</text>
      
      <circle cx="75" cy="30" r="8" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <text x="75" y="34" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#92400e">$</text>
      
      {/* Sparkles */}
      <path d="M155 25 L157 30 L162 30 L158 34 L160 40 L155 36 L150 40 L152 34 L148 30 L153 30 Z" fill="#fcd34d" />
      <path d="M25 55 L27 58 L31 58 L28 61 L29 65 L25 62 L21 65 L22 61 L19 58 L23 58 Z" fill="#fcd34d" />
      
      {/* Label */}
      <text x="90" y="130" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
        Build Your Stack
      </text>
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

type QuickLaneCardProps = {
  lane: string;
  title: string;
  description: string;
  color: "green" | "amber" | "blue";
};

function QuickLaneCard({ lane, title, description, color }: QuickLaneCardProps) {
  const colors = {
    green: { bg: "#dcfce7", border: "#22c55e", label: "#166534", text: "#15803d" },
    amber: { bg: "#fef3c7", border: "#f59e0b", label: "#92400e", text: "#a16207" },
    blue: { bg: "#dbeafe", border: "#3b82f6", label: "#1e40af", text: "#1d4ed8" },
  };
  const c = colors[color];
  
  return (
    <div
      className="quickLaneCard"
      style={{
        background: c.bg,
        borderColor: c.border,
        borderWidth: "2px",
        borderStyle: "solid",
        borderRadius: "0.75rem",
        padding: "1rem",
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: c.label,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {lane}
      </span>
      <h4 style={{ fontSize: "1rem", fontWeight: 700, color: c.label, margin: "0.5rem 0 0.25rem" }}>
        {title}
      </h4>
      <p style={{ fontSize: "0.875rem", color: c.text, margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}

type BlockerCardProps = {
  title: string;
  description: string;
};

function BlockerCard({ title, description }: BlockerCardProps) {
  return (
    <div className="blockerCard">
      <h4 className="blockerCard__title">{title}</h4>
      <p className="blockerCard__desc">{description}</p>
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <p className={s.sectionText} style={{ fontSize: "1.125rem", fontWeight: 500 }}>
          YouTube Shorts can generate real revenue. Understanding the eligibility requirements,
          revenue model, and what YouTube considers &quot;original content&quot; helps you set up
          your channel for monetization success.
        </p>

        <p className={s.sectionText}>
          This guide covers how Shorts monetization works, what you need to qualify, the
          common blockers that delay approvals, and how to earn while you grow toward
          full eligibility.
        </p>

        <div className="inlineIllustration">
          <MoneyStackSvg />
        </div>

        {/* Quick Answer: 3 Paths */}
        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">Quick Answer: 3 Paths to Shorts Money</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <QuickLaneCard
            lane="Path A: Fastest (No Ads Required)"
            title="Your Own Income Streams"
            description="Affiliate links, digital products, services, UGC deals, sponsor mentions. You control these. Start earning from day one without any subscriber threshold."
            color="green"
          />
          <QuickLaneCard
            lane="Path B: Early YouTube Features"
            title="Fan Funding Access"
            description="At 500 subs plus 3K watch hours (or 3M Shorts views), some regions unlock Super Thanks, memberships, and Shopping. Not ad revenue, but real money from fans."
            color="amber"
          />
          <QuickLaneCard
            lane="Path C: Full Shorts Ad Revenue"
            title="YouTube Pays You Directly"
            description="1,000 subs plus 10M Shorts views (90 days) or 4K watch hours. Accept the Shorts Monetization Module. Your engaged views earn from the ad revenue pool."
            color="blue"
          />
        </div>

        <div className="funCallout" style={{ marginTop: "1.5rem" }}>
          <p className="funCallout__text">
            Many creators build Path A income while grinding toward YouTube eligibility
            so money flows from multiple directions at once.
          </p>
        </div>
      </section>

      {/* Eligibility */}
      <section id="eligibility" className="sectionTinted">
        <h2 className={s.sectionTitle}>Eligibility Requirements</h2>

        <p className={s.sectionText}>
          The YouTube Partner Program has two tiers. Which one you need depends on
          what you want to unlock.
        </p>

        <div className="inlineIllustration">
          <EligibilityThermometerSvg />
        </div>

        <div className="comparisonGrid">
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Door 1: Early Access (Lower Tier)</p>
            <p className="comparisonItem__content">
              <strong>500 subscribers</strong> plus 3,000 public watch hours in the last 12 months,
              OR 3 million public Shorts views in the last 90 days. Requires 3 public uploads
              in the last 90 days. Unlocks fan funding features like Super Thanks, channel
              memberships, and YouTube Shopping where available.
              <strong> Does not include Shorts ad revenue.</strong>
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Door 2: Full YPP (Higher Tier)</p>
            <p className="comparisonItem__content">
              <strong>1,000 subscribers</strong> plus 4,000 public watch hours in the last 12 months,
              OR 10 million public Shorts views in the last 90 days. Unlocks all monetization
              features including Shorts Feed ad revenue sharing and Watch Page ads.
            </p>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The Switch That Matters</p>
          <p className="realTalk__text">
            Reaching the threshold is not enough. After approval, you need to accept the{" "}
            <strong>Shorts Monetization Module</strong> separately in YouTube Studio.
            Revenue sharing only starts from the date you accept. Views before that earn nothing.
            This is per{" "}
            <a
              href="https://support.google.com/youtube/answer/12504220"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube&apos;s official policy
            </a>
            .
          </p>
        </div>

        <div className="funCallout" style={{ marginTop: "1rem" }}>
          <p className="funCallout__text">
            <strong>What YouTube checks before approving you:</strong> Policy compliance
            (Community Guidelines, Terms of Service, Copyright), original content standards,
            advertiser-friendly content, active AdSense account, and consistent publishing.
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
          Shorts monetization works differently from long-form. Ads play between Shorts
          as viewers scroll, not on your specific video. All that ad money pools together,
          then gets split among creators based on their share of engaged views.
        </p>

        <div className="inlineIllustration">
          <FourStepMachineSvg />
        </div>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">1. Pool the Revenue</h4>
            <p className="factorCard__desc">
              All ad revenue from the Shorts Feed collects into one pool each month.
              This covers both creator payouts and music licensing costs.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">2. Calculate Music Costs</h4>
            <p className="factorCard__desc">
              If your Short uses music, the revenue associated with it splits between
              the Creator Pool and music partners based on track count.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">3. Allocate by Engaged Views</h4>
            <p className="factorCard__desc">
              Your share of the Creator Pool equals your percentage of total eligible
              engaged views from monetizing creators. 5% of views means 5% of the pool.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">4. Apply the 45% Split</h4>
            <p className="factorCard__desc">
              You keep 45% of your allocated revenue. YouTube keeps 55%. This split
              is fixed regardless of music usage.
            </p>
          </div>
        </div>

        <div className="floatRight" style={{ marginTop: "1rem" }}>
          <RevenuePizzaSvg />
        </div>

        <h3 className={s.subheading}>What You Can Control</h3>
        <p className={s.sectionText}>
          Several factors influence your Shorts earnings that are within your control:
        </p>
        <div className="comparisonGrid" style={{ marginTop: "1rem" }}>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Within Your Control</p>
            <p className="comparisonItem__content">
              Your share of engaged views, countries you reach, music usage decisions,
              publishing consistency, content quality, hook strength, retention through
              the video, and staying policy compliant.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Outside Your Control</p>
            <p className="comparisonItem__content">
              Total pool size, advertiser demand, seasonality (Q4 pays better),
              algorithm distribution, and other creators&apos; view counts.
            </p>
          </div>
        </div>

        <div className="inlineIllustration" style={{ marginTop: "1.5rem" }}>
          <CoinPoolSvg />
        </div>
      </section>

      {/* Music Impact */}
      <section id="music-impact" className="sectionTinted">
        <h2 className={s.sectionTitle}>How Music Affects Your Earnings</h2>

        <p className={s.sectionText}>
          Using trending sounds can boost reach. But music tracks reduce how much
          revenue flows to the Creator Pool and ultimately to you.
        </p>

        <div className="inlineIllustration">
          <MusicTaxSvg />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The Math</p>
          <p className="realTalk__text">
            No music equals 100% to Creator Pool. One track equals 50% Creator Pool, 50%
            music licensing. Two tracks equals 33% Creator Pool, 67% music. Your 45%
            share applies to whatever reaches the Creator Pool. Using music does not
            change your split percentage, but it shrinks the pie.
          </p>
        </div>

        <div className="comparisonGrid" style={{ marginTop: "1.5rem" }}>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">When Trending Audio Can Help</p>
            <p className="comparisonItem__content">
              Chasing eligibility views and need reach. Format naturally fits a trending
              sound. Hook relies on audio recognition. Building momentum matters more
              than per-view payout right now.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">When Original Audio Wins</p>
            <p className="comparisonItem__content">
              Already monetizing and optimizing payout. Voiceover or talking head format.
              Building a series with consistent audio branding. Brand safety matters for
              sponsors. You want maximum revenue per view.
            </p>
          </div>
        </div>

        <div className="funCallout" style={{ marginTop: "1rem" }}>
          <p className="funCallout__text">
            <strong>Practical test:</strong> Create two series, one with trending sounds
            and one with voiceover. Compare retention and subscription conversion after
            10 videos each. Let the data tell you which approach works for your niche.
          </p>
        </div>
      </section>

      {/* Original Content Requirements */}
      <section id="original-content" className="sectionOpen">
        <h2 className={s.sectionTitle}>Original and Transformative Content</h2>

        <p className={s.sectionText}>
          YouTube requires content to be &quot;original&quot; for monetization. For Shorts creators,
          especially those using AI tools or working with source material, understanding what
          qualifies as &quot;transformative&quot; is critical.
        </p>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">What YouTube Considers Original</h4>
            <p className="factorCard__desc">
              Content you created yourself, including unique commentary, original voiceover,
              meaningful editing that adds value, and your own narrative or perspective.
              The key is adding something that did not exist before.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Transformative for AI Workflows</h4>
            <p className="factorCard__desc">
              Using AI to assist creation is fine, but the final product needs your creative
              input. Voiceover, scripting, meaningful editing decisions, and unique angles
              all add transformative value.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">What Gets Flagged</h4>
            <p className="factorCard__desc">
              Re-uploading clips without adding value. Compilation videos with no original
              commentary. Content that looks templated or mass-produced without human
              creative direction.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Safe Practices</h4>
            <p className="factorCard__desc">
              Add your own voiceover explaining or reacting to content. Edit with intention
              rather than auto-generation. Create a recognizable style or series format.
              Build content around your perspective.
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">The Practical Test</p>
          <p className="realTalk__text">
            Ask yourself: would this content exist without my creative choices? If you removed
            your voiceover, editing decisions, and narrative, is there still something original
            left? If the answer is no, you are adding transformative value.
          </p>
        </div>
      </section>

      {/* Fastest Ways to Earn */}
      <section id="fastest-to-earn" className="sectionTinted">
        <h2 className={s.sectionTitle}>Earning While You Grow</h2>

        <p className={s.sectionText}>
          The fastest money from Shorts often does not come from ads. Here are income
          streams ranked by how quickly a smaller creator can start earning:
        </p>

        <div className="floatLeft">
          <TipJarSvg />
        </div>

        <div className="incomeGrid" style={{ marginTop: "1.5rem" }}>
          <IncomeStreamCard
            title="1. Affiliate Links"
            description="Recommend products and earn commission. Add links in your bio or pinned comments. Works from day one with zero subscribers. Best for products you actually use that fit your niche."
          />
          <IncomeStreamCard
            title="2. Services and Lead Generation"
            description="Use Shorts to demonstrate expertise, then convert to consulting, coaching, or client work. Keyword comment triggers plus a simple intake form work well."
          />
          <IncomeStreamCard
            title="3. Digital Products"
            description="Guides, templates, presets, mini-courses. Create once, sell forever. Shorts drive traffic to your product page. Keep offers low-friction and directly related to your Short topics."
          />
          <IncomeStreamCard
            title="4. UGC for Brands"
            description="Brands pay creators to make short-form content for their ads. You do not need a huge following, just proof you can create engaging Shorts. Build a portfolio of your best work."
          />
          <IncomeStreamCard
            title="5. Sponsorships"
            description="Once you have consistent reach, brands pay for integrated mentions. A single deal can outpay months of ad revenue. They look for consistent niche, clean content, and stable averages."
          />
          <IncomeStreamCard
            title="6. Fan Funding (Super Thanks)"
            description="Viewers tip directly on Shorts. Requires early access YPP (500 subs) where available. Tips appear highlighted in comments. Blocked if Content ID claims or comments disabled."
          />
        </div>

        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">What Sponsors Look For</p>
          <p className="realTalk__text">
            <strong>Consistent niche:</strong> Clear topic focus so they know what audience they get.{" "}
            <strong>Clean content:</strong> Advertiser-friendly without policy risks.{" "}
            <strong>Stable average views:</strong> Not one viral hit but repeatable performance.{" "}
            <strong>Engaged audience:</strong> Comments, shares, and saves matter.
          </p>
        </div>

        <ToolCtaCard
          title="Find Sponsors and Competitors in Your Niche"
          description="See which channels in your space are getting sponsorships and what content formats perform best."
          href="/competitors"
          bestFor="Best for niche research"
        />
      </section>

      {/* How to Start */}
      <section id="how-to-start" className="sectionOpen">
        <h2 className={s.sectionTitle}>How to Start Monetizing Shorts</h2>

        <p className={s.sectionText}>
          Here is the path from zero to earning from your Shorts:
        </p>

        <div className="conveyorSteps">
          <StepCard
            step={1}
            title="Set Up Your Channel Foundation"
            description="Enable 2-Step Verification on your Google account. Complete your About page. Ensure all content follows Community Guidelines, Terms of Service, and Copyright policies. No active strikes."
          />
          <StepCard
            step={2}
            title="Choose Your Eligibility Path"
            description="Early access (500 subs plus 3K hours or 3M Shorts) for fan funding features. Full YPP (1,000 subs plus 4K hours or 10M Shorts) for ad revenue. Shorts views do not count toward watch hours."
          />
          <StepCard
            step={3}
            title="Apply Through YouTube Studio"
            description="Go to YouTube Studio, then Earn, then Apply. Accept base terms and link your AdSense account. Review typically takes about one month. Your channel gets checked for policy compliance and content quality."
          />
          <StepCard
            step={4}
            title="Accept the Shorts Monetization Module"
            description="This is critical. After YPP approval, separately accept the Shorts Monetization Module in YouTube Studio. Revenue sharing starts from acceptance date, not before."
          />
          <StepCard
            step={5}
            title="Verify and Monitor"
            description="Check monetization icons on your Shorts in YouTube Studio. Green or yellow icons mean eligible for revenue sharing. Track earnings in Analytics then Revenue."
          />
        </div>

        <h3 className={s.subheading}>Common Reasons for Rejection or Delay</h3>

        <div className="blockerGrid">
          <BlockerCard
            title="Reused Content"
            description="Unedited clips from other sources, compilations without meaningful transformation, or reuploads from other platforms."
          />
          <BlockerCard
            title="Copyright and Content ID Issues"
            description="Active copyright strikes or too many Content ID claims. Resolve these before applying."
          />
          <BlockerCard
            title="Policy Violations"
            description="Community Guidelines strikes, misleading metadata, or spam behavior on the channel."
          />
          <BlockerCard
            title="Low Originality Signals"
            description="Content that appears templated, AI-generated without meaningful human input, or duplicative of other channels."
          />
        </div>

        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">Stay Active</p>
          <p className="realTalk__text">
            YouTube may pause monetization on channels that have not uploaded a video
            or posted to the Community tab for 6 months or more. Consistent publishing
            protects your monetization status.
          </p>
        </div>
      </section>

      {/* Views That Don't Count */}
      <section id="ineligible-views" className="sectionTinted">
        <h2 className={s.sectionTitle}>Views That Do Not Count</h2>

        <p className={s.sectionText}>
          YouTube calculates Shorts payments using eligible engaged views.
          Certain views are filtered out and will not earn you anything, even if
          they show up in your view count.
        </p>

        <div className="inlineIllustration">
          <IneligibleMuseumSvg />
        </div>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">Non-Original Content</h4>
            <p className="factorCard__desc">
              Unedited clips from movies, TV, or other creators. Reuploads from YouTube
              or other platforms. Compilations without meaningful original content added.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Artificial or Fake Views</h4>
            <p className="factorCard__desc">
              Views from automated clicks, scroll bots, or view-buying services.
              These get filtered out of payment calculations entirely.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Not Advertiser-Friendly</h4>
            <p className="factorCard__desc">
              Content inconsistent with advertiser-friendly guidelines. Inappropriate
              language, violence, or sensitive topics that violate YouTube content policies.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Over 1 Minute With Claimed Music</h4>
            <p className="factorCard__desc">
              Shorts over one minute containing claimed music content are blocked from
              monetization entirely per{" "}
              <a
                href="https://support.google.com/youtube/answer/12504220"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube policy
              </a>
              .
            </p>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Protect Your Eligibility</p>
          <p className="realTalk__text">
            <strong>Originality plus advertiser-friendly content are non-negotiable.</strong>{" "}
            Your channel must follow YouTube Partner Program policies, Community Guidelines,
            Terms of Service, and Copyright rules. Violations can result in losing
            monetization access, not just filtered views.
          </p>
        </div>
      </section>

      {/* Cross-link to Strategy */}
      <section id="next-steps" className="sectionOpen">
        <h2 className={s.sectionTitle}>Ready to Create Better Shorts?</h2>

        <p className={s.sectionText}>
          Now that you understand how monetization works, the next step is creating Shorts
          that actually perform. Strong hooks, good retention, and consistent publishing
          all drive the engaged views that determine your earnings.
        </p>

        <div
          style={{
            background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
            border: "2px solid #6366f1",
            borderRadius: "12px",
            padding: "24px",
            marginTop: "24px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e40af", margin: "0 0 12px" }}>
            YouTube Shorts Strategy Guide
          </h3>
          <p style={{ fontSize: "15px", color: "#3730a3", margin: "0 0 16px", lineHeight: 1.6 }}>
            Learn how to find promising niches, study competitor patterns, generate video ideas,
            and create Shorts with better hooks and retention.
          </p>
          <Link
            href="/learn/youtube-shorts-strategy"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "15px",
              fontWeight: 600,
              color: "white",
              textDecoration: "none",
              padding: "12px 20px",
              background: "#6366f1",
              borderRadius: "8px",
              transition: "all 0.15s ease",
            }}
          >
            Read Shorts Strategy Guide
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <ToolCtaCard
          title="Find Ideas That Work in Your Niche"
          description="Get video ideas based on what is performing for channels like yours."
          href="/ideas"
          bestFor="Best for idea generation"
        />
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Set up your channel for monetization success
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
          {BRAND.name} helps you track which Shorts drive subscribers, identify
          your best-performing content, and spot opportunities to grow faster.
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
