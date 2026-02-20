/**
 * Body content for YouTube Retention Analysis article.
 * Server component - no "use client" directive.
 * 
 * Magazine-style layout with visual variety and proper spacing.
 * Follows the channel-audit design patterns for consistency.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps, ArticleMeta } from "./_shared";
import { tocFromArticle } from "./_shared";

const _article = LEARN_ARTICLES["youtube-retention-analysis"];

export const meta: ArticleMeta = {
  slug: _article.slug,
  title: _article.title,
  description: _article.description,
};

export const toc = tocFromArticle(_article.toc);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* INTRO / HERO */}
      <section id="what-is-retention" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: '1.125rem' }}>
          Audience retention measures how much of your video people actually watch. It&apos;s the percentage of your video that viewers see before clicking away.
        </p>

        <p className={s.sectionText}>
          If you have a 12-minute video and viewers watch an average of 4 minutes, your retention is about 33%. Simple, but incredibly powerful. This single metric tells YouTube more about your content quality than almost anything else.
        </p>

        <div className="pullQuote">
          Retention is the metric that controls how far your video travels.
        </div>

        <p className={s.sectionText}>
          When viewers watch longer, YouTube shows your video to more people. When they leave quickly, YouTube stops recommending it. Every other metric — views, subscribers, revenue — flows downstream from retention.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            By the end of this guide, you&apos;ll know how to find your retention data, read the graph like a pro, diagnose problems, and fix them with proven techniques.
          </p>
        </div>

        <div className={s.statsGrid}>
          <div className={s.stat}>
            <div className={s.statValue}>50%+</div>
            <div className={s.statLabel}>Healthy target (most formats)</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>5–10s</div>
            <div className={s.statLabel}>Critical hook window</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>30–90s</div>
            <div className={s.statLabel}>Attention reset cadence</div>
          </div>
        </div>

        <h3 className={s.subheading}>Why Small Differences Matter</h3>
        <p className={s.sectionText}>
          The difference between 60% and 72% retention might seem small, but it&apos;s not. That 12-point gap can mean the difference between a video that fizzles after 1,000 views and one that gets pushed to 100,000.
        </p>

        <p className={s.sectionText}>
          Think about it this way: if 100 people click on two different videos, and one keeps viewers for 7 minutes while the other only holds them for 4 minutes, YouTube will favor the first video every time. It&apos;s not complicated — YouTube wants to recommend content that keeps people on the platform.
        </p>
      </section>

      {/* WHERE TO FIND RETENTION */}
      <section id="where-to-find" className="sectionOpen">
        <h2 className={s.sectionTitle}>Where to Find Retention Data</h2>
        
        <p className={s.sectionText}>
          YouTube gives you retention data at two levels: channel-wide trends and video-specific graphs. Here&apos;s how to access both in <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>YouTube Studio</a>.
        </p>

        <div className="metricRow">
          <h4 className="metricRow__name">Channel-Level Overview</h4>
          <div className="metricRow__path">
            <span className="studioPath">
              <span className="studioPath__chip">Analytics</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Engagement</span>
            </span>
          </div>
          <p className="metricRow__why">See average view duration and watch time trends across all your videos.</p>
        </div>

        <div className="metricRow">
          <h4 className="metricRow__name">Video-Level Retention Graph</h4>
          <div className="metricRow__path">
            <span className="studioPath">
              <span className="studioPath__chip">Content</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Select Video</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Analytics</span>
              <span className="studioPath__arrow">›</span>
              <span className="studioPath__chip">Engagement</span>
            </span>
          </div>
          <p className="metricRow__why">This is where the magic happens. You&apos;ll see a curve showing exactly when viewers leave.</p>
          <span className="metricRow__tip">Click anywhere on the curve to jump to that exact moment in your video.</span>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Key moments YouTube highlights</p>
          <p className="realTalk__text">
            YouTube Studio automatically identifies &quot;key moments&quot; in your retention graph: intro effectiveness, spikes where people rewatch, and dips where they leave. It also shows how your retention compares to typical videos of similar length.
          </p>
        </div>

        {/* Visual: 3-step flow for finding retention */}
        <div className="inlineIllustration">
          <svg width="340" height="100" viewBox="0 0 340 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three steps to find retention data: Content, Video, Engagement tab">
            <rect x="10" y="30" width="90" height="40" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
            <text x="55" y="55" textAnchor="middle" fontSize="12" fontWeight="600" fill="#475569">1. Content</text>
            <path d="M105 50 L125 50" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <rect x="130" y="30" width="90" height="40" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
            <text x="175" y="55" textAnchor="middle" fontSize="12" fontWeight="600" fill="#475569">2. Video</text>
            <path d="M225 50 L245 50" stroke="#cbd5e1" strokeWidth="2"/>
            <rect x="250" y="30" width="80" height="40" rx="8" fill="#6366f1" stroke="#4f46e5" strokeWidth="2"/>
            <text x="290" y="55" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">3. Engage</text>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1"/>
              </marker>
            </defs>
          </svg>
        </div>
      </section>

      {/* HOW TO READ THE GRAPH */}
      <section id="reading-the-graph" className="sectionTinted">
        <h2 className={s.sectionTitle}>How to Read the Retention Graph</h2>
        
        <p className={s.sectionText}>
          The retention graph starts at 100% and shows how many viewers remain at each point in your video. Learning to read this graph is the single most valuable skill for improving your content.
        </p>

        {/* Retention Curve Illustration */}
        <div className="inlineIllustration">
          <svg width="360" height="220" viewBox="0 0 360 220" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Retention curve showing key zones: hook window, mid-video engagement, and natural end drop">
            {/* Background grid */}
            <rect x="40" y="20" width="300" height="150" fill="#f8fafc" rx="4"/>
            <line x1="40" y1="57" x2="340" y2="57" stroke="#e2e8f0" strokeWidth="1"/>
            <line x1="40" y1="95" x2="340" y2="95" stroke="#e2e8f0" strokeWidth="1"/>
            <line x1="40" y1="132" x2="340" y2="132" stroke="#e2e8f0" strokeWidth="1"/>
            
            {/* Y-axis labels */}
            <text x="30" y="28" textAnchor="end" fontSize="10" fill="#94a3b8">100%</text>
            <text x="30" y="60" textAnchor="end" fontSize="10" fill="#94a3b8">75%</text>
            <text x="30" y="98" textAnchor="end" fontSize="10" fill="#94a3b8">50%</text>
            <text x="30" y="135" textAnchor="end" fontSize="10" fill="#94a3b8">25%</text>
            
            {/* Good retention curve */}
            <path d="M40 25 Q80 30, 100 45 Q150 60, 200 75 Q260 90, 300 100 Q330 108, 340 120" stroke="#10b981" strokeWidth="3" fill="none"/>
            
            {/* Problem curve - steep early drop */}
            <path d="M40 25 Q55 60, 70 100 Q90 125, 130 135 Q200 145, 340 155" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="6"/>
            
            {/* Zone highlights */}
            <rect x="40" y="20" width="60" height="150" fill="#fef3c7" opacity="0.3"/>
            <rect x="280" y="20" width="60" height="150" fill="#e0f2fe" opacity="0.3"/>
            
            {/* Zone labels */}
            <text x="70" y="185" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="600">Hook Zone</text>
            <text x="70" y="197" textAnchor="middle" fontSize="9" fill="#a16207">0-30 sec</text>
            <text x="190" y="185" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="500">Mid-Video</text>
            <text x="310" y="185" textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="500">Natural Drop</text>
            
            {/* X-axis */}
            <text x="40" y="210" fontSize="10" fill="#64748b">Start</text>
            <text x="340" y="210" textAnchor="end" fontSize="10" fill="#64748b">End</text>
            
            {/* Legend */}
            <circle cx="50" cy="218" r="4" fill="#10b981"/>
            <text x="60" y="220" fontSize="9" fill="#64748b">Good retention</text>
            <line x1="140" y1="218" x2="158" y2="218" stroke="#ef4444" strokeWidth="2" strokeDasharray="4"/>
            <text x="165" y="220" fontSize="9" fill="#64748b">Early drop-off problem</text>
          </svg>
        </div>

        <h3 className={s.subheading}>Pattern Diagnosis Guide</h3>
        <p className={s.sectionText}>
          Different patterns in your retention curve point to different problems. Here&apos;s how to diagnose what you&apos;re seeing:
        </p>

        {/* Diagnosis Table */}
        <div className="diagnosisTable">
          <div className="diagnosisTable__row">
            <div className="diagnosisTable__pattern">
              <strong>Steep drop in first 30 seconds</strong>
            </div>
            <div className="diagnosisTable__cause">
              Hook isn&apos;t working. Content doesn&apos;t match title/thumbnail promise. Too much setup before value.
            </div>
            <div className="diagnosisTable__fix">
              Rewrite your opening. Lead with your strongest point. Cut the intro.
            </div>
          </div>
          
          <div className="diagnosisTable__row">
            <div className="diagnosisTable__pattern">
              <strong>Gradual, steady decline</strong>
            </div>
            <div className="diagnosisTable__cause">
              This is normal and healthy. All videos lose viewers over time.
            </div>
            <div className="diagnosisTable__fix">
              No fix needed. Focus on other patterns instead.
            </div>
          </div>
          
          <div className="diagnosisTable__row">
            <div className="diagnosisTable__pattern">
              <strong>Sharp cliff mid-video</strong>
            </div>
            <div className="diagnosisTable__cause">
              Something at that timestamp is causing viewers to leave: a tangent, boring section, or confusing explanation.
            </div>
            <div className="diagnosisTable__fix">
              Watch the 30 seconds before the drop. Cut or restructure that section.
            </div>
          </div>
          
          <div className="diagnosisTable__row">
            <div className="diagnosisTable__pattern">
              <strong>Spike above 100%</strong>
            </div>
            <div className="diagnosisTable__cause">
              Viewers are rewatching this section. Something valuable or entertaining happened.
            </div>
            <div className="diagnosisTable__fix">
              Study what you did there. Replicate it in future videos.
            </div>
          </div>
          
          <div className="diagnosisTable__row">
            <div className="diagnosisTable__pattern">
              <strong>Flat line (no decline)</strong>
            </div>
            <div className="diagnosisTable__cause">
              Excellent engagement. Your structure and pacing are working.
            </div>
            <div className="diagnosisTable__fix">
              Document what you did. This is your template.
            </div>
          </div>
          
          <div className="diagnosisTable__row">
            <div className="diagnosisTable__pattern">
              <strong>Steep drop at the end</strong>
            </div>
            <div className="diagnosisTable__cause">
              Viewers leaving before end screens. Completely normal.
            </div>
            <div className="diagnosisTable__fix">
              Don&apos;t worry about this. Put important content earlier.
            </div>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The first 30 seconds are everything</p>
          <p className="realTalk__text">
            If you&apos;re only going to fix one thing, fix your opening. A strong hook can carry an average video. A weak hook will kill a great one. Most retention problems start here.
          </p>
        </div>
      </section>

      {/* BENCHMARKS */}
      <section id="benchmarks" className="sectionOpen">
        <h2 className={s.sectionTitle}>Retention Benchmarks</h2>
        
        <div className="realTalk">
          <p className="realTalk__label">Keep in mind</p>
          <p className="realTalk__text">
            These are rough ranges that vary by niche, video length, traffic source, and audience. Don&apos;t obsess over hitting specific numbers. What matters more is your trend over time.
          </p>
        </div>

        <div className="statRow">
          <div className="statRow__item">
            <div className="statRow__value">50 to 70%</div>
            <div className="statRow__label">Short Videos (2-5 min)</div>
          </div>
          <div className="statRow__item">
            <div className="statRow__value">40 to 60%</div>
            <div className="statRow__label">Medium Videos (8-15 min)</div>
          </div>
          <div className="statRow__item">
            <div className="statRow__value">30 to 50%</div>
            <div className="statRow__label">Long Videos (20+ min)</div>
          </div>
        </div>

        <p className={s.sectionText}>
          The most useful benchmark is <strong>your own past performance</strong>. Compare your latest video against your average. Are you improving? That&apos;s what matters.
        </p>

        <p className={s.sectionText}>
          YouTube Studio also shows how your retention compares to &quot;typical&quot; videos of similar length. If you&apos;re above that line, you&apos;re doing better than average. If you&apos;re below, there&apos;s room to improve.
        </p>

        <h3 className={s.subheading}>How to Measure Whether Your Fixes Work</h3>
        <p className={s.sectionText}>
          Treat retention like an experiment. You don&apos;t need to change everything at once — you need to learn what moves the curve for your audience.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Check each video after it has real data:</strong> usually 48–72 hours after publishing.
          </li>
          <li>
            <strong>Track the first big drop:</strong> note the timestamp and what you did in that segment.
          </li>
          <li>
            <strong>Compare like with like:</strong> evaluate retention against similar videos (format, length, topic).
          </li>
          <li>
            <strong>Change one thing at a time:</strong> new hook, new pacing, more visuals, tighter edit — then measure.
          </li>
        </ol>
      </section>

      {/* THE PLAYBOOK: 9 WAYS TO IMPROVE */}
      <section id="playbook" className="sectionOpen">
        <h2 className={s.sectionTitle}>9 Ways to Improve Retention</h2>
        
        <p className={s.sectionText}>
          These aren&apos;t theories. They&apos;re proven techniques used by creators who consistently hold audience attention. Pick one or two to focus on for your next video.
        </p>

        <div className="tacticsGrid">
          <div className="tacticCard">
            <h4 className="tacticCard__title">Add Chapters</h4>
            <p className="tacticCard__what">Break your video into labeled sections with timestamps in the description.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Helps viewers find what they need. Reduces abandonment from people scanning for specific info.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Add 4-8 chapters per video over 5 minutes</li>
                <li>Use descriptive titles (not just &quot;Part 1&quot;)</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Tease the Payoff Early</h4>
            <p className="tacticCard__what">Show or mention what viewers will get in the first 10 seconds.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Creates anticipation. Viewers stay to see the promised result.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Open with the end result or transformation</li>
                <li>&quot;By the end of this video, you&apos;ll know exactly how to...&quot;</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Choose Topics Strategically</h4>
            <p className="tacticCard__what">Make videos about topics your audience actually searches for.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Relevance drives retention. People watch longer when the content matches their intent.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Research what your audience searches for using <Link href="/learn/youtube-seo">keyword research</Link></li>
                <li>Study <Link href="/competitors">competitor videos</Link> with high engagement</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Script Your Structure</h4>
            <p className="tacticCard__what">Plan your video flow before recording, even if you don&apos;t read from a script.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Reduces rambling. Keeps content tight and focused.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Outline key points before recording</li>
                <li>Script your first 30 seconds word-for-word</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Publish Consistently</h4>
            <p className="tacticCard__what">Show up regularly so your audience knows what to expect.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Builds habits. Returning viewers watch longer than new ones.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Pick a realistic schedule you can maintain</li>
                <li>Consistency beats frequency</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Be Concise</h4>
            <p className="tacticCard__what">Make your video exactly as long as it needs to be. No padding.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Every second of filler is a chance for viewers to leave. Tight content keeps attention.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Watch your video at 2x speed. Cut anything you&apos;d skip.</li>
                <li>Remove &quot;filler phrases&quot; in editing</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Deliver Value Fast</h4>
            <p className="tacticCard__what">Get to the main content within 30 seconds. Skip lengthy intros.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Viewers clicked for a reason. Give them what they came for.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Cut &quot;hey guys, welcome back&quot; style intros</li>
                <li>Lead with your strongest point</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Use On-Screen Graphics</h4>
            <p className="tacticCard__what">Add text, images, or animations that support what you&apos;re saying.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> Visual variety holds attention. Reinforces key points.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Add lower-thirds for key takeaways</li>
                <li>Use b-roll or screen recordings to illustrate points</li>
              </ul>
            </div>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">Add Pattern Interrupts</h4>
            <p className="tacticCard__what">Change something every 30-60 seconds: camera angle, music, energy, or topic.</p>
            <p className="tacticCard__why"><strong>Why it works:</strong> The brain notices change. Resets attention before viewers zone out.</p>
            <div className="tacticCard__do">
              <strong>Do this:</strong>
              <ul>
                <li>Vary your delivery: pause, speed up, get louder</li>
                <li>Cut to a different visual or angle</li>
              </ul>
            </div>
          </div>
        </div>

        <h3 className={s.subheading}>Retention Checklist (Before You Publish)</h3>
        <p className={s.sectionText}>
          Use this as a quick pre-flight check. It catches the most common retention killers before they ship.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Hook immediately:</strong> tease the payoff, ask a question, or make a bold statement — skip generic intros.
          </li>
          <li>
            <strong>Deliver on the title promise early:</strong> viewers should get a win in the first minute.
          </li>
          <li>
            <strong>Cut setup that doesn&apos;t earn its keep:</strong> if it doesn&apos;t build tension or deliver value, it&apos;s filler.
          </li>
          <li>
            <strong>Add resets:</strong> change something (visual, pace, energy, topic) regularly so attention doesn&apos;t drift.
          </li>
          <li>
            <strong>Remove dead air:</strong> watch at faster speed; cut anything you&apos;d skip as a viewer.
          </li>
          <li>
            <strong>Build toward a payoff:</strong> structure the video so there&apos;s a reason to see what happens next.
          </li>
          <li>
            <strong>End before it drags:</strong> finish while energy is high; don&apos;t trail off.
          </li>
        </ol>

        <h3 className={s.subheading}>Common Retention Killers (And the Fix)</h3>
        <ul className={s.list}>
          <li>
            <strong>Slow intros:</strong> lead with the strongest moment, then add context later.
          </li>
          <li>
            <strong>Title/thumbnail mismatch:</strong> prove the promise quickly so viewers feel &quot;I clicked the right video.&quot;
          </li>
          <li>
            <strong>Talking head with no variety:</strong> add b-roll, screenshots, on-screen text, or a camera change.
          </li>
          <li>
            <strong>Padding for length:</strong> make the video as long as it needs to be — no longer.
          </li>
          <li>
            <strong>Saving the best for last:</strong> distribute value throughout; most viewers won&apos;t make it to the end.
          </li>
          <li>
            <strong>Monotone delivery:</strong> vary pace, volume, and energy; the mic picks up enthusiasm (and boredom).
          </li>
        </ul>
      </section>

      {/* PACING + EDITING */}
      <section id="pacing-and-editing" className="sectionTinted">
        <h2 className={s.sectionTitle}>Pacing and Editing That Keep the Middle Strong</h2>

        <p className={s.sectionText}>
          Most retention losses don&apos;t happen because the topic is bad — they happen because the video feels slow, repetitive, or visually static. The goal is not hyper editing. It&apos;s momentum.
        </p>

        <h3 className={s.subheading}>Pacing Principles</h3>
        <ul className={s.list}>
          <li>
            <strong>Vary your speed:</strong> go fast for easy points, slow down for key ideas.
          </li>
          <li>
            <strong>Use progress markers:</strong> tell viewers where they are (&quot;Next, we&apos;ll fix...&quot;) so the structure feels inevitable.
          </li>
          <li>
            <strong>Open loops (and close them):</strong> tease something valuable later, then pay it off.
          </li>
        </ul>

        <h3 className={s.subheading}>Pattern Interrupt Ideas</h3>
        <p className={s.sectionText}>
          Pattern interrupts reset attention by changing something on screen or in your delivery. They don&apos;t need to be fancy.
        </p>
        <ul className={s.twoColList}>
          <li>
            <strong>Visual</strong>
            Cut to b-roll, add on-screen text, zoom, switch camera, show the result.
          </li>
          <li>
            <strong>Audio</strong>
            Drop music, add a sound hit, shift tone/energy, use a pause for emphasis.
          </li>
          <li>
            <strong>Content</strong>
            Tell a quick story, ask a question, introduce a constraint, add a concrete example.
          </li>
          <li>
            <strong>Structure</strong>
            Move into a new segment, recap a takeaway, or show a checklist before continuing.
          </li>
        </ul>

        <h3 className={s.subheading}>Editing Pass (The &quot;Tighten&quot; Checklist)</h3>
        <ul className={s.list}>
          <li>Cut repeated explanations and &quot;filler phrases&quot;.</li>
          <li>Trim pauses, ums, dead air, and &quot;thinking&quot; time.</li>
          <li>Add a visual every time you introduce a new idea.</li>
          <li>If a section feels slow, shorten it or add a reset — don&apos;t just talk harder.</li>
        </ul>
      </section>

      {/* HOOK-DELIVER CYCLE */}
      <section id="hook-deliver-cycle" className="sectionTinted">
        <h2 className={s.sectionTitle}>The Hook-Deliver-Hook Cycle</h2>
        
        <p className={s.sectionText}>
          The best creators don&apos;t just hook viewers once at the beginning. They use a continuous cycle throughout the entire video: hook, deliver, hook again.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            Every time you close a loop, immediately open a new one. Resolve the previous promise, then give viewers a reason to stick around for what&apos;s next.
          </p>
        </div>

        {/* Hook-Deliver Cycle Diagram */}
        <div className="inlineIllustration">
          <svg width="340" height="140" viewBox="0 0 340 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cycle diagram showing Hook leads to Deliver leads to Hook again">
            {/* Step 1: Hook */}
            <rect x="20" y="45" width="80" height="50" rx="8" fill="#6366f1"/>
            <text x="60" y="75" textAnchor="middle" fontSize="14" fontWeight="600" fill="white">Hook</text>
            
            {/* Arrow 1 */}
            <path d="M105 70 L125 70" stroke="#cbd5e1" strokeWidth="2"/>
            <polygon points="125,65 135,70 125,75" fill="#cbd5e1"/>
            
            {/* Step 2: Deliver */}
            <rect x="140" y="45" width="80" height="50" rx="8" fill="#10b981"/>
            <text x="180" y="75" textAnchor="middle" fontSize="14" fontWeight="600" fill="white">Deliver</text>
            
            {/* Arrow 2 */}
            <path d="M225 70 L245 70" stroke="#cbd5e1" strokeWidth="2"/>
            <polygon points="245,65 255,70 245,75" fill="#cbd5e1"/>
            
            {/* Step 3: Hook Again */}
            <rect x="260" y="45" width="60" height="50" rx="8" fill="#6366f1"/>
            <text x="290" y="68" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">Hook</text>
            <text x="290" y="82" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">Again</text>
            
            {/* Cycle arrow back */}
            <path d="M290 100 Q290 125, 180 125 Q60 125, 60 100" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeDasharray="4"/>
            <polygon points="55,100 60,110 65,100" fill="#cbd5e1"/>
            
            {/* Labels */}
            <text x="60" y="28" textAnchor="middle" fontSize="10" fill="#64748b">Create curiosity</text>
            <text x="180" y="28" textAnchor="middle" fontSize="10" fill="#64748b">Satisfy it</text>
            <text x="290" y="28" textAnchor="middle" fontSize="10" fill="#64748b">Re-open a loop</text>
          </svg>
        </div>

        <h3 className={s.subheading}>The Template</h3>
        <p className={s.sectionText}>
          Here&apos;s the formula you can use throughout your video:
        </p>

        <div className="templateBox">
          <p className="templateBox__line"><span className="templateBox__label">Hook:</span> &quot;I&apos;m going to show you [promise]...&quot;</p>
          <p className="templateBox__line"><span className="templateBox__label">Deliver:</span> [Give them exactly what you promised]</p>
          <p className="templateBox__line"><span className="templateBox__label">Re-hook:</span> &quot;But there&apos;s one more thing that makes this even better...&quot;</p>
        </div>

        <h3 className={s.subheading}>Example: Tutorial Style</h3>
        <div className="exampleBox">
          <p><strong>Hook:</strong> &quot;This simple edit will save you hours every week.&quot;</p>
          <p><strong>Deliver:</strong> Show the technique step by step.</p>
          <p><strong>Re-hook:</strong> &quot;Now let me show you the shortcut that makes this 10x faster.&quot;</p>
        </div>

        <h3 className={s.subheading}>Example: Story Style</h3>
        <div className="exampleBox">
          <p><strong>Hook:</strong> &quot;I made a mistake that nearly cost me everything.&quot;</p>
          <p><strong>Deliver:</strong> Tell the story, reveal what happened.</p>
          <p><strong>Re-hook:</strong> &quot;What I learned from this changed how I approach everything. Here&apos;s the lesson...&quot;</p>
        </div>

        <h3 className={s.subheading}>Hook Frameworks That Reliably Work</h3>
        <ul className={s.twoColList}>
          <li>
            <strong>Result tease</strong>
            Show the outcome first, then explain how to get there.
          </li>
          <li>
            <strong>Curiosity gap</strong>
            Open a question viewers need answered (&quot;Most creators miss this one thing...&quot;).
          </li>
          <li>
            <strong>Bold statement</strong>
            Challenge a common belief and promise proof.
          </li>
          <li>
            <strong>Jump-in</strong>
            Start mid-action (analytics on screen, a mistake in progress, a surprising result).
          </li>
        </ul>

        <h3 className={s.subheading}>What to Avoid in Your Opening</h3>
        <ul className={s.list}>
          <li>&quot;Hey guys, welcome back to my channel&quot; style intros.</li>
          <li>Long branded intro sequences.</li>
          <li>Explaining what you&apos;ll cover instead of showing something useful.</li>
          <li>Asking for a like/subscribe before the viewer has gotten value.</li>
        </ul>
      </section>

      {/* FIX IT FAST */}
      <section id="fix-it-fast" className="sectionOpen">
        <h2 className={s.sectionTitle}>Quick Retention Audit (One Video)</h2>
        
        <p className={s.sectionText}>
          Don&apos;t overthink it. Here&apos;s a simple workflow you can run to find one clear retention issue and make a specific change for your next upload.
        </p>

        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Step 1: Pick a Video</h3>
          <div className="diagnosticStep__content">
            <p>Choose your most recent upload or a video that underperformed. Don&apos;t pick your best video — you want to find problems.</p>
          </div>
        </div>

        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Step 2: Find the First Big Drop</h3>
          <div className="diagnosticStep__content">
            <p>Open the video&apos;s retention graph. Look for the first steep decline. Note the timestamp.</p>
          </div>
        </div>

        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Step 3: Watch That Section</h3>
          <div className="diagnosticStep__content">
            <p>Watch 30 seconds before the drop. Ask yourself: What might have caused viewers to leave here?</p>
          </div>
        </div>

        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Step 4: Identify One Friction Point</h3>
          <div className="diagnosticStep__content">
            <p>Common culprits: slow explanation, tangent, missing hook, repetition, or low energy. Pick the most obvious issue.</p>
          </div>
        </div>

        <div className="diagnosticStep">
          <h3 className="diagnosticStep__title">Step 5: Choose Your Fix</h3>
          <div className="diagnosticStep__content">
            <p>For your <strong>next video</strong>, commit to one change:</p>
            
            <div className="comparisonGrid">
              <div className="comparisonItem comparisonItem--good">
                <p className="comparisonItem__label">Hook problem?</p>
                <p className="comparisonItem__content">Script and rehearse your first 30 seconds</p>
              </div>
              <div className="comparisonItem comparisonItem--good">
                <p className="comparisonItem__label">Pacing problem?</p>
                <p className="comparisonItem__content">Add pattern interrupts every 45 seconds</p>
              </div>
              <div className="comparisonItem comparisonItem--good">
                <p className="comparisonItem__label">Structure problem?</p>
                <p className="comparisonItem__content">Add chapters and plan your flow</p>
              </div>
              <div className="comparisonItem comparisonItem--good">
                <p className="comparisonItem__label">Visual problem?</p>
                <p className="comparisonItem__content">Add b-roll or graphics to break it up</p>
              </div>
            </div>
            
            <div className="diagnosticStep__tip">
              <strong>Sprint rule:</strong> Fix one thing at a time. Test it. Measure. Then move to the next.
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ready to analyze your retention?</h3>
        <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          {BRAND.name} connects to your YouTube analytics and shows you exactly where viewers drop off across all your videos.
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
