/**
 * Body content for How to Get More Subscribers article.
 * Server component - no "use client" directive.
 *
 * Refactored: Magazine-style layout with visual variety, narrative flow,
 * and no "list hell". Uses SVG diagrams, card grids, and alternating sections.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* HERO SECTION - Subscribers are a byproduct */}
      <section id="subscribers-byproduct" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          Every creator wants more subscribers. But here is the truth nobody
          tells you: subscribers are not a goal you chase. They are a byproduct
          of something else.
        </p>

        <p className="standaloneLine">
          Subscribers happen when viewers consistently get value.
        </p>

        <p className={s.sectionText}>
          When someone subscribes, they are making a bet on your future content.
          They are saying: "I trust that what you post next will be worth my
          time." Your job is not to convince people to subscribe. Your job is to
          be worth subscribing to.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            This guide is not about tricks or hacks. It is about understanding
            why people subscribe and building a channel that earns their
            commitment.
          </p>
        </div>

        {/* What you'll learn - 3 item mini row */}
        <div className="whatYoullLearn">
          <div className="whatYoullLearn__item">
            <WhatYoullLearnIcon />
            <span>The psychology behind why viewers become subscribers</span>
          </div>
          <div className="whatYoullLearn__item">
            <WhatYoullLearnIcon />
            <span>Five levers you can pull to increase conversions</span>
          </div>
          <div className="whatYoullLearn__item">
            <WhatYoullLearnIcon />
            <span>A quick checklist to improve your next video</span>
          </div>
        </div>
      </section>

      {/* THE SUBSCRIBER ENGINE - Visual model */}
      <section id="subscriber-engine" className="sectionTinted">
        <h2 className={s.sectionTitle}>The Subscriber Engine</h2>
        <p className={s.sectionText}>
          Subscriber growth follows a predictable path. Miss any step and the
          engine stalls. Here is how viewers become subscribers:
        </p>

        {/* Trust Meter Visual */}
        <div className="inlineIllustration">
          <svg
            width="340"
            height="70"
            viewBox="0 0 340 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Trust meter showing viewer progression to subscriber"
          >
            {/* Meter background */}
            <rect x="10" y="15" width="320" height="20" rx="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
            
            {/* Meter fill - gradient */}
            <defs>
              <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <rect x="12" y="17" width="316" height="16" rx="8" fill="url(#trustGradient)" />
            
            {/* Stage markers */}
            <line x1="90" y1="12" x2="90" y2="38" stroke="#64748b" strokeWidth="1" />
            <line x1="170" y1="12" x2="170" y2="38" stroke="#64748b" strokeWidth="1" />
            <line x1="250" y1="12" x2="250" y2="38" stroke="#64748b" strokeWidth="1" />
            
            {/* Labels - well spaced */}
            <text x="10" y="55" fontSize="10" fill="#64748b">Click</text>
            <text x="90" y="55" textAnchor="middle" fontSize="10" fill="#64748b">Watch</text>
            <text x="170" y="55" textAnchor="middle" fontSize="10" fill="#64748b">Return</text>
            <text x="250" y="55" textAnchor="middle" fontSize="10" fill="#64748b">Trust</text>
            <text x="330" y="55" textAnchor="end" fontSize="10" fontWeight="600" fill="#16a34a">Subscribe</text>
          </svg>
        </div>

        <p className={s.sectionText}>
          <strong>Click:</strong> They saw your thumbnail and title and decided
          it was worth their time. This is packaging.
        </p>
        <p className={s.sectionText}>
          <strong>Watch:</strong> They stayed because you delivered on the
          promise. This is retention.
        </p>
        <p className={s.sectionText}>
          <strong>Trust:</strong> They came back for another video, then
          another. This is the relationship forming.
        </p>
        <p className={s.sectionText}>
          <strong>Subscribe:</strong> They decided your future content is worth
          a notification slot. This is commitment.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">Key insight</p>
          <p className="realTalk__text">
            Most creators obsess over the last step (asking for subscribers)
            while ignoring the first three. Fix the engine, and subscriptions
            follow naturally.
          </p>
        </div>
      </section>

      {/* 5 REASONS PEOPLE SUBSCRIBE - Card grid */}
      <section id="why-people-subscribe" className="sectionOpen">
        <h2 className={s.sectionTitle}>5 Reasons People Subscribe</h2>
        <p className={s.sectionText}>
          Understanding why people subscribe helps you create content that
          converts. Each reason suggests a different content strategy.
        </p>

        <div className="reasonsGrid">
          {/* Reason 1 */}
          <div className="reasonCard">
            <div className="reasonCard__header">
              <span className="reasonCard__number">1</span>
              <h3 className="reasonCard__title">They got a win</h3>
            </div>
            <p className="reasonCard__looks">
              <strong>Looks like:</strong> "This fixed my problem" or "I learned
              something I needed"
            </p>
            <div className="reasonCard__action">
              <strong>Do this:</strong>
              <ul>
                <li>Solve specific, searchable problems</li>
                <li>Deliver the answer early in the video</li>
              </ul>
            </div>
          </div>

          {/* Reason 2 */}
          <div className="reasonCard">
            <div className="reasonCard__header">
              <span className="reasonCard__number">2</span>
              <h3 className="reasonCard__title">They trust your taste</h3>
            </div>
            <p className="reasonCard__looks">
              <strong>Looks like:</strong> "I always agree with their takes" or
              "They find the best stuff"
            </p>
            <div className="reasonCard__action">
              <strong>Do this:</strong>
              <ul>
                <li>Share opinions, not just information</li>
                <li>Curate, filter, and recommend</li>
              </ul>
            </div>
          </div>

          {/* Reason 3 */}
          <div className="reasonCard">
            <div className="reasonCard__header">
              <span className="reasonCard__number">3</span>
              <h3 className="reasonCard__title">They want the next episode</h3>
            </div>
            <p className="reasonCard__looks">
              <strong>Looks like:</strong> "I need to know what happens" or
              "This is like a show I follow"
            </p>
            <div className="reasonCard__action">
              <strong>Do this:</strong>
              <ul>
                <li>Create series with continuity</li>
                <li>End with open loops and teasers</li>
              </ul>
            </div>
          </div>

          {/* Reason 4 */}
          <div className="reasonCard">
            <div className="reasonCard__header">
              <span className="reasonCard__number">4</span>
              <h3 className="reasonCard__title">They identify with you</h3>
            </div>
            <p className="reasonCard__looks">
              <strong>Looks like:</strong> "They get people like me" or "I feel
              like I belong here"
            </p>
            <div className="reasonCard__action">
              <strong>Do this:</strong>
              <ul>
                <li>Speak to a specific type of viewer</li>
                <li>Build community through comments and posts</li>
              </ul>
            </div>
          </div>

          {/* Reason 5 */}
          <div className="reasonCard">
            <div className="reasonCard__header">
              <span className="reasonCard__number">5</span>
              <h3 className="reasonCard__title">
                They do not want to miss updates
              </h3>
            </div>
            <p className="reasonCard__looks">
              <strong>Looks like:</strong> "They post great stuff regularly" or
              "I check for their videos"
            </p>
            <div className="reasonCard__action">
              <strong>Do this:</strong>
              <ul>
                <li>Post on a predictable schedule</li>
                <li>Build expectation with series and formats</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* THE PLAYBOOK - Grouped into levers */}
      <section id="the-playbook" className="sectionOpen">
        <h2 className={s.sectionTitle}>The Playbook</h2>
        <p className={s.sectionText}>
          Instead of 25 scattered tips, here are the five levers that actually
          move subscriber growth. Pull the one that matches your biggest
          bottleneck.
        </p>

        {/* LEVER A: Packaging */}
        <div className="playbookLever">
          <h3 className="playbookLever__title" id="playbook-packaging">
            <span className="playbookLever__letter">A</span>
            Packaging (Get the Click)
          </h3>
          <p className="playbookLever__text">
            Your thumbnail and title compete against polished creators who have
            tested hundreds of variations. If nobody clicks, nothing else
            matters.
          </p>

          {/* Good vs Bad Thumbnail - Visual comparison */}
          <div className="thumbnailGallery">
            <div className="thumbnailGallery__item thumbnailGallery__item--bad">
              <div className="thumbnailMock thumbnailMock--bad">
                <svg width="100%" height="100%" viewBox="0 0 80 45" fill="none">
                  {/* Multiple small faces - cluttered */}
                  <circle cx="15" cy="18" r="8" fill="#e2e8f0" stroke="#cbd5e1" />
                  <circle cx="40" cy="15" r="6" fill="#e2e8f0" stroke="#cbd5e1" />
                  <circle cx="60" cy="20" r="7" fill="#e2e8f0" stroke="#cbd5e1" />
                  <circle cx="28" cy="30" r="5" fill="#e2e8f0" stroke="#cbd5e1" />
                  {/* Tiny unreadable text */}
                  <text x="40" y="40" textAnchor="middle" fontSize="4" fill="#94a3b8">tiny text nobody can read</text>
                </svg>
              </div>
              <span className="thumbnailGallery__label thumbnailGallery__label--bad">
                Cluttered, no focal point
              </span>
            </div>
            <div className="thumbnailGallery__item thumbnailGallery__item--good">
              <div className="thumbnailMock thumbnailMock--good">
                <svg width="100%" height="100%" viewBox="0 0 80 45" fill="none">
                  {/* Single large expressive face */}
                  <circle cx="40" cy="20" r="14" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
                  {/* Eyes showing expression */}
                  <ellipse cx="35" cy="17" rx="3" ry="4" fill="#166534" />
                  <ellipse cx="45" cy="17" rx="3" ry="4" fill="#166534" />
                  {/* Open mouth - surprised */}
                  <ellipse cx="40" cy="26" rx="4" ry="3" fill="#166534" />
                  {/* Bold readable text */}
                  <text x="40" y="42" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#166534">CLEAR PROMISE</text>
                </svg>
              </div>
              <span className="thumbnailGallery__label thumbnailGallery__label--good">
                One face, one message
              </span>
            </div>
          </div>

          <p className="playbookLever__text">
            Learn the full system in our{" "}
            <Link href="/learn/youtube-thumbnail-best-practices">
              thumbnail best practices guide
            </Link>
            .
          </p>
        </div>

        {/* LEVER B: Retention */}
        <div className="playbookLever">
          <h3 className="playbookLever__title" id="playbook-retention">
            <span className="playbookLever__letter">B</span>
            Retention (Earn the Next Minute)
          </h3>
          <p className="playbookLever__text">
            Getting a click means nothing if viewers leave in the first 30
            seconds. The retention curve tells you exactly where you are losing
            people.
          </p>

          {/* Retention curve illustration */}
          <div className="inlineIllustration">
            <svg
              width="320"
              height="140"
              viewBox="0 0 320 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Retention curve highlighting the critical first 30 seconds"
            >
              {/* Background */}
              <rect x="40" y="20" width="260" height="80" fill="#f8fafc" rx="4" />

              {/* Grid lines */}
              <line x1="40" y1="40" x2="300" y2="40" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="40" y1="60" x2="300" y2="60" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="40" y1="80" x2="300" y2="80" stroke="#e2e8f0" strokeWidth="1" />

              {/* Good retention curve */}
              <path
                d="M40 30 Q100 35, 160 45 Q220 55, 260 65 Q280 70, 300 75"
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
              />

              {/* Critical zone highlight */}
              <rect
                x="40"
                y="20"
                width="80"
                height="80"
                fill="#fef3c7"
                opacity="0.3"
              />
              <line x1="120" y1="20" x2="120" y2="100" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />

              {/* Labels */}
              <text x="40" y="115" fontSize="10" fill="#64748b">0:00</text>
              <text x="120" y="115" fontSize="10" fill="#f59e0b" fontWeight="600">0:30</text>
              <text x="290" y="115" fontSize="10" fill="#64748b">End</text>

              {/* Annotation */}
              <circle cx="80" cy="125" r="4" fill="#f59e0b" />
              <text x="90" y="129" fontSize="9" fill="#92400e">
                First 30 sec = make or break
              </text>
            </svg>
          </div>

          <div className="playbookLever__actions">
            <strong>Do this next:</strong>
            <ul>
              <li>Open with the payoff or a curiosity hook, not setup</li>
              <li>Cut anything you would skip at 2x speed</li>
              <li>Use pattern interrupts (b-roll, graphics) to reset attention</li>
            </ul>
          </div>

          <p className="playbookLever__text">
            Deep dive:{" "}
            <Link href="/learn/youtube-retention-analysis">
              YouTube retention analysis guide
            </Link>
            .
          </p>
        </div>

        {/* LEVER C: Value & Positioning */}
        <div className="playbookLever">
          <h3 className="playbookLever__title" id="playbook-positioning">
            <span className="playbookLever__letter">C</span>
            Value and Positioning (Nail Your Niche)
          </h3>
          <p className="playbookLever__text">
            If your channel tries to appeal to everyone, it appeals to no one.
            YouTube&apos;s algorithm needs to know exactly who to show your
            videos to.
          </p>

          <div className="pullQuote" style={{ fontSize: "18px", padding: "24px 0" }}>
            One viewer, one problem, one promise.
          </div>

          <div className="playbookLever__actions">
            <strong>Do this next:</strong>
            <ul>
              <li>Write one sentence describing who your channel is for</li>
              <li>Commit to 20 videos in a focused topic before pivoting</li>
            </ul>
          </div>
        </div>

        {/* LEVER D: Community */}
        <div className="playbookLever">
          <h3 className="playbookLever__title" id="playbook-community">
            <span className="playbookLever__letter">D</span>
            Community and Belonging (Comments to Subscribers)
          </h3>
          <p className="playbookLever__text">
            Comments are not just engagement metrics. They are the start of a
            relationship. Viewers who feel part of something are more likely to
            subscribe.
          </p>

          <div className="playbookLever__actions">
            <strong>The flywheel:</strong>
            <ul>
              <li>Ask a question in your video or pinned comment</li>
              <li>Reply to comments in the first hour</li>
              <li>Recognize returning viewers by name</li>
              <li>Use Community posts to keep the conversation going</li>
            </ul>
          </div>
        </div>

        {/* LEVER E: Momentum */}
        <div className="playbookLever">
          <h3 className="playbookLever__title" id="playbook-momentum">
            <span className="playbookLever__letter">E</span>
            Momentum (Consistency Without Burnout)
          </h3>
          <p className="playbookLever__text">
            Consistency is not about posting every day. It is about showing up
            predictably so viewers know what to expect.
          </p>

          {/* Calendar visual */}
          <div className="inlineIllustration">
            <svg
              width="280"
              height="100"
              viewBox="0 0 280 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Calendar showing flexible but consistent posting"
            >
              {/* Week boxes */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <g key={i}>
                  <rect
                    x={20 + i * 36}
                    y="30"
                    width="32"
                    height="32"
                    fill={i === 1 || i === 4 ? "#dcfce7" : "#f8fafc"}
                    stroke={i === 1 || i === 4 ? "#22c55e" : "#e2e8f0"}
                    strokeWidth="1.5"
                    rx="4"
                  />
                  <text
                    x={36 + i * 36}
                    y="50"
                    textAnchor="middle"
                    fontSize="11"
                    fill={i === 1 || i === 4 ? "#16a34a" : "#94a3b8"}
                  >
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </text>
                  {(i === 1 || i === 4) && (
                    <text
                      x={36 + i * 36}
                      y="72"
                      textAnchor="middle"
                      fontSize="16"
                      fill="#22c55e"
                    >
                      ✓
                    </text>
                  )}
                </g>
              ))}
              <text x="140" y="95" textAnchor="middle" fontSize="10" fill="#64748b">
                Sustainable beats daily
              </text>
            </svg>
          </div>

          <div className="realTalk">
            <p className="realTalk__label">Reality check</p>
            <p className="realTalk__text">
              One video every Tuesday beats three videos one week and nothing
              for a month. Pick a pace you can maintain for a year.
            </p>
          </div>
        </div>
      </section>

      {/* DECISION TREE - Tactics that move subscribers */}
      <section id="tactics-decision-tree" className="sectionTinted">
        <h2 className={s.sectionTitle}>What to Fix First</h2>
        <p className={s.sectionText}>
          Not sure where to focus? Use this decision tree to find your biggest
          lever. Check your YouTube Analytics and follow the path that matches
          your data.
        </p>

        <div className="diagnosisFlow">
          <div className="diagnosisFlow__branch">
            <h4 className="diagnosisFlow__condition">
              <ConditionIcon />
              If impressions are low
            </h4>
            <p className="diagnosisFlow__why">
              YouTube is not showing your videos. This is a topic, niche, or SEO
              problem.
            </p>
            <ul className="diagnosisFlow__actions">
              <li>Pick a clearer niche and commit to it</li>
              <li>Research what your audience actually searches for</li>
            </ul>
            <Link href="/learn/youtube-seo" className="diagnosisFlow__link">
              Learn YouTube SEO strategies
              <ArrowIcon />
            </Link>
          </div>

          <div className="diagnosisFlow__branch">
            <h4 className="diagnosisFlow__condition">
              <ConditionIcon />
              If CTR is below 4%
            </h4>
            <p className="diagnosisFlow__why">
              People see your video but do not click. This is a packaging
              problem.
            </p>
            <ul className="diagnosisFlow__actions">
              <li>Test a completely different thumbnail style</li>
              <li>Rewrite titles to add curiosity or clarity</li>
            </ul>
            <Link href="/learn/youtube-thumbnail-best-practices" className="diagnosisFlow__link">
              Master thumbnail design
              <ArrowIcon />
            </Link>
          </div>

          <div className="diagnosisFlow__branch">
            <h4 className="diagnosisFlow__condition">
              <ConditionIcon />
              If retention drops in the first 30 seconds
            </h4>
            <p className="diagnosisFlow__why">
              Your hook is not working. Viewers click but leave immediately.
            </p>
            <ul className="diagnosisFlow__actions">
              <li>Cut the intro and start with the payoff</li>
              <li>Deliver on the thumbnail promise faster</li>
            </ul>
            <Link href="/learn/youtube-retention-analysis" className="diagnosisFlow__link">
              Fix retention problems
              <ArrowIcon />
            </Link>
          </div>

          <div className="diagnosisFlow__branch">
            <h4 className="diagnosisFlow__condition">
              <ConditionIcon />
              If returning viewers are low
            </h4>
            <p className="diagnosisFlow__why">
              People watch once but do not come back. You need to build habit
              and community.
            </p>
            <ul className="diagnosisFlow__actions">
              <li>Create series content with continuity</li>
              <li>Use end screens to direct to your next video</li>
              <li>Engage with comments to build relationships</li>
            </ul>
            <Link href="/learn/youtube-channel-audit" className="diagnosisFlow__link">
              Audit your channel for growth bottlenecks
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* THE SUBSCRIBER ASK - Good vs Bad CTAs */}
      <section id="subscriber-ask" className="sectionOpen">
        <h2 className={s.sectionTitle}>The Subscriber Ask</h2>
        <p className={s.sectionText}>
          Yes, you should ask for subscribers. But there is a right way and a
          cringe way. The difference is timing and framing.
        </p>

        <div className="comparisonGrid">
          <div className="comparisonItem comparisonItem--bad">
            <p className="comparisonItem__label">Weak ask (too early)</p>
            <p className="comparisonItem__content">
              "Before we start, make sure to smash that subscribe button..."
            </p>
            <p className="comparisonItem__content" style={{ marginTop: "8px", fontStyle: "italic", fontSize: "13px" }}>
              You have not earned it yet. Viewers are skeptical before receiving
              value.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Strong ask (after value)</p>
            <p className="comparisonItem__content">
              "If this helped you understand [topic], subscribe for more
              breakdowns like this every Tuesday."
            </p>
            <p className="comparisonItem__content" style={{ marginTop: "8px", fontStyle: "italic", fontSize: "13px" }}>
              Comes after a win. Promises specific future value.
            </p>
          </div>
        </div>

        <h3 className={s.subheading}>When to ask</h3>
        <ul className={s.list}>
          <li>
            <strong>After a key insight:</strong> Right after you delivered
            something valuable, the viewer is thinking "that was useful."
          </li>
          <li>
            <strong>Near the end:</strong> Viewers who made it this far are
            engaged and more likely to convert.
          </li>
          <li>
            <strong>With a promise:</strong> Tell them what they will get by
            subscribing, not just that they should.
          </li>
        </ul>

        <div className="funCallout">
          <p className="funCallout__text">
            The best subscribe ask does not feel like an ask. It feels like a
            helpful reminder for viewers who already decided they want more.
          </p>
        </div>
      </section>

      {/* QUICK WINS CHECKLIST */}
      <section id="subscriber-sprint" className="sectionOpen">
        <h2 className={s.sectionTitle}>Quick Wins Checklist</h2>
        <p className={s.sectionText}>
          Take one of your recent videos and run through this checklist. Small
          improvements compound across your catalog.
        </p>

        <div className="sprintSteps">
          <div className="sprintStep">
            <span className="sprintStep__time">1</span>
            <div className="sprintStep__content">
              <h4 className="sprintStep__title">Pick a recent video</h4>
              <p className="sprintStep__why">
                Choose something from the last 2 weeks. Fresh enough to still
                get views, recent enough to optimize.
              </p>
            </div>
          </div>

          <div className="sprintStep">
            <span className="sprintStep__time">2</span>
            <div className="sprintStep__content">
              <h4 className="sprintStep__title">Check the thumbnail</h4>
              <p className="sprintStep__why">
                Does it have one clear focal point? Can you read it on mobile?
                If not, swap it with a cleaner version.
              </p>
            </div>
          </div>

          <div className="sprintStep">
            <span className="sprintStep__time">3</span>
            <div className="sprintStep__content">
              <h4 className="sprintStep__title">Watch your first 30 seconds</h4>
              <p className="sprintStep__why">
                Does it deliver on the thumbnail promise? Is there dead time?
                Consider using YouTube Editor to tighten it.
              </p>
            </div>
          </div>

          <div className="sprintStep">
            <span className="sprintStep__time">4</span>
            <div className="sprintStep__content">
              <h4 className="sprintStep__title">Add an end screen</h4>
              <p className="sprintStep__why">
                Link to your best converting video. Verbally mention it: "If you
                liked this, you will love this one."
              </p>
            </div>
          </div>

          <div className="sprintStep">
            <span className="sprintStep__time">5</span>
            <div className="sprintStep__content">
              <h4 className="sprintStep__title">Pin a comment</h4>
              <p className="sprintStep__why">
                Ask a question that invites a reply. Engaged commenters are more
                likely to subscribe.
              </p>
            </div>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Pro tip</p>
          <p className="realTalk__text">
            Run this sprint on your top 5 videos. The compounding effect of
            small improvements across multiple videos adds up quickly.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
          Ready to grow your subscribers?
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
          {BRAND.name} connects to your YouTube analytics and shows you exactly
          which videos convert viewers to subscribers and why.
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

// Icon components
function WhatYoullLearnIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ConditionIcon() {
  return (
    <svg
      className="diagnosisFlow__conditionIcon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
