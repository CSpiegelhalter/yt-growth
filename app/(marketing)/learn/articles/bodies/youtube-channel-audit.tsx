/**
 * Body content for YouTube Channel Audit article.
 * Server component - no "use client" directive.
 * 
 * Magazine-style layout with visual variety and proper spacing.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";
import { MetricCardGrid, AUDIT_METRICS, DiagnosisFlow, DIAGNOSIS_BRANCHES } from "../../_components";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* INTRO */}
      <section id="what-is-audit" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: '1.125rem' }}>
          You&apos;re posting consistently, your content is good, but your views are flat and subscribers aren&apos;t growing.
        </p>
        
        <p className="standaloneLine">Sound familiar?</p>
        
        <p className={s.sectionText}>
          A channel audit is how you figure out what you can improve in order to get more viewers on YouTube.
        </p>
        
        <div className="funCallout">
          <p className="funCallout__text">
            Think of an audit like being a detective for your own channel. The clues are in your analytics. This guide shows you where to look.
          </p>
        </div>
        
        <p className={s.sectionText}>
          An audit is a systematic review of your YouTube analytics to find the specific bottleneck holding you back. Maybe your thumbnails aren&apos;t getting clicks. Maybe viewers are leaving in the first 30 seconds. Maybe YouTube isn&apos;t showing your videos to anyone.
        </p>
        
        <p className={s.sectionText}>
          Each problem has a different fix, and the only way to know which one applies to you is to look at the data.
        </p>
      </section>

      {/* Visual: The YouTube Funnel */}
      <div className="inlineIllustration">
        <svg width="320" height="200" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="YouTube growth funnel showing impressions, clicks, watch time, and subscribers">
          <path d="M40 20 L280 20 L220 180 L100 180 Z" fill="url(#funnelGradient)" opacity="0.1"/>
          <path d="M40 20 L280 20 L220 180 L100 180 Z" stroke="url(#funnelGradient)" strokeWidth="2" fill="none"/>
          <line x1="60" y1="60" x2="260" y2="60" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4"/>
          <line x1="80" y1="100" x2="240" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4"/>
          <line x1="95" y1="140" x2="225" y2="140" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4"/>
          <text x="160" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#6366f1">Impressions</text>
          <text x="160" y="82" textAnchor="middle" fontSize="12" fontWeight="600" fill="#8b5cf6">Clicks (CTR)</text>
          <text x="160" y="122" textAnchor="middle" fontSize="12" fontWeight="600" fill="#a855f7">Watch Time</text>
          <text x="160" y="165" textAnchor="middle" fontSize="12" fontWeight="600" fill="#c026d3">Subscribers</text>
          <defs>
            <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#c026d3"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="pullQuote">
        By the end of this guide, you&apos;ll know exactly what&apos;s broken and what to fix first.
      </div>

      {/* THE 6 METRICS */}
      <section id="key-metrics" className="sectionTinted">
        <h2 className={s.sectionTitle}>The 6 Metrics That Actually Matter</h2>
        <p className={s.sectionText}>
          YouTube tracks dozens of numbers, but only these six tell you what&apos;s actually happening. Each card shows what to look for and what to do if it&apos;s not working.
        </p>
        <MetricCardGrid metrics={AUDIT_METRICS} />
      </section>

      {/* WHERE TO FIND */}
      <section id="youtube-studio-guide" className="sectionOpen">
        <h2 className={s.sectionTitle}>Where to Find Each Metric</h2>
        <p className={s.sectionText}>
          Here&apos;s your quick reference map. All paths start at <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>studio.youtube.com</a>
        </p>
        
        <div className="metricRow">
          <h4 className="metricRow__name">Impressions and CTR</h4>
          <div className="metricRow__path">
            <span className="studioPath">
              <span className="studioPath__chip">Analytics</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Reach</span>
            </span>
          </div>
          <p className="metricRow__why">See how often YouTube shows your thumbnails and what percentage click.</p>
        </div>
        
        <div className="metricRow">
          <h4 className="metricRow__name">Average View Duration</h4>
          <div className="metricRow__path">
            <span className="studioPath">
              <span className="studioPath__chip">Analytics</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Engagement</span>
            </span>
          </div>
          <p className="metricRow__why">Check how long people watch. Aim for 40% or more of video length.</p>
        </div>
        
        <div className="metricRow">
          <h4 className="metricRow__name">Retention Curves</h4>
          <div className="metricRow__path">
            <span className="studioPath">
              <span className="studioPath__chip">Content</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Video</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Analytics</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Engagement</span>
            </span>
          </div>
          <p className="metricRow__why">Find exact moments viewers leave. Cliffs indicate weak hooks.</p>
          <span className="metricRow__tip">Focus on the first 30 seconds. A steep drop there means your hook isn&apos;t working.</span>
        </div>
        
        <div className="metricRow">
          <h4 className="metricRow__name">Traffic Sources</h4>
          <div className="metricRow__path">
            <span className="studioPath">
              <span className="studioPath__chip">Analytics</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Reach</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Traffic source types</span>
            </span>
          </div>
          <p className="metricRow__why">Browse means recommendations. Search means you rank for keywords.</p>
        </div>
        
        <div className="metricRow">
          <h4 className="metricRow__name">Returning Viewers</h4>
          <div className="metricRow__path">
            <span className="studioPath">
              <span className="studioPath__chip">Analytics</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Audience</span>
            </span>
          </div>
          <p className="metricRow__why">Growing returning viewers means you&apos;re building loyalty.</p>
        </div>
      </section>

      {/* BENCHMARKS */}
      <section id="what-good-looks-like" className="sectionOpen">
        <h2 className={s.sectionTitle}>What Good Looks Like</h2>
        
        <div className="realTalk">
          <p className="realTalk__label">Keep in mind</p>
          <p className="realTalk__text">
            These aren&apos;t magic numbers. What matters more is your trend over time. Are these improving month over month?
          </p>
        </div>
        
        <div className="statRow">
          <div className="statRow__item">
            <div className="statRow__value">4 to 10%</div>
            <div className="statRow__label">Click Through Rate</div>
          </div>
          <div className="statRow__item">
            <div className="statRow__value">40 to 60%</div>
            <div className="statRow__label">Avg View Duration</div>
          </div>
          <div className="statRow__item">
            <div className="statRow__value">10 to 30</div>
            <div className="statRow__label">Subs per 1K Views</div>
          </div>
        </div>
      </section>

      {/* Retention curve illustration */}
      <div className="inlineIllustration">
        <svg width="340" height="180" viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Example retention curve showing viewer drop-off">
          <rect x="40" y="20" width="280" height="120" fill="#f8fafc" rx="4"/>
          <line x1="40" y1="50" x2="320" y2="50" stroke="#e2e8f0" strokeWidth="1"/>
          <line x1="40" y1="80" x2="320" y2="80" stroke="#e2e8f0" strokeWidth="1"/>
          <line x1="40" y1="110" x2="320" y2="110" stroke="#e2e8f0" strokeWidth="1"/>
          <path d="M40 30 Q100 35, 160 50 Q220 65, 280 80 Q300 88, 320 95" stroke="#10b981" strokeWidth="3" fill="none"/>
          <path d="M40 30 Q60 80, 80 110 Q120 125, 200 130 Q280 132, 320 135" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="6"/>
          <text x="40" y="160" fontSize="10" fill="#64748b">0:00</text>
          <text x="176" y="160" fontSize="10" fill="#64748b">Middle</text>
          <text x="305" y="160" fontSize="10" fill="#64748b">End</text>
          <circle cx="60" cy="170" r="4" fill="#10b981"/>
          <text x="70" y="174" fontSize="10" fill="#64748b">Good retention</text>
          <circle cx="180" cy="170" r="4" fill="#ef4444"/>
          <text x="190" y="174" fontSize="10" fill="#64748b">Problem: Early drop-off</text>
          <circle cx="70" cy="65" r="12" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
          <text x="70" y="69" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">!</text>
          <text x="90" y="60" fontSize="9" fill="#92400e">First 30 sec</text>
          <text x="90" y="72" fontSize="9" fill="#92400e">drop = fix hook</text>
        </svg>
      </div>

      {/* QUICK DIAGNOSTIC */}
      <section id="diagnostic-sprint" className="sectionOpen">
        <h2 className={s.sectionTitle}>Quick Diagnostic</h2>
        
        <p className={s.sectionText}>
          Follow these steps to identify exactly what&apos;s holding your channel back.
        </p>
        
        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Pick Your Video</h3>
          <div className="diagnosticStep__content">
            <p>Choose one of these:</p>
            <p><strong>Your most recent upload</strong> to see if your current approach is working.</p>
            <p><strong>A video that should have performed</strong> where the topic was good but results disappointed.</p>
            <p>Don&apos;t pick your best video. You want to understand what&apos;s broken, not what&apos;s working.</p>
          </div>
        </div>
        
        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Check Packaging</h3>
          <div className="diagnosticStep__content">
            <p>Go to the video&apos;s Analytics, then Reach. Look at impressions and CTR.</p>
            
            <div className="comparisonGrid">
              <div className="comparisonItem comparisonItem--bad">
                <p className="comparisonItem__label">Low impressions?</p>
                <p className="comparisonItem__content">YouTube isn&apos;t showing your video. Topic or title doesn&apos;t match what people search for, or your channel hasn&apos;t built trust in a niche.</p>
              </div>
              <div className="comparisonItem comparisonItem--bad">
                <p className="comparisonItem__label">Low CTR (under 4%)?</p>
                <p className="comparisonItem__content">People see your thumbnail but don&apos;t click. Pull up 3 to 5 top videos in your niche and compare thumbnails.</p>
              </div>
            </div>
            
            <div className="diagnosticStep__tip">
              <strong>Action:</strong> If CTR is low, test a completely different thumbnail style. You can swap thumbnails without re-uploading.
            </div>
          </div>
        </div>
        
        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Check Retention</h3>
          <div className="diagnosticStep__content">
            <p>Go to Analytics, then Engagement. Look at the retention graph.</p>
            
            <p><strong>The first 30 seconds are everything.</strong> Steep drop here means your hook isn&apos;t working. Either you&apos;re not delivering on the thumbnail promise fast enough, or there&apos;s too much setup before value.</p>
            
            <p><strong>Find the dud moments</strong> where the graph dips. These are friction points: slow explanations, tangents, repetition.</p>
            
            <div className="diagnosticStep__tip">
              <strong>Pro tip:</strong> Use YouTube Studio&apos;s built-in editor to trim or cut friction points. No re-upload needed.
            </div>
          </div>
        </div>
        
        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Check Niche Alignment</h3>
          <div className="diagnosticStep__content">
            <p>Go to Analytics, then Audience. Look at who&apos;s watching.</p>
            
            <p><strong>Are you speaking to one clear viewer type?</strong> Channels that try to appeal to everyone appeal to no one. YouTube&apos;s algorithm works best when it knows exactly who to show your content to.</p>
            
            <p><strong>Compare against competitors.</strong> Find 2 to 3 channels making similar content. What topics do they cover? How do they structure hooks? What thumbnail patterns work?</p>
          </div>
        </div>
        
        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Choose One Thing to Fix</h3>
          <div className="diagnosticStep__content">
            <p>Based on what you found, pick exactly one focus:</p>
            <p><strong>Packaging problem?</strong> Create 3 thumbnail variations for your next video.</p>
            <p><strong>Retention problem?</strong> Rewrite your hook to deliver the promise faster.</p>
            <p><strong>Niche problem?</strong> Research what your audience actually searches for.</p>
            <p style={{ fontWeight: 600, color: 'var(--text)' }}>Don&apos;t try to fix everything. Pick one thing, fix it, test.</p>
          </div>
        </div>
      </section>

      {/* WHY NOT GROWING */}
      <section id="why-not-growing" className="sectionOpen">
        <h2 className={s.sectionTitle}>Why Your Channel Isn&apos;t Growing</h2>
        <p className={s.sectionText}>
          Most stuck channels share one of three root problems. Here&apos;s how to identify and fix each one.
        </p>

        <div className="rootCause">
          <span className="rootCause__number">1</span>
          <h3 className="rootCause__title">You Haven&apos;t Nailed Your Niche</h3>
          <div className="rootCause__content">
            <p>
              <span className="rootCause__label">Symptom:</span> Low impressions, inconsistent viewership, subscribers don&apos;t watch new videos.
            </p>
            <p>
              <span className="rootCause__label">Why it happens:</span> You&apos;re making content for everyone or jumping between topics. YouTube&apos;s algorithm needs to know who to show your videos to. Scattered content means a confused algorithm.
            </p>
            <p className="rootCause__quote">
              Become the channel that owns one topic, not the channel that dabbles in many.
            </p>
            <p>
              <span className="rootCause__label">Fix:</span> Pick a niche and commit to 20 or more videos in it. Study the top 3 channels in that space. Your goal isn&apos;t to copy; it&apos;s to become a recognized voice in the same conversation.
            </p>
          </div>
        </div>

        <div className="rootCause">
          <span className="rootCause__number">2</span>
          <h3 className="rootCause__title">Your Packaging Doesn&apos;t Compete</h3>
          <div className="rootCause__content">
            <p>
              <span className="rootCause__label">Symptom:</span> Decent impressions, low CTR (under 4%), videos don&apos;t get clicked.
            </p>
            <p>
              <span className="rootCause__label">Why it happens:</span> Your thumbnail and title compete against polished creators who&apos;ve tested hundreds of variations. In the same feed, viewers unconsciously compare and click the most compelling option.
            </p>
            <p className="rootCause__quote">
              Your thumbnail is a billboard driving past at 60mph. If it doesn&apos;t grab attention instantly, it&apos;s invisible.
            </p>
            <p>
              <span className="rootCause__label">Fix:</span> Research what&apos;s working. Screenshot the top 5 thumbnails for your target keyword. What do they have in common? The gap between them and yours is your opportunity. See our <Link href="/learn/youtube-thumbnail-best-practices">thumbnail guide</Link>.
            </p>
          </div>
        </div>

        <div className="rootCause">
          <span className="rootCause__number">3</span>
          <h3 className="rootCause__title">Your Content Doesn&apos;t Hold Attention</h3>
          <div className="rootCause__content">
            <p>
              <span className="rootCause__label">Symptom:</span> Good CTR, but retention drops sharply, especially in the first 30 seconds.
            </p>
            <p>
              <span className="rootCause__label">Why it happens:</span> Viewers clicked expecting one thing and got another. Or too much friction: slow intros, tangents, not delivering on the promise fast enough.
            </p>
            <p className="rootCause__quote">
              Every second of your video is a chance for the viewer to leave. Earn every second.
            </p>
            <p>
              <span className="rootCause__label">Fix:</span> Watch your video at 2x speed. Every moment you&apos;d skip? Your viewers already left there. Cut those sections. Lead with value, not setup. See our <Link href="/learn/youtube-retention-analysis">retention guide</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT TO FIX FIRST */}
      <section id="diagnosis-flow" className="sectionTinted">
        <h2 className={s.sectionTitle}>What to Fix First</h2>
        <p className={s.sectionText}>
          Use this decision tree to find your most impactful next step. Start from the top and follow the path that matches your data.
        </p>
        <DiagnosisFlow branches={DIAGNOSIS_BRANCHES} />
      </section>

      {/* COMMON MISTAKES */}
      <section id="common-mistakes" className="sectionOpen">
        <h2 className={s.sectionTitle}>Common Audit Mistakes</h2>
        
        <div className="funCallout" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', borderColor: '#f87171' }}>
          <p className="funCallout__text" style={{ color: '#991b1b' }}>
            Avoid these traps that keep creators stuck in audit paralysis
          </p>
        </div>
        
        <ul className={s.list}>
          <li><strong>Looking at too short a time period.</strong> Compare 28 or 90 day trends, not last week.</li>
          <li><strong>Focusing on views instead of leading indicators.</strong> CTR, retention, and impressions predict future views.</li>
          <li><strong>Making multiple changes at once.</strong> Test one variable at a time so you know what worked.</li>
          <li><strong>Ignoring your successful videos.</strong> Study your top 10%. They show what your audience wants.</li>
          <li><strong>Expecting immediate results.</strong> Give changes 2 weeks and 2 to 3 videos to show impact.</li>
        </ul>
      </section>

      {/* YOUTUBE SEO */}
      <section id="youtube-seo" className="sectionOpen">
        <h2 className={s.sectionTitle}>YouTube SEO Basics</h2>
        
        <div className="realTalk">
          <p className="realTalk__label">Key insight</p>
          <p className="realTalk__text">
            YouTube SEO isn&apos;t like website SEO. While keywords matter, engagement signals matter more.
          </p>
        </div>
        
        <p className={s.sectionText}>
          <strong>The hierarchy that actually matters:</strong>
        </p>
        
        <ol className={s.numberedList}>
          <li><strong>Retention and watch time.</strong> Most important. YouTube wants to recommend videos that keep people watching.</li>
          <li><strong>Click through rate.</strong> Higher CTR signals relevance, which earns more impressions.</li>
          <li><strong>Title and description.</strong> Include keywords naturally, but write for humans first.</li>
        </ol>
        
        <p className={s.sectionText}>
          For the complete strategy including keyword research and description optimization, see our <Link href="/learn/youtube-seo">YouTube SEO guide</Link>.
        </p>
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ready to audit your channel?</h3>
        <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          {BRAND.name} connects to your YouTube analytics and automatically surfaces what&apos;s working and what needs attention.
        </p>
        <Link 
          href="/dashboard" 
          style={{ 
            display: 'inline-block',
            padding: '0.875rem 2rem',
            background: 'white',
            color: '#6366f1',
            fontWeight: 600,
            borderRadius: '0.5rem',
            textDecoration: 'none'
          }}
        >
          Try {BRAND.name} Free
        </Link>
      </div>
    </>
  );
}
