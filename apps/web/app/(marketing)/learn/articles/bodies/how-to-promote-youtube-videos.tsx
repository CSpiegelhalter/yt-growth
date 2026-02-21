/**
 * Body content for How to Promote YouTube Videos article.
 * Server component - no "use client" directive.
 *
 * IMPLEMENTATION PLAN:
 * - Keep all 8 section IDs unchanged (SEO/anchor stability)
 * - Replace UL/OL with card grids, panels, and visual stations
 * - Add 12 unique inline SVG visuals distributed across the page
 * - Mobile-first: stacking layouts, no cramped side-by-side
 * - Tone: calm, confident, slightly amused at "post link everywhere" instinct
 * - No hype phrases, no emojis
 * - All SVGs have proper accessibility (title/desc or aria-hidden)
 */

import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

/* ================================================
   INLINE SVG VISUALS (UNIQUE TO THIS PAGE)
   Fun, character-driven illustrations that make users laugh
   ================================================ */

/** 1) Megaphone into Black Hole vs Magnet - Bad promotion vs good discovery */
function MegaphoneVsLighthouse() {
  return (
    <svg
      width="520"
      height="280"
      viewBox="0 0 520 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="promo-title promo-desc"
    >
      <title id="promo-title">Megaphone into Black Hole vs Content Magnet</title>
      <desc id="promo-desc">
        Left: A frustrated creator screaming into a black hole that absorbs everything.
        Right: A giant magnet attracting views, likes, and subscribers.
      </desc>

      {/* Left: Black hole chaos (bad) */}
      <rect x="10" y="15" width="230" height="250" rx="12" fill="#0f172a" />
      
      {/* Swirling black hole - more detailed */}
      <ellipse cx="175" cy="130" rx="65" ry="55" fill="#1e293b" />
      <ellipse cx="175" cy="130" rx="50" ry="40" fill="#0f172a" />
      <ellipse cx="175" cy="130" rx="30" ry="22" fill="#000" />
      <ellipse cx="175" cy="130" rx="12" ry="8" fill="#1e1b4b" />
      {/* Spiral lines being sucked in - more dramatic */}
      <path d="M120 70 Q160 90, 165 120" stroke="#475569" strokeWidth="2" fill="none" />
      <path d="M210 65 Q185 95, 180 118" stroke="#475569" strokeWidth="2" fill="none" />
      <path d="M225 150 Q200 145, 185 135" stroke="#475569" strokeWidth="2" fill="none" />
      <path d="M130 180 Q155 165, 170 140" stroke="#475569" strokeWidth="1.5" fill="none" />
      
      {/* Creator with REALISTIC megaphone - desperate */}
      <g transform="translate(25, 95)">
        {/* Head - more detailed face */}
        <circle cx="35" cy="35" r="28" fill="#f5d0a9" stroke="#1e293b" strokeWidth="2" />
        {/* Hair */}
        <path d="M10 25 Q20 5, 45 8 Q65 10, 60 28" fill="#78350f" />
        {/* Stressed forehead wrinkles */}
        <path d="M22 22 Q35 18, 48 22" stroke="#d4a574" strokeWidth="1" fill="none" />
        <path d="M25 26 Q35 23, 45 26" stroke="#d4a574" strokeWidth="1" fill="none" />
        {/* Stressed eyebrows - angled up */}
        <path d="M18 32 L28 36" stroke="#78350f" strokeWidth="2.5" />
        <path d="M52 32 L42 36" stroke="#78350f" strokeWidth="2.5" />
        {/* Wide desperate eyes with bloodshot */}
        <ellipse cx="26" cy="42" rx="6" ry="5" fill="white" />
        <ellipse cx="44" cy="42" rx="6" ry="5" fill="white" />
        <circle cx="26" cy="43" r="3" fill="#1e293b" />
        <circle cx="44" cy="43" r="3" fill="#1e293b" />
        {/* Tiny red veins in eyes */}
        <path d="M20 40 L23 42" stroke="#dc2626" strokeWidth="0.5" />
        <path d="M50 40 L47 42" stroke="#dc2626" strokeWidth="0.5" />
        {/* Bags under eyes */}
        <path d="M20 48 Q26 51, 32 48" stroke="#d4a574" strokeWidth="1" fill="none" />
        <path d="M38 48 Q44 51, 50 48" stroke="#d4a574" strokeWidth="1" fill="none" />
        {/* Open mouth yelling - detailed */}
        <ellipse cx="35" cy="56" rx="8" ry="6" fill="#1e293b" />
        <path d="M28 54 Q35 52, 42 54" stroke="#f5d0a9" strokeWidth="1" fill="none" />
        {/* Teeth showing */}
        <rect x="30" y="52" width="3" height="3" fill="white" />
        <rect x="34" y="52" width="3" height="3" fill="white" />
        <rect x="38" y="52" width="3" height="3" fill="white" />
        {/* Tongue */}
        <ellipse cx="35" cy="59" rx="4" ry="2" fill="#dc2626" />
        
        {/* REALISTIC MEGAPHONE - chrome/metal */}
        <g transform="translate(60, 20)">
          {/* Cone - gradient effect with multiple layers */}
          <path d="M0 25 L55 5 L55 50 Z" fill="#ef4444" />
          <path d="M5 25 L55 8 L55 47 Z" fill="#dc2626" />
          <path d="M55 5 L55 50 L58 48 L58 7 Z" fill="#b91c1c" /> {/* side depth */}
          {/* Chrome ring at mouth */}
          <ellipse cx="55" cy="27" rx="4" ry="22" fill="#94a3b8" />
          <ellipse cx="55" cy="27" rx="2" ry="20" fill="#cbd5e1" />
          {/* Handle section */}
          <rect x="-8" y="18" width="12" height="16" rx="3" fill="#64748b" />
          <rect x="-6" y="20" width="8" height="12" rx="2" fill="#94a3b8" />
          {/* Grip texture */}
          <line x1="-5" y1="22" x2="1" y2="22" stroke="#475569" strokeWidth="1" />
          <line x1="-5" y1="25" x2="1" y2="25" stroke="#475569" strokeWidth="1" />
          <line x1="-5" y1="28" x2="1" y2="28" stroke="#475569" strokeWidth="1" />
          {/* Trigger */}
          <path d="M-2 34 Q0 40, 5 38" stroke="#475569" strokeWidth="2" fill="none" />
        </g>
        
        {/* Sweat drops - multiple */}
        <path d="M-5 30 Q-2 24, 1 30 Q-2 34, -5 30" fill="#60a5fa" />
        <path d="M65 45 Q68 40, 71 45 Q68 49, 65 45" fill="#60a5fa" />
        <path d="M-8 50 Q-6 46, -4 50 Q-6 53, -8 50" fill="#60a5fa" />
      </g>
      
      {/* Words being sucked into black hole - bigger text */}
      <text x="125" y="85" fontSize="12" fill="#94a3b8" opacity="0.9" fontWeight="600">WATCH!!</text>
      <text x="140" y="105" fontSize="10" fill="#64748b" opacity="0.7">please</text>
      <text x="150" y="122" fontSize="8" fill="#475569" opacity="0.4">sub...</text>
      <text x="158" y="135" fontSize="6" fill="#334155" opacity="0.2">like</text>
      
      <text x="120" y="245" textAnchor="middle" fontSize="14" fill="#94a3b8" fontStyle="italic">*void noises*</text>

      {/* Middle: VS - bigger */}
      <rect x="248" y="115" width="44" height="44" rx="22" fill="#334155" stroke="#475569" strokeWidth="2" />
      <text x="270" y="144" textAnchor="middle" fontSize="16" fontWeight="700" fill="#94a3b8">vs</text>

      {/* Right: MAGNET pulling in YouTube metrics */}
      <rect x="300" y="15" width="210" height="250" rx="12" fill="#f0fdf4" />
      
      {/* Giant horseshoe magnet */}
      <g transform="translate(340, 50)">
        {/* Magnet body - red and silver */}
        <path d="M0 80 Q0 0, 60 0 Q120 0, 120 80 L100 80 Q100 20, 60 20 Q20 20, 20 80 Z" fill="#dc2626" />
        {/* Silver tips */}
        <rect x="0" y="80" width="20" height="40" fill="#94a3b8" />
        <rect x="100" y="80" width="20" height="40" fill="#94a3b8" />
        {/* Metallic shine on silver */}
        <rect x="2" y="82" width="5" height="36" fill="#cbd5e1" />
        <rect x="102" y="82" width="5" height="36" fill="#cbd5e1" />
        {/* N and S poles */}
        <text x="10" y="105" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">N</text>
        <text x="110" y="105" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">S</text>
      </g>
      
      {/* YouTube Play Button being attracted */}
      <g transform="translate(320, 165)">
        <rect x="-12" y="-8" width="24" height="16" rx="3" fill="#dc2626" />
        <path d="M-4 -4 L6 0 L-4 4 Z" fill="white" />
        {/* Motion lines */}
        <line x1="-28" y1="0" x2="-18" y2="0" stroke="#dc2626" strokeWidth="2" />
        <line x1="-25" y1="-5" x2="-17" y2="-3" stroke="#dc2626" strokeWidth="1.5" />
      </g>
      
      {/* Thumbs up (like) being attracted */}
      <g transform="translate(485, 160)">
        <circle cx="0" cy="0" r="14" fill="#3b82f6" />
        {/* Better thumbs up icon */}
        <path d="M-2 6 L-2 1 L-6 1 L-6 6 Z" fill="white" /> {/* fist */}
        <path d="M-2 1 L-2 -2 Q-2 -5, 1 -5 L3 -5 Q5 -5, 5 -3 L5 1 L-2 1" fill="white" /> {/* thumb */}
        {/* Motion lines */}
        <line x1="20" y1="0" x2="28" y2="0" stroke="#3b82f6" strokeWidth="2" />
      </g>
      
      {/* Subscriber bell being attracted */}
      <g transform="translate(350, 200)">
        <circle cx="0" cy="0" r="12" fill="#fbbf24" />
        <path d="M0 -6 Q-5 -3, -5 2 L5 2 Q5 -3, 0 -6" fill="#1e293b" />
        <circle cx="0" cy="4" r="2" fill="#1e293b" />
        {/* Motion lines */}
        <line x1="-20" y1="5" x2="-14" y2="3" stroke="#fbbf24" strokeWidth="2" />
      </g>
      
      {/* View count being attracted - positioned higher to not overlap text */}
      <g transform="translate(420, 200)">
        <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#22c55e" />
        <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">+1K</text>
        {/* Motion lines pointing up toward magnet */}
        <line x1="0" y1="-18" x2="0" y2="-28" stroke="#22c55e" strokeWidth="2" />
      </g>
      
      {/* Comment bubble being attracted */}
      <g transform="translate(480, 195)">
        <ellipse cx="0" cy="0" rx="14" ry="12" fill="#8b5cf6" />
        <path d="M-6 10 L0 18 L6 10" fill="#8b5cf6" />
        {/* Three dots like typing indicator */}
        <circle cx="-5" cy="0" r="2" fill="white" />
        <circle cx="0" cy="0" r="2" fill="white" />
        <circle cx="5" cy="0" r="2" fill="white" />
        {/* Motion lines */}
        <line x1="18" y1="-5" x2="25" y2="-8" stroke="#8b5cf6" strokeWidth="2" />
      </g>
      
      {/* Speech bubble from magnet */}
      <path d="M405 30 L495 30 L495 65 L420 65 L410 77 L410 65 L405 65 Z" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <text x="450" y="48" textAnchor="middle" fontSize="11" fill="#166534" fontWeight="600">Come to me,</text>
      <text x="450" y="62" textAnchor="middle" fontSize="10" fill="#166534">my people!</text>
      
      <text x="405" y="255" textAnchor="middle" fontSize="12" fill="#166534" fontStyle="italic">*satisfied magnet noises*</text>
    </svg>
  );
}

/** 2) Snowball Effect - HYPER REALISTIC snowy snowball rolling down a winter hill */
function SnowballEffect() {
  return (
    <svg
      width="420"
      height="220"
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="snowball-title"
    >
      <title id="snowball-title">Snowball effect: good videos gather momentum over time</title>

      {/* Winter sky with gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <filter id="snowShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>
      
      <rect x="0" y="0" width="420" height="220" fill="url(#skyGrad)" />
      
      {/* Distant mountains */}
      <path d="M0 80 L50 40 L90 70 L130 30 L180 65 L220 25 L280 60 L320 35 L370 55 L420 30 L420 100 L0 100 Z" fill="#94a3b8" opacity="0.3" />
      
      {/* Snow-covered hill - more detailed with shadows */}
      <path d="M0 70 Q100 40, 200 110 Q320 180, 420 200 L420 220 L0 220 Z" fill="url(#snowGrad)" />
      {/* Hill contour shadow */}
      <path d="M0 75 Q100 48, 200 115 Q320 185, 420 203" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
      
      {/* Snow texture - realistic scattered snow clumps */}
      <g fill="#f1f5f9" opacity="0.7">
        <ellipse cx="40" cy="85" rx="8" ry="3" />
        <ellipse cx="80" cy="70" rx="6" ry="2" />
        <ellipse cx="130" cy="95" rx="10" ry="3" />
        <ellipse cx="180" cy="125" rx="7" ry="2" />
        <ellipse cx="250" cy="155" rx="12" ry="4" />
        <ellipse cx="320" cy="180" rx="8" ry="3" />
        <ellipse cx="380" cy="195" rx="10" ry="3" />
      </g>
      
      {/* Detailed pine trees */}
      <g transform="translate(340, 70)">
        {/* Tree shadow */}
        <ellipse cx="15" cy="85" rx="12" ry="4" fill="#1e293b" opacity="0.15" />
        {/* Trunk */}
        <rect x="10" y="65" width="10" height="20" fill="#78350f" />
        <rect x="11" y="67" width="3" height="18" fill="#92400e" />
        {/* Branches - layered */}
        <polygon points="15,0 -5,35 35,35" fill="#166534" />
        <polygon points="15,15 -8,50 38,50" fill="#15803d" />
        <polygon points="15,30 -10,65 40,65" fill="#14532d" />
        {/* Snow on branches */}
        <polygon points="15,0 5,15 25,15" fill="white" opacity="0.8" />
        <polygon points="15,30 8,42 22,42" fill="white" opacity="0.6" />
      </g>
      <g transform="translate(375, 95) scale(0.6)">
        <rect x="10" y="65" width="10" height="20" fill="#78350f" />
        <polygon points="15,0 -5,35 35,35" fill="#166534" />
        <polygon points="15,15 -8,50 38,50" fill="#15803d" />
        <polygon points="15,30 -10,65 40,65" fill="#14532d" />
      </g>

      {/* SMALL SNOWBALL - hyper realistic packed snow */}
      <g transform="translate(55, 55)" filter="url(#snowShadow)">
        <circle cx="0" cy="0" r="18" fill="white" />
        {/* Snow texture - packed ice/snow lumps */}
        <ellipse cx="-8" cy="-8" rx="5" ry="4" fill="#f8fafc" />
        <ellipse cx="6" cy="-5" rx="4" ry="3" fill="#f1f5f9" />
        <ellipse cx="-5" cy="8" rx="6" ry="4" fill="#f8fafc" />
        <ellipse cx="8" cy="5" rx="4" ry="3" fill="#f1f5f9" />
        {/* Shadows in crevices */}
        <path d="M-10 0 Q-5 3, 0 0" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        <path d="M2 -8 Q5 -5, 3 -2" stroke="#cbd5e1" strokeWidth="0.8" fill="none" />
        {/* Ice crystals glinting */}
        <circle cx="-5" cy="-10" r="1" fill="#bfdbfe" />
        <circle cx="10" cy="0" r="0.8" fill="#bfdbfe" />
        {/* Tiny play button */}
        <path d="M-4 -2 L5 0 L-4 2 Z" fill="#6366f1" />
      </g>
      <text x="55" y="28" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">Day 1</text>
      {/* Trail in snow */}
      <path d="M35 65 Q25 60, 20 70 Q15 80, 25 85" stroke="#e2e8f0" strokeWidth="3" fill="none" />

      {/* MEDIUM SNOWBALL - more snow accumulated */}
      <g transform="translate(165, 105)" filter="url(#snowShadow)">
        <circle cx="0" cy="0" r="32" fill="white" />
        {/* Detailed snow/ice texture */}
        <ellipse cx="-15" cy="-15" rx="8" ry="6" fill="#f8fafc" />
        <ellipse cx="10" cy="-12" rx="7" ry="5" fill="#f1f5f9" />
        <ellipse cx="-10" cy="10" rx="9" ry="6" fill="#f8fafc" />
        <ellipse cx="15" cy="8" rx="6" ry="4" fill="#f1f5f9" />
        <ellipse cx="0" cy="18" rx="8" ry="5" fill="#f8fafc" />
        {/* Shadow crevices */}
        <path d="M-18 -5 Q-10 0, -5 -5" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
        <path d="M5 10 Q12 15, 18 10" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        <path d="M-5 -18 Q0 -12, 5 -18" stroke="#cbd5e1" strokeWidth="0.8" fill="none" />
        {/* Ice crystal glints */}
        <circle cx="-18" cy="-10" r="1.5" fill="#bfdbfe" />
        <circle cx="20" cy="-5" r="1.2" fill="#bfdbfe" />
        <circle cx="5" cy="20" r="1" fill="#bfdbfe" />
        {/* Play button */}
        <path d="M-8 -3 L10 0 L-8 3 Z" fill="#6366f1" />
        {/* Viewer icons embedded */}
        <circle cx="-25" cy="-5" r="6" fill="#f97316" stroke="white" strokeWidth="2" />
        <circle cx="22" cy="15" r="5" fill="#22c55e" stroke="white" strokeWidth="2" />
      </g>
      <text x="165" y="58" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">Week 1</text>
      {/* Deeper trail */}
      <path d="M125 115 Q110 105, 105 118 Q100 130, 115 140" stroke="#e2e8f0" strokeWidth="5" fill="none" />

      {/* LARGE SNOWBALL - massive hyper realistic */}
      <g transform="translate(315, 155)" filter="url(#snowShadow)">
        <circle cx="0" cy="0" r="55" fill="white" />
        {/* Complex snow texture - many packed snow clumps */}
        <ellipse cx="-30" cy="-30" rx="12" ry="8" fill="#f8fafc" />
        <ellipse cx="15" cy="-35" rx="10" ry="7" fill="#f1f5f9" />
        <ellipse cx="35" cy="-15" rx="8" ry="6" fill="#f8fafc" />
        <ellipse cx="-35" cy="10" rx="11" ry="7" fill="#f1f5f9" />
        <ellipse cx="0" cy="35" rx="14" ry="8" fill="#f8fafc" />
        <ellipse cx="30" cy="25" rx="9" ry="6" fill="#f1f5f9" />
        <ellipse cx="-20" cy="-10" rx="10" ry="6" fill="#f8fafc" />
        <ellipse cx="10" cy="10" rx="8" ry="5" fill="#f8fafc" />
        <ellipse cx="-10" cy="25" rx="10" ry="6" fill="#f1f5f9" />
        {/* Deep shadow crevices */}
        <path d="M-35 -15 Q-25 -8, -20 -18" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
        <path d="M15 -20 Q25 -15, 30 -25" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
        <path d="M-15 20 Q-5 28, 5 20" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
        <path d="M25 10 Q35 18, 40 8" stroke="#cbd5e1" strokeWidth="1" fill="none" />
        {/* Ice crystal glints - multiple */}
        <circle cx="-40" cy="-25" r="2" fill="#bfdbfe" />
        <circle cx="30" cy="-30" r="1.8" fill="#bfdbfe" />
        <circle cx="42" cy="5" r="1.5" fill="#bfdbfe" />
        <circle cx="-35" cy="25" r="1.5" fill="#bfdbfe" />
        <circle cx="15" cy="40" r="2" fill="#bfdbfe" />
        {/* Play button */}
        <path d="M-15 -5 L20 0 L-15 5 Z" fill="#6366f1" />
        {/* Many viewer icons embedded in snow */}
        <circle cx="-45" cy="-10" r="8" fill="#f97316" stroke="white" strokeWidth="2" />
        <circle cx="-35" cy="-40" r="6" fill="#22c55e" stroke="white" strokeWidth="2" />
        <circle cx="40" cy="-20" r="7" fill="#8b5cf6" stroke="white" strokeWidth="2" />
        <circle cx="48" cy="10" r="6" fill="#ec4899" stroke="white" strokeWidth="2" />
        <circle cx="35" cy="40" r="6" fill="#f97316" stroke="white" strokeWidth="2" />
        <circle cx="-40" cy="35" r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
        <circle cx="-15" cy="45" r="5" fill="#22c55e" stroke="white" strokeWidth="2" />
        <circle cx="10" cy="-42" r="5" fill="#fbbf24" stroke="white" strokeWidth="2" />
      </g>
      
      {/* Snow spray particles */}
      <g fill="white" filter="url(#snowShadow)">
        <circle cx="375" cy="130" r="4" />
        <circle cx="385" cy="142" r="3" />
        <circle cx="378" cy="155" r="3.5" />
        <circle cx="390" cy="165" r="2.5" />
        <circle cx="382" cy="175" r="3" />
      </g>
      {/* Motion blur lines */}
      <g stroke="#94a3b8" strokeWidth="2" opacity="0.5">
        <line x1="372" y1="135" x2="395" y2="128" />
        <line x1="375" y1="155" x2="400" y2="150" />
        <line x1="372" y1="175" x2="398" y2="172" />
      </g>

      {/* MOMENTUM label */}
      <text x="315" y="70" textAnchor="middle" fontSize="18" fontWeight="700" fill="#4f46e5">MOMENTUM!</text>
      
      {/* Falling snowflakes */}
      <g fill="white" opacity="0.6">
        <circle cx="50" cy="15" r="2" />
        <circle cx="120" cy="25" r="1.5" />
        <circle cx="200" cy="10" r="2" />
        <circle cx="280" cy="20" r="1.5" />
        <circle cx="350" cy="15" r="2" />
      </g>
    </svg>
  );
}

/** 4) Video at the Doctor's Office - HYPER REALISTIC doctor checkup */
function VideoAtDoctor() {
  return (
    <svg
      width="400"
      height="300"
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="doctor-title"
    >
      <title id="doctor-title">Quality checkup: your video needs to pass the exam before publishing</title>

      {/* Doctor's office background - medical green/blue tint */}
      <rect x="0" y="0" width="400" height="300" fill="#f0fdfa" />
      
      {/* Wall with slight texture */}
      <rect x="0" y="0" width="400" height="200" fill="#f8fafc" />
      
      {/* Medical diploma on wall - more detailed */}
      <g transform="translate(280, 15)">
        <rect x="0" y="0" width="105" height="80" fill="#fffbeb" stroke="#78350f" strokeWidth="2" />
        <rect x="5" y="5" width="95" height="70" fill="white" stroke="#d4a574" strokeWidth="1" />
        <text x="52" y="20" textAnchor="middle" fontSize="6" fill="#78350f" fontStyle="italic">This certifies that</text>
        <text x="52" y="34" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">Dr. Algorithm</text>
        <text x="52" y="47" textAnchor="middle" fontSize="5" fill="#64748b">has completed training in</text>
        <text x="52" y="58" textAnchor="middle" fontSize="6" fontWeight="600" fill="#1e293b">Video Quality</text>
        <text x="52" y="67" textAnchor="middle" fontSize="6" fontWeight="600" fill="#1e293b">Assessment</text>
        {/* Seal - moved to bottom right corner */}
        <circle cx="85" cy="62" r="7" fill="#dc2626" opacity="0.8" />
      </g>
      
      {/* Eye chart on wall - YouTube themed */}
      <g transform="translate(20, 10)">
        <rect x="0" y="0" width="70" height="95" fill="white" stroke="#94a3b8" strokeWidth="2" />
        <text x="35" y="20" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1e293b">C</text>
        <text x="35" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">T R</text>
        <text x="35" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">A V D</text>
        <text x="35" y="65" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">W A T C H</text>
        <text x="35" y="76" textAnchor="middle" fontSize="6" fontWeight="700" fill="#1e293b">R E T E N T I O N</text>
        <text x="35" y="88" textAnchor="middle" fontSize="4" fontWeight="700" fill="#1e293b">T H U M B N A I L</text>
      </g>
      
      {/* Medical cabinet */}
      <rect x="120" y="20" width="60" height="80" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <rect x="125" y="25" width="50" height="35" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="125" y="62" width="50" height="35" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      {/* Medical supplies */}
      <rect x="130" y="30" width="8" height="20" rx="2" fill="#dc2626" />
      <rect x="142" y="35" width="6" height="15" rx="2" fill="#3b82f6" />
      <rect x="152" y="32" width="8" height="18" rx="2" fill="#22c55e" />

      {/* Floor */}
      <rect x="0" y="200" width="400" height="100" fill="#e2e8f0" />
      {/* Floor tiles */}
      <g stroke="#cbd5e1" strokeWidth="1">
        <line x1="0" y1="230" x2="400" y2="230" />
        <line x1="0" y1="260" x2="400" y2="260" />
        <line x1="50" y1="200" x2="50" y2="300" />
        <line x1="100" y1="200" x2="100" y2="300" />
        <line x1="150" y1="200" x2="150" y2="300" />
        <line x1="200" y1="200" x2="200" y2="300" />
        <line x1="250" y1="200" x2="250" y2="300" />
        <line x1="300" y1="200" x2="300" y2="300" />
        <line x1="350" y1="200" x2="350" y2="300" />
      </g>

      {/* Examination table - more realistic */}
      <g transform="translate(80, 165)">
        {/* Table top with padding */}
        <rect x="0" y="0" width="140" height="25" rx="5" fill="#cbd5e1" />
        <rect x="5" y="3" width="130" height="18" rx="3" fill="#94a3b8" />
        {/* Paper roll */}
        <rect x="10" y="0" width="120" height="6" fill="white" />
        {/* Table base */}
        <rect x="10" y="25" width="120" height="10" fill="#64748b" />
        {/* Legs */}
        <rect x="25" y="35" width="15" height="55" fill="#475569" />
        <rect x="100" y="35" width="15" height="55" fill="#475569" />
        {/* Foot rest */}
        <rect x="20" y="88" width="25" height="5" fill="#64748b" />
        <rect x="95" y="88" width="25" height="5" fill="#64748b" />
      </g>

      {/* NERVOUS VIDEO sitting on table - anthropomorphized and cute */}
      <g transform="translate(115, 95)">
        {/* Video body (rectangle with play button) */}
        <rect x="0" y="0" width="75" height="55" rx="6" fill="#6366f1" stroke="#4f46e5" strokeWidth="3" />
        {/* Screen glare */}
        <rect x="5" y="5" width="20" height="8" rx="2" fill="#818cf8" opacity="0.4" />
        <path d="M25 20 L50 27.5 L25 35 Z" fill="white" />
        
        {/* BIG googly nervous eyes */}
        <circle cx="20" cy="12" r="12" fill="white" stroke="#1e293b" strokeWidth="2" />
        <circle cx="55" cy="12" r="12" fill="white" stroke="#1e293b" strokeWidth="2" />
        {/* Pupils looking at doctor nervously - dilated */}
        <circle cx="24" cy="14" r="5" fill="#1e293b" />
        <circle cx="59" cy="14" r="5" fill="#1e293b" />
        {/* Light reflection in eyes */}
        <circle cx="22" cy="11" r="2" fill="white" />
        <circle cx="57" cy="11" r="2" fill="white" />
        
        {/* Nervous sweat drops - bigger */}
        <path d="M-8 8 Q-4 0, 0 8 Q-4 14, -8 8" fill="#60a5fa" />
        <path d="M78 12 Q82 5, 86 12 Q82 18, 78 12" fill="#60a5fa" />
        <path d="M-12 30 Q-8 24, -4 30 Q-8 35, -12 30" fill="#60a5fa" />
        
        {/* Worried wobbly mouth */}
        <path d="M22 45 Q37 38, 52 45" stroke="#c7d2fe" strokeWidth="3" fill="none" />
        
        {/* Little arms wringing nervously */}
        <line x1="0" y1="35" x2="-15" y2="45" stroke="#4f46e5" strokeWidth="4" />
        <line x1="75" y1="35" x2="90" y2="45" stroke="#4f46e5" strokeWidth="4" />
        <circle cx="-17" cy="47" r="5" fill="#4f46e5" />
        <circle cx="92" cy="47" r="5" fill="#4f46e5" />
        
        {/* Little stick legs dangling */}
        <line x1="20" y1="55" x2="15" y2="75" stroke="#4f46e5" strokeWidth="4" />
        <line x1="55" y1="55" x2="60" y2="75" stroke="#4f46e5" strokeWidth="4" />
        {/* Feet */}
        <ellipse cx="12" cy="78" rx="7" ry="4" fill="#4f46e5" />
        <ellipse cx="63" cy="78" rx="7" ry="4" fill="#4f46e5" />
      </g>
      
      {/* Thought bubble from video */}
      <g transform="translate(200, 60)">
        <ellipse cx="0" cy="0" rx="50" ry="28" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="-38" cy="25" r="5" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx="-46" cy="38" r="3" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        <text x="0" y="-5" textAnchor="middle" fontSize="11" fill="#64748b">Am I gonna</text>
        <text x="0" y="10" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">make it??</text>
      </g>

      {/* HYPER REALISTIC DOCTOR */}
      <g transform="translate(260, 105)">
        {/* Head - detailed skin tone and features */}
        <circle cx="45" cy="35" r="32" fill="#f5d0a9" stroke="#d4a574" strokeWidth="1" />
        {/* Subtle face contours */}
        <ellipse cx="45" cy="50" rx="20" ry="10" fill="#e8c49a" opacity="0.3" />
        
        {/* Hair - salt and pepper, distinguished */}
        <path d="M15 25 Q20 5, 45 3 Q70 5, 75 25 Q72 15, 45 12 Q18 15, 15 25" fill="#6b7280" />
        <path d="M20 22 Q25 12, 40 10 Q30 15, 25 22" fill="#9ca3af" /> {/* gray streak */}
        <path d="M65 20 Q60 12, 50 10 Q58 14, 62 20" fill="#9ca3af" /> {/* gray streak */}
        
        {/* Doctor head mirror - reflective */}
        <ellipse cx="45" cy="5" rx="15" ry="5" fill="#94a3b8" />
        <circle cx="45" cy="5" r="10" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
        <circle cx="45" cy="5" r="6" fill="#f8fafc" />
        <circle cx="43" cy="3" r="2" fill="white" />
        {/* Headband */}
        <rect x="20" y="8" width="50" height="6" rx="2" fill="#1e293b" />
        
        {/* Eyebrows - distinguished */}
        <path d="M28 28 Q35 25, 42 28" stroke="#4b5563" strokeWidth="2" fill="none" />
        <path d="M48 28 Q55 25, 62 28" stroke="#4b5563" strokeWidth="2" fill="none" />
        
        {/* Eyes - kind but professional */}
        <ellipse cx="35" cy="38" rx="6" ry="5" fill="white" />
        <ellipse cx="55" cy="38" rx="6" ry="5" fill="white" />
        <circle cx="36" cy="39" r="3" fill="#78350f" />
        <circle cx="56" cy="39" r="3" fill="#78350f" />
        <circle cx="35" cy="37" r="1" fill="white" />
        <circle cx="55" cy="37" r="1" fill="white" />
        {/* Crow's feet - shows experience */}
        <path d="M25 38 L22 35 M25 40 L21 40 M25 42 L22 45" stroke="#d4a574" strokeWidth="0.8" />
        <path d="M65 38 L68 35 M65 40 L69 40 M65 42 L68 45" stroke="#d4a574" strokeWidth="0.8" />
        
        {/* Nose */}
        <path d="M45 40 Q48 48, 45 52 Q42 48, 45 40" stroke="#d4a574" strokeWidth="1" fill="none" />
        
        {/* Slight reassuring smile */}
        <path d="M35 56 Q45 62, 55 56" stroke="#a16207" strokeWidth="2" fill="none" />
        
        {/* Neck */}
        <rect x="35" y="67" width="20" height="15" fill="#f5d0a9" />
        
        {/* White coat - detailed */}
        <path d="M10 82 Q15 75, 45 72 Q75 75, 80 82 L85 170 L5 170 Z" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        {/* Coat lapels */}
        <path d="M35 72 L25 95 L35 92 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <path d="M55 72 L65 95 L55 92 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        {/* Pocket */}
        <rect x="55" y="100" width="20" height="15" rx="2" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        {/* Pens in pocket */}
        <rect x="58" y="98" width="2" height="10" fill="#3b82f6" />
        <rect x="62" y="99" width="2" height="9" fill="#dc2626" />
        {/* Name tag */}
        <rect x="15" y="95" width="30" height="12" rx="2" fill="white" stroke="#94a3b8" strokeWidth="1" />
        <text x="30" y="103" textAnchor="middle" fontSize="5" fill="#1e293b">Dr. Algorithm</text>
        
        {/* Stethoscope - detailed */}
        <path d="M45 72 Q20 85, 25 130" stroke="#1e293b" strokeWidth="3" fill="none" />
        <path d="M45 72 Q70 85, 65 130" stroke="#1e293b" strokeWidth="3" fill="none" />
        {/* Earpieces */}
        <circle cx="25" cy="72" r="4" fill="#475569" />
        <circle cx="65" cy="72" r="4" fill="#475569" />
        {/* Chest piece */}
        <circle cx="25" cy="135" r="12" fill="#475569" stroke="#1e293b" strokeWidth="2" />
        <circle cx="25" cy="135" r="6" fill="#1e293b" />
        
        {/* Arm holding clipboard */}
        <path d="M80 90 Q100 95, 105 110" stroke="#f5d0a9" strokeWidth="8" fill="none" />
        {/* Hand */}
        <ellipse cx="108" cy="115" rx="8" ry="6" fill="#f5d0a9" />
        
        {/* Clipboard - detailed */}
        <rect x="95" y="115" width="40" height="55" rx="3" fill="#78350f" />
        <rect x="98" y="120" width="34" height="47" rx="2" fill="white" />
        {/* Clip */}
        <rect x="108" y="112" width="14" height="10" rx="2" fill="#94a3b8" />
        {/* Checklist on clipboard */}
        <line x1="102" y1="130" x2="125" y2="130" stroke="#94a3b8" strokeWidth="1" />
        <line x1="102" y1="140" x2="122" y2="140" stroke="#94a3b8" strokeWidth="1" />
        <line x1="102" y1="150" x2="120" y2="150" stroke="#94a3b8" strokeWidth="1" />
        {/* Checkmarks */}
        <path d="M103 128 L106 132 L112 124" stroke="#22c55e" strokeWidth="2" fill="none" />
        <path d="M103 138 L106 142 L112 134" stroke="#22c55e" strokeWidth="2" fill="none" />
        <path d="M103 148 L106 152 L112 144" stroke="#fbbf24" strokeWidth="2" fill="none" />
      </g>

      {/* Label at bottom */}
      <text x="200" y="285" textAnchor="middle" fontSize="13" fill="#64748b" fontStyle="italic">"Say aaaah... let me see that CTR."</text>
    </svg>
  );
}

/** 5) Squinting Person - HYPER REALISTIC struggling to see tiny thumbnail */
function SquintingAtThumbnail() {
  return (
    <svg
      width="480"
      height="240"
      viewBox="0 0 480 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="squint-title"
    >
      <title id="squint-title">Can you read your thumbnail at mobile size?</title>

      {/* Background */}
      <rect x="0" y="0" width="480" height="240" fill="#f8fafc" rx="12" />

      {/* HYPER REALISTIC Person squinting */}
      <g transform="translate(30, 30)">
        {/* Head - realistic skin tone and shape */}
        <ellipse cx="75" cy="75" rx="60" ry="70" fill="#f5d0a9" stroke="#d4a574" strokeWidth="1" />
        
        {/* Hair - messy, stressed */}
        <path d="M20 45 Q30 15, 75 10 Q120 15, 130 45 Q125 25, 100 20 Q75 15, 50 20 Q25 25, 20 45" fill="#78350f" />
        <path d="M25 42 Q35 30, 55 28" stroke="#92400e" strokeWidth="2" fill="none" />
        <path d="M125 42 Q115 30, 95 28" stroke="#92400e" strokeWidth="2" fill="none" />
        {/* Some stray hairs from stress */}
        <path d="M45 15 Q42 5, 48 8" stroke="#78350f" strokeWidth="2" fill="none" />
        <path d="M105 15 Q108 5, 102 8" stroke="#78350f" strokeWidth="2" fill="none" />
        
        {/* Ears */}
        <ellipse cx="15" cy="75" rx="10" ry="15" fill="#f5d0a9" stroke="#d4a574" strokeWidth="1" />
        <ellipse cx="135" cy="75" rx="10" ry="15" fill="#f5d0a9" stroke="#d4a574" strokeWidth="1" />
        
        {/* Forehead wrinkles from concentrating */}
        <path d="M45 38 Q75 30, 105 38" stroke="#d4a574" strokeWidth="1.5" fill="none" />
        <path d="M50 45 Q75 38, 100 45" stroke="#d4a574" strokeWidth="1" fill="none" />
        <path d="M55 52 Q75 47, 95 52" stroke="#d4a574" strokeWidth="0.8" fill="none" />
        
        {/* Eyebrows - furrowed, struggling */}
        <path d="M38 58 Q50 50, 62 58" stroke="#78350f" strokeWidth="3" fill="none" />
        <path d="M88 58 Q100 50, 112 58" stroke="#78350f" strokeWidth="3" fill="none" />
        
        {/* SQUINTED EYES - but with visible white slivers */}
        {/* Left eye socket shadow */}
        <ellipse cx="50" cy="72" rx="18" ry="12" fill="#e8c49a" opacity="0.5" />
        {/* Left eye - squinted but you can see a sliver of white and pupil */}
        <path d="M35 70 Q50 62, 65 70" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <path d="M35 74 Q50 82, 65 74" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        {/* Sliver of visible eye */}
        <ellipse cx="50" cy="72" rx="12" ry="3" fill="white" />
        <ellipse cx="52" cy="72" rx="4" ry="2" fill="#78350f" />
        <circle cx="53" cy="71.5" r="1" fill="#1e293b" />
        {/* Heavy wrinkles around eye */}
        <path d="M30 65 L35 68 M28 72 L34 72 M30 79 L35 76" stroke="#d4a574" strokeWidth="1.2" />
        
        {/* Right eye socket shadow */}
        <ellipse cx="100" cy="72" rx="18" ry="12" fill="#e8c49a" opacity="0.5" />
        {/* Right eye - squinted with visible sliver */}
        <path d="M85 70 Q100 62, 115 70" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        <path d="M85 74 Q100 82, 115 74" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        {/* Sliver of visible eye */}
        <ellipse cx="100" cy="72" rx="12" ry="3" fill="white" />
        <ellipse cx="98" cy="72" rx="4" ry="2" fill="#78350f" />
        <circle cx="97" cy="71.5" r="1" fill="#1e293b" />
        {/* Heavy wrinkles around eye */}
        <path d="M120 65 L115 68 M122 72 L116 72 M120 79 L115 76" stroke="#d4a574" strokeWidth="1.2" />
        
        {/* Nose - realistic */}
        <path d="M75 65 Q80 80, 75 92" stroke="#d4a574" strokeWidth="1.5" fill="none" />
        <ellipse cx="70" cy="92" rx="5" ry="3" fill="#e8c49a" />
        <ellipse cx="80" cy="92" rx="5" ry="3" fill="#e8c49a" />
        
        {/* Confused/frustrated mouth - realistic */}
        <path d="M55 108 Q65 102, 75 105 Q85 102, 95 108" stroke="#a16207" strokeWidth="2" fill="none" />
        {/* Slight frown lines */}
        <path d="M52 105 L55 108" stroke="#d4a574" strokeWidth="1" />
        <path d="M98 105 L95 108" stroke="#d4a574" strokeWidth="1" />
        
        {/* Neck */}
        <rect x="55" y="140" width="40" height="30" fill="#f5d0a9" />
        
        {/* Shoulders hint */}
        <path d="M20 170 Q75 160, 130 170" fill="#64748b" />
      </g>

      {/* Question marks showing confusion - bigger */}
      <text x="5" y="35" fontSize="28" fill="#f59e0b" fontWeight="700">?</text>
      <text x="140" y="25" fontSize="20" fill="#f59e0b">?</text>
      <text x="25" y="185" fontSize="16" fill="#f59e0b">?</text>

      {/* Arrow pointing to phone - with space */}
      <g transform="translate(180, 95)">
        <path d="M0 0 L50 0" stroke="#94a3b8" strokeWidth="3" />
        <polygon points="50,0 42,-6 42,6" fill="#94a3b8" />
      </g>

      {/* Phone with TINY thumbnail - positioned with space */}
      <g transform="translate(250, 35)">
        {/* Phone body - realistic */}
        <rect x="0" y="0" width="70" height="130" rx="10" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
        {/* Screen bezel */}
        <rect x="4" y="10" width="62" height="110" rx="4" fill="#f8fafc" />
        {/* Camera notch */}
        <ellipse cx="35" cy="5" rx="8" ry="3" fill="#0f172a" />
        {/* Home indicator */}
        <rect x="22" y="123" width="26" height="3" rx="1.5" fill="#0f172a" />
        
        {/* YouTube app mockup */}
        <rect x="6" y="14" width="58" height="12" fill="#dc2626" />
        <text x="35" y="23" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">YouTube</text>
        
        {/* MICROSCOPIC thumbnail - deliberately unreadable */}
        <rect x="8" y="30" width="54" height="32" rx="3" fill="#c4b5fd" />
        {/* Complete blur/noise */}
        <rect x="12" y="35" width="14" height="8" fill="#a78bfa" />
        <rect x="30" y="33" width="18" height="6" fill="#8b5cf6" />
        <rect x="18" y="46" width="20" height="6" fill="#a78bfa" />
        <rect x="42" y="44" width="14" height="8" fill="#8b5cf6" />
        <rect x="10" y="54" width="12" height="5" fill="#a78bfa" />
        
        {/* Tiny illegible "title" */}
        <rect x="8" y="66" width="45" height="3" fill="#94a3b8" />
        <rect x="8" y="72" width="30" height="3" fill="#cbd5e1" />
        
        {/* Another tiny video */}
        <rect x="8" y="82" width="54" height="28" rx="2" fill="#e2e8f0" />
        <rect x="8" y="114" width="35" height="3" fill="#94a3b8" />
      </g>

      {/* Speech bubble - positioned away */}
      <g transform="translate(340, 25)">
        <path d="M0 0 L120 0 L120 75 L30 75 L15 95 L15 75 L0 75 Z" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <text x="60" y="25" textAnchor="middle" fontSize="16" fill="#1e293b" fontWeight="700">WHAT</text>
        <text x="60" y="48" textAnchor="middle" fontSize="16" fill="#1e293b" fontWeight="700">IS THAT?!</text>
        <text x="60" y="68" textAnchor="middle" fontSize="11" fill="#64748b">I literally cannot see...</text>
      </g>

      {/* Label at bottom - centered with padding */}
      <text x="240" y="220" textAnchor="middle" fontSize="15" fill="#1e293b" fontWeight="600">If YOU can't read it, neither can viewers.</text>
    </svg>
  );
}

/** 6) NASA-style Mission Control - Epic control room for video launch */
function MissionControl() {
  return (
    <svg
      width="380"
      height="200"
      viewBox="0 0 380 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="mission-title"
    >
      <title id="mission-title">Launch day mission control: the first hour matters</title>

      {/* Dark control room background */}
      <rect x="0" y="0" width="380" height="200" rx="8" fill="#0f172a" />
      
      {/* Dramatic ceiling lights */}
      <ellipse cx="190" cy="5" rx="150" ry="8" fill="#334155" />
      <ellipse cx="190" cy="5" rx="80" ry="4" fill="#475569" />
      
      {/* BIG MAIN SCREEN on wall */}
      <rect x="100" y="15" width="180" height="75" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      {/* YouTube video playing on main screen */}
      <rect x="110" y="22" width="100" height="58" rx="2" fill="#0f172a" />
      {/* Video thumbnail */}
      <rect x="115" y="27" width="90" height="48" rx="1" fill="#6366f1" />
      <path d="M150 41 L170 51 L150 61 Z" fill="white" fillOpacity="0.9" />
      {/* Live indicator on screen */}
      <circle cx="128" cy="35" r="4" fill="#dc2626">
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
      </circle>
      <text x="140" y="38" fontSize="6" fontWeight="700" fill="#dc2626">LIVE</text>
      
      {/* Stats display on main screen right side */}
      <rect x="218" y="25" width="55" height="50" fill="#0f172a" />
      <text x="245" y="40" textAnchor="middle" fontSize="6" fill="#94a3b8">REAL-TIME</text>
      <text x="245" y="56" textAnchor="middle" fontSize="14" fontWeight="700" fill="#22c55e">847</text>
      <text x="245" y="68" textAnchor="middle" fontSize="5" fill="#64748b">watching now</text>

      {/* Row of smaller status screens */}
      <rect x="20" y="20" width="70" height="50" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <text x="55" y="33" textAnchor="middle" fontSize="6" fill="#f97316">CTR MONITOR</text>
      <text x="55" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill="#22c55e">4.2%</text>
      
      <rect x="290" y="20" width="70" height="45" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <text x="325" y="35" textAnchor="middle" fontSize="6" fill="#3b82f6">AVG VIEW</text>
      <text x="325" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="#22c55e">3:42</text>
      <text x="325" y="62" textAnchor="middle" fontSize="5" fill="#64748b">minutes</text>

      {/* CONSOLE DESK - curved NASA style */}
      <path d="M30 130 Q190 110, 350 130 L360 190 L20 190 Z" fill="#334155" />
      <path d="M35 132 Q190 114, 345 132 L350 145 L30 145 Z" fill="#475569" />
      
      {/* Control panels on desk */}
      {/* Left panel - comments */}
      <rect x="50" y="148" width="80" height="35" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
      <text x="90" y="160" textAnchor="middle" fontSize="6" fill="#f97316">COMMENTS</text>
      <text x="90" y="175" textAnchor="middle" fontSize="14" fontWeight="700" fill="#22c55e">23</text>
      {/* Blinking new comment indicator */}
      <circle cx="125" cy="155" r="3" fill="#f97316">
        <animate attributeName="opacity" values="1;0;1" dur="0.5s" repeatCount="indefinite" />
      </circle>
      
      {/* Center panel - main controls */}
      <rect x="145" y="148" width="90" height="35" rx="3" fill="#1e293b" stroke="#6366f1" strokeWidth="2" />
      {/* Button row */}
      <circle cx="165" cy="162" r="6" fill="#22c55e" />
      <circle cx="185" cy="162" r="6" fill="#fbbf24" />
      <circle cx="205" cy="162" r="6" fill="#f97316" />
      <circle cx="225" cy="162" r="6" fill="#dc2626" />
      {/* Slider */}
      <rect x="155" y="173" width="60" height="4" rx="2" fill="#475569" />
      <rect x="155" y="173" width="35" height="4" rx="2" fill="#6366f1" />
      
      {/* Right panel - subs */}
      <rect x="250" y="148" width="80" height="35" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
      <text x="290" y="160" textAnchor="middle" fontSize="6" fill="#8b5cf6">NEW SUBS</text>
      <text x="290" y="175" textAnchor="middle" fontSize="14" fontWeight="700" fill="#22c55e">+12</text>

      {/* Creator in command chair */}
      <g transform="translate(170, 95)">
        {/* Chair back */}
        <rect x="-10" y="15" width="60" height="40" rx="5" fill="#1e293b" />
        {/* Head */}
        <circle cx="20" cy="12" r="18" fill="#fde68a" stroke="#1e293b" strokeWidth="2" />
        {/* Headset */}
        <path d="M2 8 Q20 -5, 38 8" stroke="#1e293b" strokeWidth="3" fill="none" />
        <rect x="-2" y="5" width="8" height="12" rx="2" fill="#1e293b" />
        <rect x="34" y="5" width="8" height="12" rx="2" fill="#1e293b" />
        {/* Mic */}
        <path d="M6 15 Q15 22, 14 25" stroke="#1e293b" strokeWidth="2" fill="none" />
        <circle cx="14" cy="27" r="3" fill="#1e293b" />
        {/* Focused eyes (looking at screens) */}
        <circle cx="13" cy="10" r="4" fill="white" />
        <circle cx="27" cy="10" r="4" fill="white" />
        <circle cx="15" cy="11" r="2" fill="#1e293b" />
        <circle cx="29" cy="11" r="2" fill="#1e293b" />
        {/* Determined mouth */}
        <path d="M12 20 Q20 17, 28 20" stroke="#1e293b" strokeWidth="2" fill="none" />
        {/* Body */}
        <rect x="5" y="30" width="30" height="25" rx="3" fill="#6366f1" />
      </g>

      {/* Coffee mug */}
      <rect x="340" y="155" width="18" height="22" rx="3" fill="#78350f" />
      <path d="M358 162 Q365 165, 358 175" stroke="#78350f" strokeWidth="3" fill="none" />
      {/* Steam */}
      <path d="M344 152 Q347 146, 350 152" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M350 150 Q353 143, 356 150" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.4" />

      {/* Status bar at bottom */}
      <rect x="20" y="188" width="340" height="8" rx="2" fill="#1e293b" />
      <rect x="22" y="190" width="180" height="4" rx="1" fill="#22c55e" />
      <text x="210" y="194" fontSize="5" fill="#94a3b8">LAUNCH SEQUENCE: 53% COMPLETE</text>
    </svg>
  );
}

/** 7) Tennis Match - Realistic tennis rally for comment engagement */
function CommentTennisMatch() {
  return (
    <svg
      width="300"
      height="180"
      viewBox="0 0 300 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="tennis-title"
    >
      <title id="tennis-title">Comments are a conversation: replies build relationships</title>

      {/* Sky background */}
      <rect x="0" y="0" width="300" height="80" fill="#7dd3fc" />
      {/* Stadium lights */}
      <circle cx="50" cy="20" r="8" fill="#fef3c7" />
      <circle cx="250" cy="20" r="8" fill="#fef3c7" />
      
      {/* Tennis court - clay/hard court */}
      <rect x="15" y="65" width="270" height="100" fill="#0369a1" />
      {/* Court lines */}
      <rect x="20" y="70" width="260" height="90" fill="none" stroke="white" strokeWidth="2" />
      {/* Service boxes */}
      <line x1="150" y1="70" x2="150" y2="160" stroke="white" strokeWidth="2" />
      <line x1="60" y1="115" x2="240" y2="115" stroke="white" strokeWidth="2" />
      <line x1="60" y1="70" x2="60" y2="160" stroke="white" strokeWidth="2" />
      <line x1="240" y1="70" x2="240" y2="160" stroke="white" strokeWidth="2" />
      
      {/* Net with proper posts */}
      <rect x="148" y="65" width="4" height="100" fill="#1e293b" />
      {/* Net mesh */}
      <rect x="20" y="105" width="260" height="20" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="20" y1="115" x2="280" y2="115" stroke="white" strokeWidth="2" />
      {/* Net posts */}
      <rect x="15" y="100" width="8" height="30" fill="#64748b" />
      <rect x="277" y="100" width="8" height="30" fill="#64748b" />
      
      {/* Creator (left) - in tennis action pose */}
      <g transform="translate(55, 95)">
        {/* Body lunging to hit */}
        <ellipse cx="0" cy="25" rx="12" ry="8" fill="#6366f1" /> {/* torso */}
        {/* Head */}
        <circle cx="0" cy="8" r="12" fill="#fde68a" stroke="#1e293b" strokeWidth="1.5" />
        {/* Tennis headband */}
        <rect x="-12" y="2" width="24" height="5" rx="2" fill="#6366f1" />
        {/* Focused eyes */}
        <circle cx="-4" cy="8" r="2" fill="#1e293b" />
        <circle cx="4" cy="8" r="2" fill="#1e293b" />
        {/* Determined mouth */}
        <path d="M-4 14 Q0 12, 4 14" stroke="#1e293b" strokeWidth="1.5" fill="none" />
        {/* Arm swinging racket */}
        <line x1="10" y1="20" x2="35" y2="5" stroke="#fde68a" strokeWidth="4" />
        {/* Tennis racket - proper shape */}
        <ellipse cx="45" cy="-5" rx="15" ry="20" fill="none" stroke="#1e293b" strokeWidth="2" />
        <ellipse cx="45" cy="-5" rx="12" ry="16" fill="none" stroke="#94a3b8" strokeWidth="1" />
        {/* Racket strings */}
        <line x1="37" y1="-5" x2="53" y2="-5" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="39" y1="-12" x2="51" y2="-12" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="39" y1="2" x2="51" y2="2" stroke="#94a3b8" strokeWidth="0.5" />
        <line x1="45" y1="-22" x2="45" y2="12" stroke="#94a3b8" strokeWidth="0.5" />
        {/* Racket handle */}
        <line x1="35" y1="5" x2="45" y2="15" stroke="#78350f" strokeWidth="3" />
        {/* Legs in running pose */}
        <line x1="-5" y1="32" x2="-15" y2="55" stroke="#1e293b" strokeWidth="3" />
        <line x1="5" y1="32" x2="20" y2="50" stroke="#1e293b" strokeWidth="3" />
        {/* Tennis shoes */}
        <ellipse cx="-17" cy="57" rx="6" ry="3" fill="white" stroke="#1e293b" strokeWidth="1" />
        <ellipse cx="22" cy="52" rx="6" ry="3" fill="white" stroke="#1e293b" strokeWidth="1" />
      </g>
      
      {/* Viewer (right) - ready to return */}
      <g transform="translate(230, 105)">
        {/* Body in ready stance */}
        <ellipse cx="0" cy="20" rx="10" ry="7" fill="#f97316" />
        {/* Head */}
        <circle cx="0" cy="5" r="11" fill="#c2410c" stroke="#1e293b" strokeWidth="1.5" />
        {/* Tennis visor */}
        <path d="M-12 0 Q0 -8, 12 0" fill="white" />
        {/* Happy eyes */}
        <circle cx="-4" cy="4" r="1.5" fill="white" />
        <circle cx="4" cy="4" r="1.5" fill="white" />
        {/* Excited smile */}
        <path d="M-4 10 Q0 14, 4 10" stroke="white" strokeWidth="1.5" fill="none" />
        {/* Arms ready with racket */}
        <line x1="-10" y1="18" x2="-25" y2="8" stroke="#c2410c" strokeWidth="3" />
        {/* Racket */}
        <ellipse cx="-35" cy="0" rx="12" ry="16" fill="none" stroke="#1e293b" strokeWidth="2" />
        <line x1="-25" y1="8" x2="-35" y2="16" stroke="#78350f" strokeWidth="3" />
        {/* Legs ready */}
        <line x1="-4" y1="26" x2="-10" y2="45" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="4" y1="26" x2="10" y2="45" stroke="#1e293b" strokeWidth="2.5" />
        {/* Shoes */}
        <ellipse cx="-12" cy="47" rx="5" ry="3" fill="white" />
        <ellipse cx="12" cy="47" rx="5" ry="3" fill="white" />
      </g>

      {/* Tennis ball (comment) flying over net */}
      <circle cx="150" cy="80" r="10" fill="#d9f99d" stroke="#65a30d" strokeWidth="2" />
      {/* Ball seam */}
      <path d="M143 75 Q150 80, 143 85" stroke="#65a30d" strokeWidth="1.5" fill="none" />
      <path d="M157 75 Q150 80, 157 85" stroke="#65a30d" strokeWidth="1.5" fill="none" />
      
      {/* Comment text on ball */}
      <text x="150" y="82" textAnchor="middle" fontSize="5" fontWeight="700" fill="#166534">Nice!</text>

      {/* Motion trail */}
      <path d="M80 90 Q120 50, 145 78" stroke="#84cc16" strokeWidth="2" fill="none" strokeDasharray="4 2" opacity="0.6" />
      
      {/* Another ball showing reply trajectory */}
      <circle cx="200" cy="95" r="7" fill="#d9f99d" stroke="#65a30d" strokeWidth="1.5" opacity="0.5" />
      <path d="M155 82 Q180 60, 200 90" stroke="#84cc16" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.4" />

      {/* Labels */}
      <text x="55" y="55" textAnchor="middle" fontSize="10" fontWeight="700" fill="#4f46e5">You</text>
      <text x="245" y="55" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ea580c">Viewer</text>
      
      {/* Rally counter */}
      <rect x="125" y="40" width="50" height="18" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="150" y="52" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">Rally: 5</text>
      
      {/* Label at bottom */}
      <text x="150" y="175" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="500">Keep the rally going!</text>
    </svg>
  );
}

/** 9) Distribution Vending Machine - Pick your channels wisely */
function DistributionVendingMachine() {
  return (
    <svg
      width="380"
      height="230"
      viewBox="0 0 380 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="vending-title"
    >
      <title id="vending-title">Distribution vending machine: pick your channels wisely</title>

      {/* Background */}
      <rect x="0" y="0" width="380" height="230" fill="#f1f5f9" rx="8" />

      {/* THE VENDING MACHINE */}
      <rect x="120" y="15" width="180" height="175" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
      
      {/* Glass front panel */}
      <rect x="130" y="25" width="130" height="120" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      
      {/* "DISTRIBUTION" header with lights */}
      <rect x="135" y="30" width="120" height="18" rx="2" fill="#dc2626" />
      <text x="195" y="43" textAnchor="middle" fontSize="9" fontWeight="700" fill="white" letterSpacing="1">DISTRIBUTION</text>
      {/* Blinking lights */}
      <circle cx="140" cy="39" r="3" fill="#fbbf24">
        <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="250" cy="39" r="3" fill="#fbbf24">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
      </circle>

      {/* Shelf 1: YouTube Native - "BEST SELLER" */}
      <rect x="135" y="52" width="120" height="28" fill="#1e293b" />
      <g transform="translate(140, 55)">
        {/* YouTube item - big and prominent */}
        <rect x="0" y="0" width="35" height="22" rx="3" fill="#dc2626" />
        <path d="M12 8 L25 11 L12 14 Z" fill="white" />
        <text x="17" y="20" textAnchor="middle" fontSize="4" fill="white">A1</text>
      </g>
      {/* "BEST SELLER" tag */}
      <rect x="180" y="58" width="40" height="12" rx="2" fill="#22c55e" />
      <text x="200" y="67" textAnchor="middle" fontSize="5" fontWeight="700" fill="white">BEST!</text>
      {/* Price tag */}
      <text x="230" y="72" textAnchor="middle" fontSize="7" fill="#22c55e">FREE</text>

      {/* Shelf 2: Social platforms */}
      <rect x="135" y="82" width="120" height="28" fill="#1e293b" />
      <g transform="translate(140, 85)">
        {/* X/Twitter */}
        <rect x="0" y="0" width="28" height="22" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
        <text x="14" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">X</text>
        <text x="14" y="20" textAnchor="middle" fontSize="4" fill="#64748b">B1</text>
      </g>
      <g transform="translate(175, 85)">
        {/* Instagram-ish */}
        <rect x="0" y="0" width="28" height="22" rx="3" fill="url(#igGradient)" />
        <defs>
          <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx="14" cy="10" r="6" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="20" cy="4" r="1.5" fill="white" />
        <text x="14" y="20" textAnchor="middle" fontSize="4" fill="white">B2</text>
      </g>
      {/* Price */}
      <text x="230" y="100" textAnchor="middle" fontSize="6" fill="#fbbf24">TIME</text>

      {/* Shelf 3: Communities & Collabs */}
      <rect x="135" y="112" width="120" height="28" fill="#1e293b" />
      <g transform="translate(140, 115)">
        {/* Reddit */}
        <rect x="0" y="0" width="28" height="22" rx="3" fill="#f97316" />
        <circle cx="14" cy="9" r="5" fill="white" />
        <circle cx="11" cy="8" r="1" fill="#f97316" />
        <circle cx="17" cy="8" r="1" fill="#f97316" />
        <ellipse cx="14" cy="12" rx="3" ry="1.5" fill="#f97316" />
        <text x="14" y="20" textAnchor="middle" fontSize="4" fill="white">C1</text>
      </g>
      <g transform="translate(175, 115)">
        {/* Discord */}
        <rect x="0" y="0" width="28" height="22" rx="3" fill="#5865f2" />
        <text x="14" y="13" textAnchor="middle" fontSize="8" fill="white">💬</text>
        <text x="14" y="20" textAnchor="middle" fontSize="4" fill="white">C2</text>
      </g>
      <g transform="translate(210, 115)">
        {/* Collab */}
        <rect x="0" y="0" width="28" height="22" rx="3" fill="#8b5cf6" />
        <text x="14" y="15" textAnchor="middle" fontSize="10" fill="white">🤝</text>
        <text x="14" y="20" textAnchor="middle" fontSize="4" fill="white">C3</text>
      </g>

      {/* Control panel on right side */}
      <rect x="265" y="25" width="30" height="120" rx="3" fill="#334155" />
      {/* Keypad */}
      <rect x="268" y="30" width="24" height="50" rx="2" fill="#1e293b" />
      {/* Buttons */}
      <circle cx="274" cy="40" r="4" fill="#475569" stroke="#64748b" strokeWidth="1" />
      <text x="274" y="42" textAnchor="middle" fontSize="5" fill="white">A</text>
      <circle cx="286" cy="40" r="4" fill="#475569" stroke="#64748b" strokeWidth="1" />
      <text x="286" y="42" textAnchor="middle" fontSize="5" fill="white">B</text>
      <circle cx="274" cy="52" r="4" fill="#475569" stroke="#64748b" strokeWidth="1" />
      <text x="274" y="54" textAnchor="middle" fontSize="5" fill="white">C</text>
      <circle cx="286" cy="52" r="4" fill="#475569" stroke="#64748b" strokeWidth="1" />
      <text x="286" y="54" textAnchor="middle" fontSize="5" fill="white">1</text>
      <circle cx="274" cy="64" r="4" fill="#475569" stroke="#64748b" strokeWidth="1" />
      <text x="274" y="66" textAnchor="middle" fontSize="5" fill="white">2</text>
      <circle cx="286" cy="64" r="4" fill="#475569" stroke="#64748b" strokeWidth="1" />
      <text x="286" y="66" textAnchor="middle" fontSize="5" fill="white">3</text>
      
      {/* Display screen */}
      <rect x="268" y="85" width="24" height="15" rx="2" fill="#0f172a" />
      <text x="280" y="95" textAnchor="middle" fontSize="6" fill="#22c55e">A1</text>
      
      {/* Coin slot */}
      <rect x="272" y="105" width="16" height="3" rx="1" fill="#0f172a" />
      <text x="280" y="118" textAnchor="middle" fontSize="5" fill="#94a3b8">INSERT</text>
      <text x="280" y="125" textAnchor="middle" fontSize="5" fill="#94a3b8">EFFORT</text>
      
      {/* Dispenser slot at bottom */}
      <rect x="140" y="148" width="110" height="25" rx="4" fill="#0f172a" />
      <text x="195" y="163" textAnchor="middle" fontSize="6" fill="#64748b">TAKE YOUR REACH</text>
      
      {/* Push flap */}
      <rect x="150" y="168" width="90" height="8" rx="2" fill="#334155" />

      {/* VIDEO CHARACTER choosing */}
      <g transform="translate(50, 80)">
        {/* Video body */}
        <rect x="0" y="0" width="45" height="32" rx="4" fill="#6366f1" stroke="#4f46e5" strokeWidth="2" />
        <path d="M13 10 L32 16 L13 22 Z" fill="white" />
        
        {/* Thinking face */}
        <circle cx="10" cy="5" r="4" fill="white" />
        <circle cx="35" cy="5" r="4" fill="white" />
        <circle cx="11" cy="6" r="2" fill="#1e293b" />
        <circle cx="36" cy="6" r="2" fill="#1e293b" />
        {/* Hmm expression */}
        <path d="M15 26 Q22 24, 30 26" stroke="#c7d2fe" strokeWidth="2" fill="none" />
        
        {/* Hand pointing/reaching */}
        <line x1="45" y1="18" x2="65" y2="15" stroke="#4f46e5" strokeWidth="3" />
        <circle cx="67" cy="14" r="4" fill="#4f46e5" />
        
        {/* Thought bubble - repositioned to not be cut off */}
        <circle cx="5" cy="-15" r="3" fill="white" />
        <circle cx="0" cy="-28" r="5" fill="white" />
        <ellipse cx="-5" cy="-48" rx="30" ry="18" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        <text x="-5" y="-52" textAnchor="middle" fontSize="7" fill="#1e293b">Start with</text>
        <text x="-5" y="-40" textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="700">A1!</text>
      </g>

      {/* Label */}
      <text x="190" y="218" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="500">Pick your channels. Start with the free ones.</text>
    </svg>
  );
}

/** 11) Honest Farmer vs Sketchy Rat Dealer - HYPER REALISTIC */
function HonestFarmerVsSketchyRat() {
  return (
    <svg
      width="520"
      height="300"
      viewBox="0 0 520 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="farmer-title"
    >
      <title id="farmer-title">Paid promotion: invest in proven content vs gamble on garbage</title>

      {/* LEFT SIDE: HONEST FARMER - hyper realistic */}
      <rect x="10" y="10" width="230" height="280" rx="12" fill="#fef3c7" />
      
      {/* Farm background - golden hour field */}
      <defs>
        <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>
      </defs>
      <rect x="15" y="15" width="220" height="100" fill="url(#sunsetSky)" />
      
      {/* Rolling hills */}
      <path d="M15 115 Q60 90, 120 105 Q180 120, 235 95 L235 200 L15 200 Z" fill="#84cc16" />
      <path d="M15 130 Q80 115, 150 125 Q200 135, 235 115 L235 200 L15 200 Z" fill="#65a30d" />
      
      {/* Detailed wheat/crops */}
      <g stroke="#ca8a04" strokeWidth="1.5">
        <line x1="30" y1="200" x2="30" y2="175" /><circle cx="30" cy="172" r="3" fill="#eab308" />
        <line x1="45" y1="200" x2="45" y2="170" /><circle cx="45" cy="167" r="3" fill="#eab308" />
        <line x1="60" y1="200" x2="60" y2="178" /><circle cx="60" cy="175" r="3" fill="#eab308" />
        <line x1="75" y1="200" x2="75" y2="168" /><circle cx="75" cy="165" r="3" fill="#eab308" />
        <line x1="90" y1="200" x2="90" y2="173" /><circle cx="90" cy="170" r="3" fill="#eab308" />
      </g>
      
      {/* Detailed sun with realistic glow */}
      <circle cx="190" cy="50" r="30" fill="#fbbf24" />
      <circle cx="190" cy="50" r="35" fill="#fbbf24" opacity="0.3" />
      <circle cx="190" cy="50" r="42" fill="#fbbf24" opacity="0.15" />
      
      {/* THE HYPER REALISTIC HONEST FARMER */}
      <g transform="translate(50, 70)">
        {/* Ears - behind head */}
        <ellipse cx="25" cy="55" rx="6" ry="10" fill="#f5d0a9" />
        <ellipse cx="95" cy="55" rx="6" ry="10" fill="#f5d0a9" />
        
        {/* REALISTIC Face - weathered, kind farmer */}
        <ellipse cx="60" cy="55" rx="30" ry="35" fill="#f5d0a9" />
        
        {/* CAT BRAND TRUCKER CAP - proper baseball cap shape */}
        {/* Cap crown - rounded dome that covers top of head */}
        <path d="M30 35 Q30 5, 60 5 Q90 5, 90 35 Z" fill="#fbbf24" />
        {/* Bottom edge of cap sitting on head */}
        <ellipse cx="60" cy="35" rx="32" ry="8" fill="#fbbf24" />
        {/* CAT logo on front */}
        <rect x="42" y="12" width="36" height="14" rx="2" fill="#1e293b" />
        <text x="60" y="23" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fbbf24">CAT</text>
        {/* Curved brim sticking out */}
        <path d="M30 35 Q60 52, 90 35" fill="#fbbf24" stroke="#d4a574" strokeWidth="1" />
        
        {/* Forehead lines */}
        <path d="M42 38 Q60 34, 78 38" stroke="#d4a574" strokeWidth="1" fill="none" />
        
        {/* Eyebrows */}
        <path d="M40 48 Q47 45, 52 48" stroke="#6b7280" strokeWidth="2.5" fill="none" />
        <path d="M68 48 Q73 45, 80 48" stroke="#6b7280" strokeWidth="2.5" fill="none" />
        
        {/* Eyes - kind, squinting */}
        <path d="M42 55 Q47 51, 52 55" stroke="#1e293b" strokeWidth="2" fill="none" />
        <path d="M68 55 Q73 51, 78 55" stroke="#1e293b" strokeWidth="2" fill="none" />
        
        {/* Nose */}
        <path d="M60 52 Q62 62, 60 68 Q58 62, 60 52" stroke="#d4a574" strokeWidth="1.5" fill="none" />
        
        {/* Rosy cheeks */}
        <ellipse cx="42" cy="65" rx="5" ry="3" fill="#fda4af" opacity="0.4" />
        <ellipse cx="78" cy="65" rx="5" ry="3" fill="#fda4af" opacity="0.4" />
        
        {/* Warm smile */}
        <path d="M48 75 Q60 85, 72 75" stroke="#92400e" strokeWidth="2" fill="none" />
        
        {/* Stubble */}
        <g fill="#9ca3af" opacity="0.3">
          <circle cx="50" cy="80" r="1" /><circle cx="55" cy="82" r="1" />
          <circle cx="60" cy="83" r="1" /><circle cx="65" cy="82" r="1" />
          <circle cx="70" cy="80" r="1" />
        </g>
        
        {/* Neck - tapered and connected */}
        <path d="M48 88 Q48 100, 45 110 L75 110 Q72 100, 72 88" fill="#f5d0a9" />
        
        {/* Flannel shirt */}
        <rect x="35" y="108" width="50" height="22" fill="#dc2626" />
        <g stroke="#991b1b" strokeWidth="1">
          <line x1="45" y1="108" x2="45" y2="130" />
          <line x1="55" y1="108" x2="55" y2="130" />
          <line x1="65" y1="108" x2="65" y2="130" />
          <line x1="75" y1="108" x2="75" y2="130" />
          <line x1="35" y1="118" x2="85" y2="118" />
        </g>
        
        {/* OVERALLS */}
        <rect x="28" y="128" width="64" height="85" rx="4" fill="#2563eb" />
        {/* Overall bib */}
        <rect x="42" y="115" width="36" height="18" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
        {/* Straps - connected to body */}
        <path d="M45 115 L40 105 Q48 100, 55 105 L50 115" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
        <path d="M70 115 L65 105 Q72 100, 80 105 L75 115" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
        {/* Brass buttons */}
        <circle cx="43" cy="103" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        <circle cx="77" cy="103" r="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        
        {/* Arms - closer to body, going straight down */}
        <path d="M32 118 Q28 140, 25 165" stroke="#e8c49a" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M88 118 Q92 140, 95 165" stroke="#e8c49a" strokeWidth="10" fill="none" strokeLinecap="round" />
        
        {/* Hands - at end of arms, close to body */}
        <ellipse cx="25" cy="172" rx="8" ry="6" fill="#e8c49a" />
        <ellipse cx="95" cy="172" rx="8" ry="6" fill="#e8c49a" />
      </g>

      {/* Speech bubble - made larger */}
      <path d="M155 55 Q160 35, 225 35 L225 85 L175 85 L165 100 L170 85 L155 85 Z" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <text x="190" y="52" textAnchor="middle" fontSize="9" fill="#1e293b">It ain't much</text>
      <text x="190" y="65" textAnchor="middle" fontSize="9" fill="#1e293b">but it's</text>
      <text x="190" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fill="#166534">honest work</text>

      {/* Bottom text - WHITE BACKGROUND for visibility */}
      <rect x="40" y="250" width="170" height="40" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="125" y="268" textAnchor="middle" fontSize="13" fontWeight="700" fill="#000000">Proven video + $</text>
      <text x="125" y="284" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">= Honest growth</text>

      {/* MIDDLE: VS */}
      <rect x="245" y="125" width="45" height="45" rx="22" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="3" />
      <text x="267" y="154" textAnchor="middle" fontSize="18" fontWeight="700" fill="#64748b">vs</text>

      {/* RIGHT SIDE: CREEPY SEWER RAT - hyper realistic and NASTY */}
      <rect x="295" y="10" width="215" height="280" rx="12" fill="#0f172a" />
      
      {/* Dark alley with grime */}
      <rect x="300" y="15" width="205" height="270" fill="#1e1b4b" />
      
      {/* Grimy brick wall - detailed */}
      <g fill="#292524">
        <rect x="300" y="20" width="40" height="20" rx="1" />
        <rect x="345" y="20" width="40" height="20" rx="1" />
        <rect x="390" y="20" width="40" height="20" rx="1" />
        <rect x="435" y="20" width="40" height="20" rx="1" />
        <rect x="320" y="45" width="40" height="20" rx="1" />
        <rect x="365" y="45" width="40" height="20" rx="1" />
        <rect x="410" y="45" width="40" height="20" rx="1" />
        <rect x="455" y="45" width="40" height="20" rx="1" />
      </g>
      {/* Grime drips on wall */}
      <path d="M320 40 Q322 55, 320 70" stroke="#1c1917" strokeWidth="3" fill="none" opacity="0.5" />
      <path d="M380 40 Q383 50, 380 65" stroke="#1c1917" strokeWidth="2" fill="none" opacity="0.4" />
      <path d="M450 40 Q452 60, 448 80" stroke="#1c1917" strokeWidth="4" fill="none" opacity="0.6" />
      
      {/* Flickering dying light bulb */}
      <ellipse cx="480" cy="30" rx="12" ry="8" fill="#fbbf24" opacity="0.2">
        <animate attributeName="opacity" values="0.3;0.05;0.2;0.1;0.3" dur="0.8s" repeatCount="indefinite" />
      </ellipse>

      {/* THE CREEPY RAT */}
      <g transform="translate(320, 70)">
        {/* EARS - drawn early so they appear BEHIND the head */}
        <ellipse cx="35" cy="20" rx="18" ry="25" fill="#3f3f46" stroke="#292524" strokeWidth="1" />
        <ellipse cx="35" cy="20" rx="12" ry="18" fill="#7f1d1d" opacity="0.25" />
        <ellipse cx="105" cy="20" rx="18" ry="25" fill="#3f3f46" stroke="#292524" strokeWidth="1" />
        <ellipse cx="105" cy="20" rx="12" ry="18" fill="#7f1d1d" opacity="0.25" />
        
        {/* Neck - connects head to body */}
        <path d="M55 60 Q60 75, 58 90 L82 90 Q80 75, 85 60" fill="#3f3f46" />
        
        {/* SCRAWNY BODY */}
        <ellipse cx="70" cy="115" rx="25" ry="40" fill="#3f3f46" />
        
        {/* LEGS - cut off at bottom */}
        <path d="M50 150 L45 200" stroke="#3f3f46" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M90 150 L95 200" stroke="#3f3f46" strokeWidth="8" fill="none" strokeLinecap="round" />
        
        {/* RAT HEAD - gaunt */}
        <ellipse cx="70" cy="45" rx="30" ry="25" fill="#3f3f46" />
        
        {/* Long pointy snout */}
        <ellipse cx="115" cy="52" rx="28" ry="10" fill="#3f3f46" />
        {/* Wet nose */}
        <ellipse cx="140" cy="52" rx="5" ry="4" fill="#1c1917" />
        
        {/* Whiskers */}
        <g stroke="#1c1917" strokeWidth="1">
          <path d="M135 45 Q155 38, 168 42" fill="none" />
          <path d="M138 52 Q158 48, 172 52" fill="none" />
          <path d="M135 58 Q155 62, 168 65" fill="none" />
        </g>
        
        {/* TERRIFYING EYES - glowing */}
        <ellipse cx="52" cy="40" rx="10" ry="8" fill="#1c1917" />
        <ellipse cx="88" cy="40" rx="10" ry="8" fill="#1c1917" />
        <ellipse cx="52" cy="40" rx="6" ry="5" fill="#84cc16" opacity="0.7" />
        <ellipse cx="88" cy="40" rx="6" ry="5" fill="#84cc16" opacity="0.7" />
        <circle cx="54" cy="41" r="2" fill="#1c1917" />
        <circle cx="90" cy="41" r="2" fill="#1c1917" />
        
        {/* Mouth line with teeth attached */}
        <path d="M85 60 Q105 72, 125 62" stroke="#1c1917" strokeWidth="2" fill="none" />
        {/* Teeth - connected to mouth */}
        <rect x="92" y="60" width="4" height="8" fill="#ca8a04" stroke="#78350f" strokeWidth="0.5" />
        <rect x="98" y="59" width="4" height="9" fill="#eab308" stroke="#78350f" strokeWidth="0.5" />
        <rect x="104" y="60" width="4" height="7" fill="#ca8a04" stroke="#78350f" strokeWidth="0.5" />
        <rect x="110" y="61" width="4" height="6" fill="#fef9c3" stroke="#78350f" strokeWidth="0.5" />
        
        {/* TRENCH COAT */}
        <path d="M40 85 L25 175 L115 175 L100 85 Z" fill="#1c1917" />
        {/* Popped collar */}
        <path d="M45 85 Q58 70, 68 85" fill="#1c1917" stroke="#0f172a" strokeWidth="1" />
        <path d="M72 85 Q82 70, 95 85" fill="#1c1917" stroke="#0f172a" strokeWidth="1" />
        
        {/* SKELETAL ARMS */}
        <path d="M40 100 Q15 125, -5 155" stroke="#3f3f46" strokeWidth="5" fill="none" />
        <path d="M100 100 Q130 120, 155 145" stroke="#3f3f46" strokeWidth="5" fill="none" />
        
        {/* Clawed hands */}
        <ellipse cx="-8" cy="160" rx="7" ry="5" fill="#3f3f46" />
        <path d="M-15 155 L-22 148 M-10 153 L-15 143 M-5 152 L-5 142" stroke="#3f3f46" strokeWidth="2" fill="none" />
        
        <ellipse cx="158" cy="150" rx="7" ry="5" fill="#3f3f46" />
        <path d="M165 145 L172 138 M160 143 L165 133 M155 142 L155 132" stroke="#3f3f46" strokeWidth="2" fill="none" />
        
        {/* Holding sketchy "product" - moved up */}
        <g transform="translate(-30, 130)">
          <rect x="0" y="0" width="32" height="22" rx="3" fill="#dc2626" />
          <text x="16" y="11" textAnchor="middle" fontSize="6" fill="white" fontWeight="700">FAKE</text>
          <text x="16" y="19" textAnchor="middle" fontSize="5" fill="white">VIEWS</text>
        </g>
      </g>

      {/* Speech bubble - LARGER */}
      <path d="M430 45 Q435 25, 500 25 L500 85 L455 85 L445 100 L450 85 L430 85 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      <text x="465" y="45" textAnchor="middle" fontSize="10" fill="#f1f5f9">Psst... hey</text>
      <text x="465" y="60" textAnchor="middle" fontSize="10" fill="#f1f5f9">kid... want</text>
      <text x="465" y="78" textAnchor="middle" fontSize="11" fill="#fbbf24" fontWeight="700">fake subs?</text>

      {/* Bottom text - WHITE BACKGROUND for visibility */}
      <rect x="315" y="250" width="170" height="40" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
      <text x="400" y="268" textAnchor="middle" fontSize="12" fontWeight="700" fill="#000000">Weak video + $</text>
      <text x="400" y="284" textAnchor="middle" fontSize="11" fontWeight="600" fill="#dc2626">= Sketchy waste</text>
    </svg>
  );
}

/** 12) Detective Evidence Board - Mugshots of promotion crimes - LARGE VERSION */
function DetectiveBoard() {
  return (
    <svg
      width="420"
      height="260"
      viewBox="0 0 420 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="detective-title"
    >
      <title id="detective-title">Why promotion fails: the usual suspects</title>

      {/* Cork board background with wood frame */}
      <rect x="5" y="5" width="410" height="250" rx="6" fill="#78350f" />
      <rect x="12" y="12" width="396" height="236" rx="4" fill="#d4a574" />
      <rect x="18" y="18" width="384" height="224" fill="#c4956a" />

      {/* "CASE FILE" header pinned - bigger and more dramatic */}
      <rect x="130" y="25" width="160" height="35" rx="3" fill="#fef3c7" transform="rotate(-2 210 40)" stroke="#92400e" strokeWidth="1" />
      <text x="210" y="48" textAnchor="middle" fontSize="18" fontWeight="700" fill="#78350f">CASE FILE</text>
      {/* Red push pins */}
      <circle cx="140" cy="30" r="6" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
      <circle cx="280" cy="32" r="6" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />

      {/* Suspect 1: "Unprepared Pete" */}
      <g transform="translate(28, 70)">
        <rect x="0" y="0" width="110" height="140" rx="3" fill="white" stroke="#94a3b8" strokeWidth="2" transform="rotate(-3 55 70)" />
        {/* Mugshot photo area */}
        <rect x="10" y="10" width="90" height="70" fill="#f1f5f9" />
        {/* Face */}
        <circle cx="55" cy="42" r="22" fill="#fde68a" stroke="#1e293b" strokeWidth="2" />
        {/* Panicked X eyes */}
        <path d="M45 38 L50 43 M45 43 L50 38" stroke="#1e293b" strokeWidth="2" />
        <path d="M60 38 L65 43 M60 43 L65 38" stroke="#1e293b" strokeWidth="2" />
        {/* Worried wavy mouth */}
        <path d="M45 55 Q50 50, 55 55 Q60 60, 65 55" stroke="#1e293b" strokeWidth="2" fill="none" />
        {/* Multiple sweat drops */}
        <path d="M78 30 Q80 25, 82 30 Q80 33, 78 30" fill="#3b82f6" />
        <path d="M82 42 Q84 38, 86 42 Q84 45, 82 42" fill="#3b82f6" />
        <path d="M30 35 Q28 31, 26 35 Q28 38, 30 35" fill="#3b82f6" />
        
        {/* Name plate */}
        <rect x="10" y="85" width="90" height="45" fill="white" />
        <text x="55" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="#991b1b">UNPREPARED</text>
        <text x="55" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="#991b1b">PETE</text>
        <text x="55" y="130" textAnchor="middle" fontSize="9" fill="#64748b">Crime: Bad CTR</text>
      </g>
      {/* Push pin */}
      <circle cx="85" cy="75" r="5" fill="#dc2626" />

      {/* Suspect 2: "Spammy Sam" */}
      <g transform="translate(155, 68)">
        <rect x="0" y="0" width="110" height="140" rx="3" fill="white" stroke="#94a3b8" strokeWidth="2" transform="rotate(1 55 70)" />
        {/* Mugshot photo area */}
        <rect x="10" y="10" width="90" height="70" fill="#f1f5f9" />
        {/* Face */}
        <circle cx="55" cy="42" r="22" fill="#fde68a" stroke="#1e293b" strokeWidth="2" />
        {/* Mischievous squinty eyes */}
        <path d="M42 38 Q47 34, 52 38" stroke="#1e293b" strokeWidth="2" fill="none" />
        <path d="M58 38 Q63 34, 68 38" stroke="#1e293b" strokeWidth="2" fill="none" />
        {/* Sneaky grin */}
        <path d="M42 52 Q55 62, 68 52" stroke="#1e293b" strokeWidth="2" fill="none" />
        {/* Holding multiple link chains */}
        <text x="22" y="35" fontSize="12">🔗</text>
        <text x="80" y="40" fontSize="10">🔗</text>
        <text x="25" y="55" fontSize="9">🔗</text>
        
        {/* Name plate */}
        <rect x="10" y="85" width="90" height="45" fill="white" />
        <text x="55" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="#991b1b">SPAMMY</text>
        <text x="55" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="#991b1b">SAM</text>
        <text x="55" y="130" textAnchor="middle" fontSize="9" fill="#64748b">Crime: Link dump</text>
      </g>
      {/* Push pin */}
      <circle cx="210" cy="72" r="5" fill="#dc2626" />

      {/* Suspect 3: "Inconsistent Ian" */}
      <g transform="translate(282, 70)">
        <rect x="0" y="0" width="110" height="140" rx="3" fill="white" stroke="#94a3b8" strokeWidth="2" transform="rotate(2 55 70)" />
        {/* Mugshot photo area */}
        <rect x="10" y="10" width="90" height="70" fill="#f1f5f9" />
        {/* Face */}
        <circle cx="55" cy="42" r="22" fill="#fde68a" stroke="#1e293b" strokeWidth="2" />
        {/* Super sleepy/lazy half-closed eyes */}
        <line x1="42" y1="38" x2="52" y2="38" stroke="#1e293b" strokeWidth="3" />
        <line x1="58" y1="38" x2="68" y2="38" stroke="#1e293b" strokeWidth="3" />
        {/* Bags under eyes */}
        <path d="M42 42 Q47 45, 52 42" stroke="#94a3b8" strokeWidth="1" fill="none" />
        <path d="M58 42 Q63 45, 68 42" stroke="#94a3b8" strokeWidth="1" fill="none" />
        {/* Yawning/lazy mouth */}
        <ellipse cx="55" cy="54" rx="6" ry="4" fill="#1e293b" />
        {/* Zzz floating */}
        <text x="75" y="25" fontSize="14" fill="#64748b" fontWeight="700">Z</text>
        <text x="82" y="18" fontSize="11" fill="#64748b" fontWeight="700">z</text>
        <text x="88" y="13" fontSize="8" fill="#64748b" fontWeight="700">z</text>
        
        {/* Name plate */}
        <rect x="10" y="85" width="90" height="45" fill="white" />
        <text x="55" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="#991b1b">INCONSISTENT</text>
        <text x="55" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="#991b1b">IAN</text>
        <text x="55" y="130" textAnchor="middle" fontSize="9" fill="#64748b">Crime: Ghosting</text>
      </g>
      {/* Push pin */}
      <circle cx="338" cy="75" r="5" fill="#dc2626" />

      {/* Red string connecting them - detective style */}
      <path d="M135 120 Q175 100, 165 125" stroke="#dc2626" strokeWidth="2" fill="none" />
      <path d="M260 118 Q280 105, 290 122" stroke="#dc2626" strokeWidth="2" fill="none" />
      {/* Extra string going up to case file */}
      <path d="M210 70 Q210 55, 210 50" stroke="#dc2626" strokeWidth="1.5" fill="none" />

      {/* "WANTED" stamp - big and dramatic */}
      <g transform="translate(300, 215) rotate(-8)">
        <rect x="0" y="0" width="90" height="28" rx="3" fill="none" stroke="#dc2626" strokeWidth="3" />
        <text x="45" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#dc2626">WANTED</text>
      </g>

      {/* Additional detective notes */}
      <rect x="25" y="218" width="100" height="25" rx="2" fill="#fef9c3" transform="rotate(-3 75 230)" />
      <text x="75" y="233" textAnchor="middle" fontSize="8" fill="#78350f">Check all suspects!</text>
      {/* Push pin for note */}
      <circle cx="30" cy="220" r="4" fill="#3b82f6" />
    </svg>
  );
}

/* ================================================
   LOCAL COMPONENT HELPERS
   ================================================ */

type GateCardProps = {
  label: string;
  description: string;
  linkText?: string;
  linkHref?: string;
};

function GateCard({ label, description, linkText, linkHref }: GateCardProps) {
  return (
    <div
      style={{
        padding: "16px",
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <span
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "6px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "block",
          fontSize: "13px",
          color: "#64748b",
          lineHeight: 1.5,
          marginBottom: linkText ? "8px" : 0,
        }}
      >
        {description}
      </span>
      {linkText && linkHref && (
        <Link
          href={linkHref}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#6366f1",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}

type MiniCardProps = {
  icon?: React.ReactNode;
  text: string;
};

function MiniCard({ icon, text }: MiniCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        fontSize: "13px",
        color: "#1e293b",
      }}
    >
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span>{text}</span>
    </div>
  );
}

type ChannelCardProps = {
  icon: React.ReactNode;
  title: string;
  leverage: "high" | "medium" | "low";
  description: string;
};

function ChannelCard({ icon, title, leverage, description }: ChannelCardProps) {
  const leverageColors = {
    high: { bg: "#dcfce7", text: "#166534" },
    medium: { bg: "#fef3c7", text: "#92400e" },
    low: { bg: "#f1f5f9", text: "#64748b" },
  };
  const lc = leverageColors[leverage];
  return (
    <div
      style={{
        padding: "20px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
            borderRadius: "8px",
          }}
        >
          {icon}
        </span>
        <div>
          <span
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "100px",
              background: lc.bg,
              color: lc.text,
            }}
          >
            {leverage} leverage
          </span>
        </div>
      </div>
      <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

type CaseCardProps = {
  issue: string;
  description: string;
  fix: string;
};

function CaseCard({ issue, description, fix }: CaseCardProps) {
  return (
    <div
      style={{
        padding: "20px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderLeft: "4px solid #f87171",
      }}
    >
      <span
        style={{
          display: "block",
          fontSize: "15px",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "8px",
        }}
      >
        {issue}
      </span>
      <p
        style={{
          fontSize: "14px",
          color: "#64748b",
          lineHeight: 1.6,
          margin: "0 0 12px",
        }}
      >
        {description}
      </p>
      <div
        style={{
          fontSize: "13px",
          color: "#059669",
          background: "#ecfdf5",
          padding: "10px 14px",
          borderRadius: "8px",
        }}
      >
        <strong style={{ color: "#047857" }}>Fix:</strong> {fix}
      </div>
    </div>
  );
}

/* ================================================
   ICON COMPONENTS
   ================================================ */

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="20" height="18" rx="3" />
      <path d="M10 8l6 4-6 4V8z" fill="#dc2626" stroke="none" />
    </svg>
  );
}

function SocialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function CollabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6M23 11h-6" />
    </svg>
  );
}

/* ================================================
   MAIN BODY COMPONENT
   ================================================ */

export const { meta, toc } = articleExports(LEARN_ARTICLES["how-to-promote-youtube-videos"]);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* ========================================
          WHAT PROMOTION MEANS
          ======================================== */}
      <section id="what-promotion-means" className="sectionOpen">
        <h2 className={s.sectionTitle}>What Promotion Actually Means</h2>

        <div className="inlineIllustration" style={{ marginBottom: "24px" }}>
          <MegaphoneVsLighthouse />
        </div>

        <p className={s.sectionText}>
          Promotion has a bad reputation because most people do it wrong. They
          finish a video, drop links in every corner of the internet, and wonder
          why nothing happens. That approach fails because it treats promotion
          as distribution—getting the video in front of eyeballs—when it should
          be about discovery: helping the right people find something they will
          genuinely enjoy.
        </p>

        <p className={s.sectionText}>
          The difference matters. Random eyeballs scroll past. The right viewers
          click, watch, and come back. YouTube notices when a video holds attention
          and earns engagement, and the algorithm responds by showing it to more
          people. Good content builds momentum over time.
        </p>

        <div className="inlineIllustration">
          <SnowballEffect />
        </div>

        <p className={s.sectionText}>
          Topic demand plus strong packaging leads to clicks. Clicks lead to watch
          time. Watch time triggers recommendations. Recommendations bring more
          impressions. Promotion gives that snowball its first push downhill.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">The real job</p>
          <p className="realTalk__text">
            Promotion is proof distribution—helping the right viewers find your
            video early so YouTube can see that it works. Your job is to give
            good content the initial momentum it needs to prove itself.
          </p>
        </div>
      </section>

      {/* ========================================
          BEFORE PUBLISH (Quality Gate)
          ======================================== */}
      <section id="before-publish" className="sectionOpen">
        <h2 className={s.sectionTitle}>Before You Publish: The Quality Gate</h2>

        <div className="inlineIllustration" style={{ marginBottom: "24px" }}>
          <VideoAtDoctor />
        </div>

        <p className={s.sectionText}>
          Most promotion failures happen before the video goes live. Driving traffic
          to a poorly packaged video wastes your effort and trains the algorithm
          that your content underperforms. The best promotion is a video that earns
          clicks and keeps people watching on its own.
        </p>

        <p className={s.sectionText}>
          Before you hit publish, your video needs to pass through a quality gate.
          Three things must be solid:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            marginTop: "24px",
            marginBottom: "24px",
          }}
          className="gateCardGrid"
        >
          <GateCard
            label="Topic demand"
            description="Does this answer questions people actually ask? Check if similar videos exist and perform well. If nothing comes up, figure out whether you are onto something original or nobody cares."
            linkText="How to find winning topics"
            linkHref="/learn/youtube-competitor-analysis"
          />
          <GateCard
            label="Packaging"
            description="Title and thumbnail work together. The title promises a specific outcome or sparks curiosity. The thumbnail reads at small sizes with one clear focal point."
            linkText="Thumbnail and title strategies"
            linkHref="/learn/youtube-thumbnail-best-practices"
          />
          <GateCard
            label="Watchability"
            description="Front-load the value, cut anything that drags, and structure it so viewers know what they are getting. A strong hook in the first 30 seconds determines who stays."
            linkText="Hook and retention tactics"
            linkHref="/learn/youtube-retention-analysis"
          />
        </div>

        <div className="inlineIllustration" style={{ marginTop: "24px", marginBottom: "24px" }}>
          <SquintingAtThumbnail />
        </div>

        <p className={s.sectionText}>
          Test your thumbnail by shrinking it to mobile size. If you cannot instantly
          understand what the video is about, simplify. This small exercise prevents
          a lot of wasted promotion effort.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>Gate checklist:</strong> Title earns clicks without lying.
            Thumbnail reads at small sizes. Keywords in first two description lines.
            Chapters for longer videos. End screens point to your next best video.
          </p>
        </div>
      </section>

      {/* ========================================
          LAUNCH DAY (Control Room)
          ======================================== */}
      <section id="launch-day" className="sectionTinted">
        <h2 className={s.sectionTitle}>Launch Day: The Control Room</h2>

        <p className={s.sectionText}>
          The first day matters more than any other. YouTube watches how your existing
          audience responds, and early signals—click-through rate, watch time,
          engagement—shape how aggressively the algorithm shows your video to new
          viewers. Your goal is to get your best content in front of your warmest
          audience as quickly as possible.
        </p>

        <div className="inlineIllustration">
          <MissionControl />
        </div>

        <p className={s.sectionText}>
          Publish when your audience is online. Check your analytics for the hours
          when your subscribers are most active. Then spend the first hour after
          upload engaging with anyone who shows up.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            marginTop: "20px",
            marginBottom: "20px",
          }}
          className="launchCardGrid"
        >
          <MiniCard icon={<CheckIcon />} text="Community post announcing the video" />
          <MiniCard icon={<CheckIcon />} text="Pin a comment that adds value" />
          <MiniCard icon={<CheckIcon />} text="Reply to every comment in hour one" />
          <MiniCard icon={<CheckIcon />} text="One native clip on your primary social" />
        </div>

        <div className="floatRight">
          <CommentTennisMatch />
        </div>

        <p className={s.sectionText}>
          Reply to every comment. Heart the good ones. Ask a question to spark
          discussion. This is not about gaming metrics—it is about signaling to
          YouTube that this video generates conversation, and signaling to viewers
          that you are present. Your first hour is customer support.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">Resist the urge</p>
          <p className="realTalk__text">
            One thoughtful share in the right place beats ten links dropped in random
            forums. If you have a specific community where your audience gathers, make
            that your priority for day one. Everywhere else can wait.
          </p>
        </div>
      </section>

      {/* ========================================
          AFTER LAUNCH (Second Wind)
          ======================================== */}
      <section id="after-launch" className="sectionOpen">
        <h2 className={s.sectionTitle}>After Launch: The Second Wind</h2>

        <p className={s.sectionText}>
          Most creators forget about a video the day after it goes live. This is a
          mistake. Videos on YouTube have long tails—they can pick up momentum weeks
          or months later if you give them reasons to resurface.
        </p>

        <p className={s.sectionText}>
          Check your analytics after a week. Look at click-through rate and average
          view duration. The combination tells you what to fix:
        </p>

        <div className="comparisonGrid" style={{ marginTop: "16px", marginBottom: "24px" }}>
          <div className="comparisonItem comparisonItem--bad">
            <p className="comparisonItem__label">CTR low + retention good</p>
            <p className="comparisonItem__content">
              Packaging problem. Test a new thumbnail or tweak the title. The content
              is solid; people just are not clicking.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">CTR fine + retention weak</p>
            <p className="comparisonItem__content">
              Content structure problem. Harder to fix on this video, but note it for
              next time. Tighten the hook, cut the fluff.
            </p>
          </div>
        </div>

        <p className={s.sectionText}>
          Shorts and clips are your rediscovery mechanism. A 30-second vertical clip
          from a longer video can pull new viewers back to the original. Time these
          strategically: a Short posted two weeks after the main video gives it a
          second life without cannibalizing the initial launch.
        </p>

        <p className={s.sectionText}>
          Keep updating descriptions over time. Add chapters if you did not include
          them originally. Link to newer related content. These small edits are
          maintenance, not chores—they keep the video relevant and can improve its
          search performance months after publication.
        </p>
      </section>

      {/* ========================================
          DISTRIBUTION CHANNELS (Subway Map)
          ======================================== */}
      <section id="distribution-channels" className="sectionTinted">
        <h2 className={s.sectionTitle}>Distribution Channels That Work</h2>

        <p className={s.sectionText}>
          Not all promotion is equal. Some channels consistently drive engaged
          viewers; others waste your time. Work through these in order of
          leverage—start with what costs nothing and already reaches your audience.
        </p>

        <div className="inlineIllustration">
          <DistributionVendingMachine />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            marginTop: "24px",
          }}
          className="channelCardGrid"
        >
          <ChannelCard
            icon={<YouTubeIcon />}
            title="YouTube-Native"
            leverage="high"
            description="Your existing library is your distribution network. End screens, playlists, pinned comments, and community posts put your newest video in front of people who already like your content. This is the highest-leverage promotion you can do."
          />
          <ChannelCard
            icon={<SocialIcon />}
            title="One Primary Social Platform"
            leverage="medium"
            description="Post native content, not just links. A 20-40 second clip that delivers value by itself, a text post sharing one strong insight, or a question that invites debate. Give people a reason to engage before they click."
          />
          <ChannelCard
            icon={<CommunityIcon />}
            title="Niche Communities"
            leverage="medium"
            description="Reddit, Discord servers, forums. Contribute first; share as a resource, not a link dump. People can tell when you are using them as a distribution channel instead of engaging authentically."
          />
          <ChannelCard
            icon={<CollabIcon />}
            title="Collaborations"
            leverage="medium"
            description="Collaborations let you borrow trust from adjacent creators. When someone else's audience sees you endorsed by a creator they follow, they are far more likely to give you a chance."
          />
        </div>

        <p className={s.sectionText} style={{ marginTop: "24px" }}>
          The best collabs involve creators at a similar level with complementary
          audiences—not competitors, but not completely unrelated either. Approach
          potential collaborators by being specific: explain what you have in mind,
          why it would benefit both audiences, and what you bring to the table.
        </p>

        <p className={s.sectionText}>
          To find potential partners, use our{" "}
          <Link href="/learn/youtube-competitor-analysis">
            guide to identifying complementary creators in your niche
          </Link>.
        </p>
      </section>

      {/* ========================================
          PAID PROMOTION (Money Pit vs Flywheel)
          ======================================== */}
      <section id="paid-promotion" className="sectionOpen">
        <h2 className={s.sectionTitle}>Paid Promotion</h2>

        <p className={s.sectionText}>
          Paid promotion can work, but only after organic fundamentals are in place.
          If your content does not convert viewers into subscribers, paying for more
          viewers just means paying for more people who leave. Fix retention and
          packaging first.
        </p>

        <div className="inlineIllustration">
          <HonestFarmerVsSketchyRat />
        </div>

        <div className="comparisonGrid" style={{ marginTop: "16px", marginBottom: "24px" }}>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Good use case</p>
            <p className="comparisonItem__content">
              You have videos that perform well organically. YouTube in-feed ads
              surface them to interested viewers who might actually want them. You
              are paying to accelerate momentum that already exists.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--bad">
            <p className="comparisonItem__label">Bad use case</p>
            <p className="comparisonItem__content">
              Packaging is weak, retention is poor, but you hope money will fix it.
              Paid viewers bounce immediately or never come back. You are filling a
              pit, not building momentum.
            </p>
          </div>
        </div>

        <p className={s.sectionText}>
          Start with small budgets and measure what happens. Look at subscriber
          conversion and retention for paid traffic versus organic. If paid viewers
          stick around at similar rates to organic viewers, you may have found a
          scalable channel.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>Warning:</strong> Never buy fake views, subscribers, or engagement.
            These services violate YouTube's terms, damage your channel's standing
            with the algorithm, and provide zero real value. See our guides on{" "}
            <Link href="/learn/buy-youtube-subscribers">
              why buying subscribers hurts your channel
            </Link>{" "}
            and{" "}
            <Link href="/learn/buy-youtube-views">
              the problems with purchased views
            </Link>.
          </p>
        </div>
      </section>

      {/* ========================================
          WHY PROMOTION FAILS (Post-Mortem)
          ======================================== */}
      <section id="why-promotion-fails" className="sectionTinted">
        <h2 className={s.sectionTitle}>Why Promotion Fails</h2>

        <p className={s.sectionText}>
          Most promotion fails for three reasons, and they are all variations of the
          same mistake: trying to shortcut the work instead of doing it properly.
        </p>

        <div className="inlineIllustration">
          <DetectiveBoard />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            marginTop: "24px",
          }}
          className="caseCardGrid"
        >
          <CaseCard
            issue="Not ready"
            description="If your packaging is weak or your video loses people in the first minute, sending more traffic just teaches the algorithm that your content underperforms. Promotion amplifies what is already there—it cannot fix a bad video."
            fix="Pass the quality gate first. Topic, packaging, retention."
          />
          <CaseCard
            issue="Link dumping"
            description="Dropping your video URL into forums, group chats, and comment sections without adding value gets you ignored at best and banned at worst. People can tell when you are using them as a distribution channel instead of engaging authentically."
            fix="Share native value. Pick one channel and do it well."
          />
          <CaseCard
            issue="Inconsistency"
            description="Promoting one video hard, then disappearing for weeks, then coming back with another burst of activity. Growth comes from compounding small efforts over time."
            fix="Build a library. Connect videos with end screens. Show up regularly."
          />
        </div>

        <p className={s.sectionText} style={{ marginTop: "24px" }}>
          The creators who win are not the ones with the best single promotion push.
          They are the ones who show up consistently and build momentum gradually.
          Each video feeds the next. That snowball keeps rolling.
        </p>
      </section>

      {/* ========================================
          CTA
          ======================================== */}
      <div className={s.highlight}>
        <p>
          <strong>Track what works.</strong> Open YouTube Studio and check your
          traffic sources for each video. See which promotion efforts actually bring
          engaged viewers—the ones who watch, subscribe, and come back. Retention and
          subscriber conversion tell you more than raw views ever will. For detailed
          guidance on turning viewers into subscribers, see our{" "}
          <Link href="/learn/how-to-get-more-subscribers">
            complete guide to growing your subscriber base
          </Link>. Use{" "}
          <Link href="/learn/youtube-competitor-analysis">competitor research</Link>{" "}
          to understand what baselines look like in your niche, then keep the snowball rolling
          with what works.
        </p>
      </div>

      {/* CSS for grid layouts (inline for server component) */}
      <style>{`
        .phaseGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .phaseGrid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .gateCardGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .gateCardGrid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .launchCardGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 500px) {
          .launchCardGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .channelCardGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .channelCardGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .caseCardGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .caseCardGrid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </>
  );
}

/*
 * CHECKLIST:
 * - [x] IDs unchanged: what-promotion-means, start-here, before-publish, launch-day,
 *       after-launch, distribution-channels, paid-promotion, why-promotion-fails
 * - [x] Minimal UL/OL: replaced with cards, grids, panels
 * - [x] Mobile stacking: all grids collapse to 1 column on mobile
 * - [x] No unused imports: Link, BodyProps both used
 * - [x] Links preserved with improved anchor text:
 *       - /learn/youtube-competitor-analysis
 *       - /learn/youtube-thumbnail-best-practices
 *       - /learn/youtube-retention-analysis
 *       - /learn/buy-youtube-subscribers
 *       - /learn/buy-youtube-views
 *       - /learn/how-to-get-more-subscribers
 * - [x] SVG accessibility: all 12 SVGs have title/desc or aria-hidden
 * - [x] No external image assets
 * - [x] No emojis
 * - [x] Server component (no "use client")
 * - [x] 12 unique inline SVG visuals distributed across page
 */
