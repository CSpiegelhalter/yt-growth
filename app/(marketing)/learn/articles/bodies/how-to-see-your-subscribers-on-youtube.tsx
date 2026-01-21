/**
 * Body content for How to See Your Subscribers on YouTube article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Quick Answer Opening */}
      <section id="overview" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          Quick Answer
        </h2>
        <p className={s.sectionText}>
          Your exact subscriber count lives in <strong>YouTube Studio</strong>. Open studio.youtube.com (or the YouTube Studio mobile app), and you&apos;ll see the number right on your Dashboard. That count is always accurate and updates within minutes of any change.
        </p>
        <p className={s.sectionText}>
          Can you see <em>who</em> subscribed? Partially. YouTube only reveals subscribers who have set their subscriptions to public. Most people keep theirs private, so your visible subscriber list will typically show a fraction of your actual total. You&apos;ll always know <em>how many</em> subscribers you have—you just won&apos;t see every name.
        </p>
        <p className={s.sectionText}>
          The more useful question is: which videos earn subscriptions? YouTube Studio answers that in the Audience tab, showing you exactly which content converts viewers into subscribers—and that&apos;s the data worth studying.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>The privacy rule:</strong> Subscribers choose whether their subscriptions are public or private. You can only see subscribers who have opted into public visibility. This is why your subscriber list shows fewer people than your total count—and it&apos;s by design, not a bug.
          </p>
        </div>
      </section>

      {/* Mini-Nav */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
          Start Here
        </h2>
        <p className={s.sectionText}>
          Jump to what you need: <a href="#check-count">Check your count (fast)</a> · <a href="#see-who-subscribed">See who subscribed (when possible)</a> · <a href="#analytics">Use subscriber analytics to grow</a>
        </p>
      </section>

      {/* Check Your Count */}
      <section id="check-count" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9M13 17V5M8 17v-3" />
            </svg>
          </span>
          Check Your Count (Fast)
        </h2>
        <p className={s.sectionText}>
          The fastest way to check your subscriber count is through YouTube Studio. On desktop, go to studio.youtube.com and look at your Dashboard—the number is displayed prominently near the top. On mobile, open the YouTube Studio app (not the regular YouTube app) and your count appears on the home screen as soon as you sign in.
        </p>
        <p className={s.sectionText}>
          If you want more detail, the Analytics section breaks down your subscriber changes over time. Here&apos;s the quickest path on desktop:
        </p>
        <ol className={s.numberedList}>
          <li>Go to <strong>studio.youtube.com</strong> and sign in</li>
          <li>Click <strong>Analytics</strong> in the left sidebar</li>
          <li>Select the <strong>Audience</strong> tab</li>
          <li>View subscribers gained, lost, and net change for any date range</li>
        </ol>
        <p className={s.sectionText}>
          The mobile app mirrors this flow—tap Analytics, then Audience. Both give you the same data.
        </p>
        <p className={s.sectionText}>
          One thing to know: if you look at your public channel page (rather than Studio), YouTube rounds your subscriber count once you pass 1,000 subscribers. Studio always shows the exact number; your public page rounds to the nearest thousand, ten thousand, or million depending on your size.
        </p>
      </section>

      {/* See Who Subscribed */}
      <section id="see-who-subscribed" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          See Who Subscribed (When Possible)
        </h2>
        <p className={s.sectionText}>
          To see your subscriber list, open YouTube Studio and navigate to Analytics, then the Audience tab. Scroll down to the &quot;Recent subscribers&quot; card and click &quot;See more&quot; to expand the full list. You&apos;ll see channel names, profile pictures, and subscriber counts of the people who subscribed—but only those with public subscriptions.
        </p>
        <p className={s.sectionText}>
          Why can&apos;t you see everyone? Because YouTube lets users keep their subscriptions private, and most do. When someone subscribes with private settings, they count toward your total but don&apos;t appear in your list. There&apos;s no workaround—this is a privacy feature, not a limitation you can bypass.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>Why your visible list is smaller than your total count:</strong> If you have 10,000 subscribers but only see 200 names, it&apos;s because 9,800 have private subscriptions. This is normal. The list isn&apos;t broken—it&apos;s just showing everyone who has chosen to be visible.
          </p>
        </div>

        <p className={s.sectionText}>
          Even with limited visibility, the subscriber list can still be useful. Recognizing returning commenters, spotting fellow creators in your niche, or noticing when a larger channel subscribes can give you context about who your content resonates with. Just don&apos;t expect a complete picture—it&apos;s a sample, not a census.
        </p>
      </section>

      {/* Subscriber Analytics */}
      <section id="analytics" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          What to Look at Instead (This Is What Actually Helps)
        </h2>
        <p className={s.sectionText}>
          Knowing <em>who</em> subscribed is less valuable than knowing <em>what content</em> earns subscriptions. The Audience tab in YouTube Studio shows you exactly which videos gained (and lost) subscribers—and that data is far more actionable than a list of names.
        </p>
        <p className={s.sectionText}>
          Think of it as a simple loop: find your top subscription-earning videos, figure out why they converted viewers (was it the topic, the hook, the clarity of promise, or the call to action?), then make more content that follows that pattern. This approach compounds over time in a way that chasing individual subscriber names never will.
        </p>
        <p className={s.sectionText}>
          Here are the subscriber signals worth tracking in YouTube Studio:
        </p>
        <ul className={s.list}>
          <li><strong>Subscribers gained per video</strong>—identifies your highest-converting content</li>
          <li><strong>Subscribed vs. not-subscribed viewers</strong>—shows how much of your audience has already committed</li>
          <li><strong>Unsubscribe spikes</strong>—may signal audience mismatch or off-topic content</li>
          <li><strong>Traffic sources for subscribers</strong>—reveals where your best viewers discover you</li>
        </ul>
        <p className={s.sectionText}>
          Pay attention to the patterns. If your tutorial videos consistently earn more subscribers than your vlogs, that&apos;s useful information—even if you never see a single subscriber&apos;s name.
        </p>
      </section>

      {/* Real-Time */}
      <section id="realtime" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          Real-Time Counts and Third-Party Trackers
        </h2>
        <p className={s.sectionText}>
          YouTube Studio is your source of truth for subscriber counts. It updates within minutes and reflects the most accurate number available. If you&apos;re watching a milestone approach, Studio&apos;s Dashboard is where to look.
        </p>
        <p className={s.sectionText}>
          Third-party tools like Social Blade also display subscriber counts and historical trends, which can be useful for comparing channels or viewing long-term growth curves. Just know that these tools pull from YouTube&apos;s public API, which may lag slightly behind Studio&apos;s internal count. For your own channel, trust Studio first. For more on tracking tools, see our <Link href="/learn/youtube-analytics-tools">guide to YouTube analytics tools</Link>.
        </p>
      </section>

      {/* FAQ-Style Micro-Answers */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          Common Questions
        </h2>
        <p className={s.sectionText}>
          <strong>Why can&apos;t I see everyone who subscribed?</strong> YouTube allows subscribers to keep their subscriptions private—and most people do. Your total count includes both public and private subscribers, but your visible list only shows those who have opted into public visibility. There&apos;s no setting you can change on your end to see private subscribers.
        </p>
        <p className={s.sectionText}>
          <strong>Does YouTube notify me when someone subscribes?</strong> Not reliably. You may occasionally see notifications for new subscribers, especially if they have larger channels or public subscriptions, but YouTube doesn&apos;t guarantee real-time alerts for every new subscriber. Don&apos;t count on notifications as a tracking method—check your Studio analytics instead.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Don&apos;t chase the list of names—chase the videos that earn subscriptions.</strong> The subscriber list is incomplete by design. What you <em>can</em> see clearly is which content converts viewers into subscribers, and that&apos;s the data that helps you grow. Ready to put this into practice? Read our <Link href="/learn/how-to-get-more-subscribers">guide to getting more subscribers</Link>.
        </p>
      </div>
    </>
  );
}
