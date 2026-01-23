/**
 * Body content for YouTube Monetization Requirements article.
 * Server component - no "use client" directive.
 *
 * Visual theme: Arcade/carnival motifs (ticket booth, scoreboard, bouncer)
 * plus practical dashboards and progress trackers.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className="sectionOpen">
        <h2 className={s.sectionTitle}>YouTube Monetization Overview</h2>
        <p className={s.sectionText}>
          YouTube monetization means earning money from your videos. The primary
          path is the YouTube Partner Program (YPP), which lets you earn from
          ads shown on your content. Once accepted, you unlock multiple revenue
          streams: ad revenue, channel memberships, Super Chat, and more.
        </p>

        {/* Ticket Booth Visual */}
        <div className="inlineIllustration">
          <TicketBoothVisual />
        </div>

        <p className={s.sectionText}>
          Understanding the requirements is essential for planning your growth.
          Many creators focus only on subscriber counts, but the requirements
          include watch hours or views as well. You need to hit both thresholds
          before you can apply.
        </p>

        {/* Fake Growth Warning - Firm Callout */}
        <div className="warningCallout">
          <div className="warningCallout__icon">
            <NoFakeTicketsStamp />
          </div>
          <div className="warningCallout__content">
            <p className="warningCallout__title">
              Do not shortcut these requirements
            </p>
            <p className="warningCallout__text">
              Buying fake subscribers or views will destroy your channel.
              YouTube detects fake engagement, removes it, and can terminate
              channels that violate their policies. There are no safe shortcuts.
              See our guide on{" "}
              <Link href="/learn/free-youtube-subscribers">
                why fake growth destroys channels
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Requirements Checklist */}
      <section id="requirements-checklist" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          YouTube Partner Program Requirements Checklist
        </h2>
        <p className={s.sectionText}>
          To join YPP and start earning, you must meet all of the following
          requirements. Think of it as three lanes to qualification.
        </p>

        {/* Requirements Scoreboard */}
        <div className="inlineIllustration">
          <RequirementsScoreboard />
        </div>

        {/* Three Route Cards */}
        <div className="requirementRoutes">
          <div className="routeCard">
            <div className="routeCard__header routeCard__header--subs">
              <SubsIcon />
              <span className="routeCard__label">Subscribers</span>
            </div>
            <div className="routeCard__value">1,000</div>
            <p className="routeCard__note">
              Real, engaged followers. Required for all paths.
            </p>
          </div>

          <div className="routeCard">
            <div className="routeCard__header routeCard__header--longform">
              <WatchTimeIcon />
              <span className="routeCard__label">Long-form Route</span>
            </div>
            <div className="routeCard__value">4,000 hours</div>
            <p className="routeCard__note">
              Public watch hours in the last 12 months. Live streams count.
            </p>
          </div>

          <div className="routeCard">
            <div className="routeCard__header routeCard__header--shorts">
              <ShortsIcon />
              <span className="routeCard__label">Shorts Route</span>
            </div>
            <div className="routeCard__value">10M views</div>
            <p className="routeCard__note">
              Public Shorts views in the last 90 days.
            </p>
          </div>
        </div>

        {/* What Counts Split Card */}
        <div className="countsGrid">
          <div className="countsCard countsCard--yes">
            <h4 className="countsCard__title">Counts toward thresholds</h4>
            <ul className="countsCard__list">
              <li>Public videos</li>
              <li>Public live streams</li>
              <li>Public Shorts</li>
            </ul>
          </div>
          <div className="countsCard countsCard--no">
            <h4 className="countsCard__title">Does not count</h4>
            <ul className="countsCard__list">
              <li>Private videos</li>
              <li>Unlisted videos</li>
              <li>Deleted videos</li>
            </ul>
          </div>
        </div>

        {/* Eligibility Bouncer */}
        <h3 className={s.subheading}>Additional Requirements</h3>
        <p className={s.sectionText}>
          Beyond the numbers, you need to pass the eligibility check. Think of
          it as showing your ID at the door.
        </p>

        <div className="inlineIllustration">
          <EligibilityBouncerVisual />
        </div>

        <div className="badgeChips">
          <span className="badgeChip">No active Community Guidelines strikes</span>
          <span className="badgeChip">Two-step verification enabled</span>
          <span className="badgeChip">Access to advanced features</span>
          <span className="badgeChip">Linked AdSense account</span>
          <span className="badgeChip">Live in an eligible country</span>
          <span className="badgeChip">Follow monetization policies</span>
        </div>
      </section>

      {/* Partner Program Benefits */}
      <section id="partner-program" className="sectionOpen">
        <h2 className={s.sectionTitle}>YouTube Partner Program Benefits</h2>
        <p className={s.sectionText}>
          Once accepted into YPP, you gain access to multiple monetization
          features. Here is what is on the menu.
        </p>

        {/* Revenue Menu Visual */}
        <div className="inlineIllustration">
          <RevenueMenuVisual />
        </div>

        <div className="revenueGrid">
          <div className="revenueItem">
            <div className="revenueItem__icon">
              <AdRevenueIcon />
            </div>
            <h4 className="revenueItem__name">Ad Revenue</h4>
            <p className="revenueItem__desc">
              Earn a share of advertising revenue from pre-roll, mid-roll, and
              display ads on your videos. For most creators, this becomes the
              foundation of YouTube income.
            </p>
          </div>

          <div className="revenueItem">
            <div className="revenueItem__icon">
              <PremiumIcon />
            </div>
            <h4 className="revenueItem__name">Premium Revenue</h4>
            <p className="revenueItem__desc">
              Earn a portion when YouTube Premium members watch your content.
              You receive a share based on watch time from Premium viewers.
            </p>
          </div>

          <div className="revenueItem">
            <div className="revenueItem__icon">
              <MembershipsIcon />
            </div>
            <h4 className="revenueItem__name">Channel Memberships</h4>
            <p className="revenueItem__desc">
              Offer paid monthly memberships with perks like custom badges,
              emotes, and exclusive content. Creates predictable recurring
              income.
            </p>
          </div>

          <div className="revenueItem">
            <div className="revenueItem__icon">
              <SupersIcon />
            </div>
            <h4 className="revenueItem__name">Super Chat and Super Thanks</h4>
            <p className="revenueItem__desc">
              Viewers pay to highlight messages during live streams or tip on
              regular videos. Direct fan support without middlemen.
            </p>
          </div>

          <div className="revenueItem">
            <div className="revenueItem__icon">
              <ShoppingIcon />
            </div>
            <h4 className="revenueItem__name">Shopping Features</h4>
            <p className="revenueItem__desc">
              Sell products directly from your videos. Tag products, create
              shelves, and integrate with e-commerce platforms.
            </p>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Reality check</p>
          <p className="realTalk__text">
            Ad revenue is usually the first income stream you will feel, but it
            is rarely enough on its own. Most successful creators combine
            multiple streams.
          </p>
        </div>

        <p className={s.sectionText}>
          For actual earnings numbers and CPM rates, see our guide on{" "}
          <Link href="/learn/how-much-does-youtube-pay">
            how much YouTube pays creators
          </Link>
          .
        </p>
      </section>

      {/* How to Apply */}
      <section id="how-to-apply" className="sectionTinted">
        <h2 className={s.sectionTitle}>How to Apply for YouTube Monetization</h2>
        <p className={s.sectionText}>
          Once you meet all requirements, the application process is
          straightforward. Here is the conveyor belt from start to finish.
        </p>

        {/* Apply Conveyor Visual */}
        <div className="inlineIllustration">
          <ApplyConveyorVisual />
        </div>

        <div className="conveyorSteps">
          <div className="conveyorStation">
            <span className="conveyorStation__num">1</span>
            <h4 className="conveyorStation__title">Open YouTube Studio</h4>
            <p className="conveyorStation__desc">
              Go to studio.youtube.com and sign in.
            </p>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">2</span>
            <h4 className="conveyorStation__title">Click Earn</h4>
            <p className="conveyorStation__desc">
              Find it in the left menu. Shows your eligibility status.
            </p>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">3</span>
            <h4 className="conveyorStation__title">Accept Terms</h4>
            <p className="conveyorStation__desc">
              Review and agree to Partner Program terms and monetization
              policies.
            </p>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">4</span>
            <h4 className="conveyorStation__title">Set Up AdSense</h4>
            <p className="conveyorStation__desc">
              Create or link your AdSense account to receive payments.
            </p>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">5</span>
            <h4 className="conveyorStation__title">Set Preferences</h4>
            <p className="conveyorStation__desc">
              Choose ad formats and monetization settings for your videos.
            </p>
          </div>
          <div className="conveyorStation">
            <span className="conveyorStation__num">6</span>
            <h4 className="conveyorStation__title">Submit for Review</h4>
            <p className="conveyorStation__desc">
              YouTube reviews your channel against their policies.
            </p>
          </div>
        </div>

        {/* Review Waiting Room */}
        <h3 className={s.subheading}>Review Timeline</h3>

        <div className="inlineIllustration">
          <WaitingRoomVisual />
        </div>

        <p className={s.sectionText}>
          YouTube typically reviews applications within 2 to 4 weeks, but busy
          periods can extend this. You will receive an email when your
          application is approved or denied.
        </p>

        {/* Common Denial Reasons - Grid */}
        <h3 className={s.subheading}>Common Denial Reasons</h3>
        <p className={s.sectionText}>
          If denied, YouTube will explain why. Here are the most common issues
          and how to fix them.
        </p>

        <div className="denialGrid">
          <div className="denialCard">
            <h4 className="denialCard__reason">
              Advertiser-unfriendly content
            </h4>
            <p className="denialCard__fix">
              Review your content against YouTube&apos;s advertiser guidelines.
              Remove or edit problematic videos.
            </p>
          </div>
          <div className="denialCard">
            <h4 className="denialCard__reason">Reused content</h4>
            <p className="denialCard__fix">
              Add significant original commentary, editing, or value to
              compilations or reaction content.
            </p>
          </div>
          <div className="denialCard">
            <h4 className="denialCard__reason">Artificially inflated metrics</h4>
            <p className="denialCard__fix">
              Remove any purchased subscribers or views. Wait for organic growth
              to rebuild.
            </p>
          </div>
          <div className="denialCard">
            <h4 className="denialCard__reason">Misleading metadata</h4>
            <p className="denialCard__fix">
              Ensure titles, descriptions, and tags accurately represent your
              content.
            </p>
          </div>
          <div className="denialCard">
            <h4 className="denialCard__reason">Content not suitable for ads</h4>
            <p className="denialCard__fix">
              Shift toward topics and formats that advertisers want to appear
              alongside.
            </p>
          </div>
        </div>
      </section>

      {/* While You Wait */}
      <section id="while-you-wait" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          What to Do While Working Toward Monetization
        </h2>
        <p className={s.sectionText}>
          If you have not reached the thresholds yet, pick your primary
          bottleneck and focus there. Trying to fix everything at once slows
          progress.
        </p>

        {/* Decision Signpost Visual */}
        <div className="inlineIllustration">
          <DecisionSignpostVisual />
        </div>

        <div className="pathCards">
          {/* Path 1: Grow Subscribers */}
          <div className="pathCard">
            <h4 className="pathCard__title">Need more subscribers?</h4>
            <ul className="pathCard__actions">
              <li>Create content that gives viewers a reason to return</li>
              <li>Ask for the subscribe after delivering value, not before</li>
              <li>Stay focused on your niche so viewers know what to expect</li>
            </ul>
            <Link href="/learn/how-to-get-more-subscribers" className="pathCard__link">
              Read the subscriber growth guide
            </Link>
          </div>

          {/* Path 2: Build Watch Hours */}
          <div className="pathCard">
            <h4 className="pathCard__title">Need more watch hours?</h4>
            <ul className="pathCard__actions">
              <li>Improve retention so viewers watch longer per video</li>
              <li>Create longer videos when the content supports it</li>
              <li>Focus on evergreen topics that accumulate views over time</li>
            </ul>
            <Link href="/learn/youtube-retention-analysis" className="pathCard__link">
              Read the retention analysis guide
            </Link>
          </div>

          {/* Path 3: Build Shorts Views */}
          <div className="pathCard">
            <h4 className="pathCard__title">Need more Shorts views?</h4>
            <ul className="pathCard__actions">
              <li>Post Shorts consistently, several times per week</li>
              <li>Hook viewers in the first second with movement or questions</li>
              <li>Repurpose highlights from your best long-form content</li>
            </ul>
          </div>
        </div>

        {/* Earn Before YPP Card */}
        <div className="earnEarlyCard">
          <h4 className="earnEarlyCard__title">Earn before YPP</h4>
          <p className="earnEarlyCard__text">
            You do not need YPP to start earning. Affiliate marketing and
            digital products work from day one. Build these revenue streams
            while you grow toward the thresholds.
          </p>
          <a href="#affiliate-basics" className="earnEarlyCard__link">
            Jump to affiliate basics
          </a>
        </div>
      </section>

      {/* Revenue Streams */}
      <section id="revenue-streams" className="sectionTinted">
        <h2 className={s.sectionTitle}>Revenue Streams Explained</h2>
        <p className={s.sectionText}>
          A diversified income protects you from algorithm changes and ad rate
          fluctuations. Think of it like a table with multiple legs.
        </p>

        {/* Diversification Table Visual */}
        <div className="inlineIllustration">
          <DiversificationTableVisual />
        </div>

        <div className="streamGrid">
          <div className="streamCard">
            <h4 className="streamCard__title">Ad Revenue</h4>
            <p className="streamCard__desc">
              YouTube takes roughly 45%, you keep 55%. CPM varies widely from $1
              to $30+ depending on niche, audience location, and seasonality.
              Finance and business niches pay more than entertainment.
            </p>
          </div>

          <div className="streamCard">
            <h4 className="streamCard__title">Sponsorships</h4>
            <p className="streamCard__desc">
              Brands pay you directly to promote products in your videos. Does
              not require YPP. Rates typically range from $10 to $50 per 1,000
              views, but vary based on niche and engagement.
            </p>
          </div>

          <div className="streamCard">
            <h4 className="streamCard__title">Affiliate Marketing</h4>
            <p className="streamCard__desc">
              Earn commission when viewers buy through your links. Works well
              for review channels and tutorials. Common programs include Amazon
              Associates and brand-specific programs.
            </p>
          </div>

          <div className="streamCard">
            <h4 className="streamCard__title">Digital Products</h4>
            <p className="streamCard__desc">
              Sell courses, ebooks, templates, presets, or coaching based on
              your expertise. Often generates more revenue per customer than ads
              or affiliates.
            </p>
          </div>

          <div className="streamCard">
            <h4 className="streamCard__title">Merchandise</h4>
            <p className="streamCard__desc">
              Sell branded items to your audience. Print-on-demand services make
              this accessible without inventory. Works best for creators with
              strong brand identity.
            </p>
          </div>

          <div className="streamCard">
            <h4 className="streamCard__title">Services</h4>
            <p className="streamCard__desc">
              Consulting, coaching, freelance work, or community memberships.
              Your channel becomes a lead generation engine for higher-ticket
              offerings.
            </p>
          </div>
        </div>
      </section>

      {/* Affiliate Basics */}
      <section id="affiliate-basics" className="sectionOpen">
        <h2 className={s.sectionTitle}>Affiliate Marketing Basics for Creators</h2>
        <p className={s.sectionText}>
          Affiliate marketing lets you earn money before reaching YPP
          thresholds. Here is how it works.
        </p>

        {/* Assembly Line Visual */}
        <div className="inlineIllustration">
          <AffiliateAssemblyLineVisual />
        </div>

        <div className="assemblySteps">
          <div className="assemblyStep">
            <span className="assemblyStep__num">1</span>
            <div className="assemblyStep__content">
              <h4 className="assemblyStep__title">Join programs</h4>
              <p className="assemblyStep__desc">
                Sign up for programs related to your niche. Amazon Associates is
                common, but brand-specific programs often pay higher commissions.
              </p>
            </div>
          </div>
          <div className="assemblyStep">
            <span className="assemblyStep__num">2</span>
            <div className="assemblyStep__content">
              <h4 className="assemblyStep__title">Get unique links</h4>
              <p className="assemblyStep__desc">
                Each program provides tracking links that credit sales to your
                account.
              </p>
            </div>
          </div>
          <div className="assemblyStep">
            <span className="assemblyStep__num">3</span>
            <div className="assemblyStep__content">
              <h4 className="assemblyStep__title">Mention naturally</h4>
              <p className="assemblyStep__desc">
                Recommend products you actually use. Forced recommendations hurt
                trust.
              </p>
            </div>
          </div>
          <div className="assemblyStep">
            <span className="assemblyStep__num">4</span>
            <div className="assemblyStep__content">
              <h4 className="assemblyStep__title">Disclose clearly</h4>
              <p className="assemblyStep__desc">
                Legal requirement. Include disclosure in description and mention
                verbally.
              </p>
            </div>
          </div>
          <div className="assemblyStep">
            <span className="assemblyStep__num">5</span>
            <div className="assemblyStep__content">
              <h4 className="assemblyStep__title">Place strategically</h4>
              <p className="assemblyStep__desc">
                Links in the first line of description get more clicks. Mention
                them in video.
              </p>
            </div>
          </div>
          <div className="assemblyStep">
            <span className="assemblyStep__num">6</span>
            <div className="assemblyStep__content">
              <h4 className="assemblyStep__title">Track results</h4>
              <p className="assemblyStep__desc">
                Review your dashboard to see which products and videos convert.
              </p>
            </div>
          </div>
        </div>

        {/* Disclosure Callout */}
        <div className="disclosureCallout">
          <h4 className="disclosureCallout__title">Disclosure is required</h4>
          <p className="disclosureCallout__text">
            In the US, the FTC requires clear disclosure. In your description,
            include something like: &ldquo;Some links above are affiliate links.
            I may earn a commission if you purchase through them, at no extra
            cost to you.&rdquo;
          </p>
        </div>

        {/* Best Practices - Principle Cards */}
        <h3 className={s.subheading}>Best Practices</h3>
        <div className="principleCards">
          <div className="principleCard">
            <h4 className="principleCard__title">Recommend genuinely</h4>
            <p className="principleCard__desc">
              Only recommend products you would recommend without the commission.
            </p>
          </div>
          <div className="principleCard">
            <h4 className="principleCard__title">Be honest about limits</h4>
            <p className="principleCard__desc">
              Mention downsides and alternatives. Honesty builds long-term trust.
            </p>
          </div>
          <div className="principleCard">
            <h4 className="principleCard__title">Create helpful content</h4>
            <p className="principleCard__desc">
              The video should be valuable even if nobody clicks. Sales pitches
              fail.
            </p>
          </div>
          <div className="principleCard">
            <h4 className="principleCard__title">Optimize over time</h4>
            <p className="principleCard__desc">
              Track which products and placements convert, then do more of that.
            </p>
          </div>
        </div>
      </section>

      {/* Realistic Expectations */}
      <section id="realistic-expectations" className="sectionTinted">
        <h2 className={s.sectionTitle}>Realistic Monetization Expectations</h2>
        <p className={s.sectionText}>
          Setting realistic expectations helps you stay motivated and make smart
          decisions about your channel.
        </p>

        {/* Expectation Reality Check Visual */}
        <div className="inlineIllustration">
          <ExpectationRealityCheckVisual />
        </div>

        <div className="expectationCards">
          <div className="expectationCard">
            <h4 className="expectationCard__title">Early earnings are modest</h4>
            <p className="expectationCard__desc">
              Most channels earn $50 to $200 per month in their first year of
              monetization. Reaching 1,000 subscribers and 4,000 watch hours is
              an accomplishment, but it is just the starting line. Do not quit
              your job based on early YouTube earnings.
            </p>
          </div>

          <div className="expectationCard">
            <h4 className="expectationCard__title">Diversification is essential</h4>
            <p className="expectationCard__desc">
              Successful full-time creators typically earn 30-50% from ads, with
              sponsorships, affiliates, and products making up the rest. Relying
              solely on ad revenue requires very high view counts.
            </p>
          </div>

          <div className="expectationCard">
            <h4 className="expectationCard__title">Niche affects earnings</h4>
            <p className="expectationCard__desc">
              Finance and business channels can earn 5x to 10x more per view
              than gaming or entertainment. Advertisers pay more to reach
              certain demographics. Consider this, but do not choose a niche
              only for money.
            </p>
          </div>

          <div className="expectationCard">
            <h4 className="expectationCard__title">Growth takes years</h4>
            <p className="expectationCard__desc">
              Building sustainable income typically takes 2 to 5 years of
              consistent effort. Treat early years as investment in learning and
              audience building. The compounding effect takes time.
            </p>
          </div>

          <div className="expectationCard">
            <h4 className="expectationCard__title">Consistency compounds</h4>
            <p className="expectationCard__desc">
              A channel posting weekly for two years will almost always
              outperform one posting randomly. Regular uploads train both your
              audience and the algorithm to expect your content.
            </p>
          </div>
        </div>

        {/* Timeline Ladder Visual */}
        <div className="inlineIllustration">
          <TimelineLadderVisual />
        </div>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className="sectionOpen">
        <h2 className={s.sectionTitle}>Monetization Mistakes to Avoid</h2>
        <p className={s.sectionText}>
          Welcome to the Mistakes Museum. Each exhibit represents a common
          monetization mistake and how to avoid it.
        </p>

        {/* Mistakes Museum Visual */}
        <div className="inlineIllustration">
          <MistakesMuseumVisual />
        </div>

        <div className="museumGrid">
          <div className="museumCard">
            <h4 className="museumCard__title">Buying Fake Engagement</h4>
            <p className="museumCard__desc">
              The most damaging mistake. Fake engagement tanks your metrics,
              making YouTube show your content to fewer people. Even if not
              terminated, your channel becomes harder to grow.
            </p>
            <p className="museumCard__fix">
              <strong>Fix:</strong> Accept that there are no shortcuts. Organic
              growth is the only path.
            </p>
          </div>

          <div className="museumCard">
            <h4 className="museumCard__title">Focusing Only on Ad Revenue</h4>
            <p className="museumCard__desc">
              Putting all your eggs in one basket. Algorithm changes or ad rate
              fluctuations can cut your income overnight.
            </p>
            <p className="museumCard__fix">
              <strong>Fix:</strong> Build multiple revenue streams from day one.
              Affiliates, products, sponsorships.
            </p>
          </div>

          <div className="museumCard">
            <h4 className="museumCard__title">Ignoring Community Guidelines</h4>
            <p className="museumCard__desc">
              Community Guidelines strikes delay monetization and can disable
              features. Three strikes terminate your channel.
            </p>
            <p className="museumCard__fix">
              <strong>Fix:</strong> Learn the guidelines before you need to.
              Review your content against them.
            </p>
          </div>

          <div className="museumCard">
            <h4 className="museumCard__title">Rushing Low-Quality Content</h4>
            <p className="museumCard__desc">
              Posting lots of mediocre content to hit thresholds faster
              backfires. Poor retention signals to YouTube that your channel is
              not worth promoting.
            </p>
            <p className="museumCard__fix">
              <strong>Fix:</strong> Quality over quantity. Fewer better videos
              beat many bad ones.
            </p>
          </div>

          <div className="museumCard">
            <h4 className="museumCard__title">Not Disclosing Sponsorships</h4>
            <p className="museumCard__desc">
              Illegal in many countries and violates YouTube policies. Damages
              trust with your audience when discovered.
            </p>
            <p className="museumCard__fix">
              <strong>Fix:</strong> Always clearly disclose paid partnerships.
              Use YouTube&apos;s built-in disclosure feature.
            </p>
          </div>

          <div className="museumCard">
            <h4 className="museumCard__title">Expecting Immediate Income</h4>
            <p className="museumCard__desc">
              Monetization is a milestone, not a finish line. Early ad revenue
              is usually modest. Disappointment leads to quitting.
            </p>
            <p className="museumCard__fix">
              <strong>Fix:</strong> Set realistic expectations. Focus on
              building, not earning, in year one.
            </p>
          </div>
        </div>
      </section>

      {/* Tracking Progress */}
      <section id="tracking-progress" className="sectionTinted">
        <h2 className={s.sectionTitle}>Tracking Your Progress</h2>
        <p className={s.sectionText}>
          YouTube Studio shows your progress toward monetization thresholds.
          Here is where to find it and how to interpret the numbers.
        </p>

        {/* Click Path */}
        <div className="clickPath">
          <span className="clickPath__step">YouTube Studio</span>
          <span className="clickPath__arrow">→</span>
          <span className="clickPath__step">Earn</span>
          <span className="clickPath__arrow">→</span>
          <span className="clickPath__step">Progress</span>
        </div>

        {/* Progress Thermometer Visual */}
        <div className="inlineIllustration">
          <ProgressThermometerVisual />
        </div>

        <h3 className={s.subheading}>Understanding Watch Hours</h3>
        <p className={s.sectionText}>
          Watch hours are counted on a rolling 12-month window. This means hours
          from videos published years ago still count, as long as the watching
          happened in the last 12 months. However, watch time from more than 12
          months ago falls off.
        </p>

        {/* Rolling Window Visual */}
        <div className="inlineIllustration">
          <RollingWindowVisual />
        </div>

        <h3 className={s.subheading}>Projecting Your Timeline</h3>
        <p className={s.sectionText}>
          Calculate your average monthly watch hours and subscribers gained.
          Divide the remaining threshold by your monthly rate to estimate when
          you will qualify. This helps you set realistic expectations and
          identify if you need to change strategy.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Track your path to monetization.</strong> {BRAND.name} shows
          you which videos drive subscribers and watch time, helping you reach
          thresholds faster with data you can act on.
        </p>
      </div>
    </>
  );
}

/* ================================================
   SVG VISUAL COMPONENTS
   ================================================ */

function TicketBoothVisual() {
  return (
    <svg
      width="320"
      height="200"
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Booth structure */}
      <rect x="80" y="40" width="160" height="140" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="80" y="40" width="160" height="35" rx="8" fill="#6366f1" />
      <rect x="80" y="67" width="160" height="8" fill="#6366f1" />
      
      {/* Booth sign */}
      <text x="160" y="63" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">YPP TICKETS</text>
      
      {/* Window */}
      <rect x="110" y="90" width="100" height="60" rx="4" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="2" />
      
      {/* Ticket dispenser slot */}
      <rect x="130" y="160" width="60" height="10" rx="2" fill="#1e293b" />
      
      {/* Ticket coming out */}
      <rect x="140" y="152" width="40" height="20" rx="2" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      <text x="160" y="165" textAnchor="middle" fontSize="6" fill="#92400e">YPP</text>
      
      {/* Attendant in window - simple */}
      <circle cx="160" cy="115" r="15" fill="#fef3c7" />
      <circle cx="155" cy="112" r="2" fill="#1e293b" />
      <circle cx="165" cy="112" r="2" fill="#1e293b" />
      <path d="M155 122 Q160 126 165 122" stroke="#1e293b" strokeWidth="1.5" fill="none" />
      
      {/* Requirement sign on booth */}
      <rect x="90" y="95" width="15" height="50" fill="#f1f5f9" stroke="#e2e8f0" rx="2" />
      <text x="97" y="108" textAnchor="middle" fontSize="5" fill="#64748b">1K</text>
      <text x="97" y="118" textAnchor="middle" fontSize="5" fill="#64748b">4K</text>
      <text x="97" y="128" textAnchor="middle" fontSize="5" fill="#64748b">hrs</text>
    </svg>
  );
}

function NoFakeTicketsStamp() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" fill="none" stroke="#dc2626" strokeWidth="3" />
      <line x1="10" y1="10" x2="38" y2="38" stroke="#dc2626" strokeWidth="3" />
      <text x="24" y="22" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#dc2626">FAKE</text>
      <text x="24" y="30" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#dc2626">TICKETS</text>
    </svg>
  );
}

function RequirementsScoreboard() {
  return (
    <svg
      width="340"
      height="140"
      viewBox="0 0 340 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Requirements scoreboard showing 1000 subscribers, 4000 watch hours, or 10M Shorts views"
    >
      <title>YPP Requirements Scoreboard</title>
      {/* Scoreboard background */}
      <rect x="10" y="10" width="320" height="120" rx="8" fill="#0f172a" />
      <rect x="10" y="10" width="320" height="30" rx="8" fill="#1e293b" />
      <rect x="10" y="32" width="320" height="8" fill="#1e293b" />
      
      {/* Header */}
      <text x="170" y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#94a3b8">YPP REQUIREMENTS</text>
      
      {/* Three lanes */}
      {/* Lane 1: Subscribers */}
      <rect x="25" y="50" width="90" height="65" rx="4" fill="#1e293b" />
      <text x="70" y="68" textAnchor="middle" fontSize="8" fill="#64748b">SUBSCRIBERS</text>
      <text x="70" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#22c55e">1,000</text>
      
      {/* Lane 2: Watch Hours */}
      <rect x="125" y="50" width="90" height="65" rx="4" fill="#1e293b" />
      <text x="170" y="68" textAnchor="middle" fontSize="8" fill="#64748b">WATCH HOURS</text>
      <text x="170" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#8b5cf6">4,000</text>
      <text x="170" y="108" textAnchor="middle" fontSize="7" fill="#64748b">/12 months</text>
      
      {/* Lane 3: Shorts Views */}
      <rect x="225" y="50" width="90" height="65" rx="4" fill="#1e293b" />
      <text x="270" y="68" textAnchor="middle" fontSize="8" fill="#64748b">SHORTS VIEWS</text>
      <text x="270" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#f97316">10M</text>
      <text x="270" y="108" textAnchor="middle" fontSize="7" fill="#64748b">/90 days</text>
      
      {/* OR indicator */}
      <text x="117" y="85" textAnchor="middle" fontSize="10" fill="#475569">+</text>
      <text x="220" y="85" textAnchor="middle" fontSize="10" fill="#475569">or</text>
      
      {/* Public only stamp */}
      <rect x="275" y="115" width="50" height="12" rx="2" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      <text x="300" y="124" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#92400e">PUBLIC</text>
    </svg>
  );
}

function EligibilityBouncerVisual() {
  return (
    <svg
      width="280"
      height="200"
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Brick wall background */}
      <rect x="0" y="0" width="280" height="200" fill="#78716c" rx="8" />
      {/* Brick pattern */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
        <g key={row}>
          {[0, 1, 2, 3, 4].map((col) => (
            <rect 
              key={col} 
              x={row % 2 === 0 ? col * 56 : col * 56 - 28} 
              y={row * 25} 
              width="54" 
              height="23" 
              fill="#92400e" 
              stroke="#78716c" 
              strokeWidth="2" 
              rx="1"
            />
          ))}
        </g>
      ))}
      
      {/* Door frame - golden/brass */}
      <rect x="170" y="25" width="100" height="165" fill="#b45309" rx="4" />
      <rect x="178" y="33" width="84" height="149" fill="#1e293b" rx="2" />
      {/* Door glow - YPP inside */}
      <rect x="186" y="41" width="68" height="133" fill="#22c55e" opacity="0.15" rx="2" />
      <text x="220" y="100" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#22c55e">YPP</text>
      <text x="220" y="116" textAnchor="middle" fontSize="9" fill="#4ade80">MEMBERS</text>
      <text x="220" y="128" textAnchor="middle" fontSize="9" fill="#4ade80">ONLY</text>
      {/* Door handle */}
      <circle cx="248" cy="110" r="6" fill="#fbbf24" />
      
      {/* Velvet rope stanchions */}
      <rect x="135" y="130" width="8" height="60" fill="#fbbf24" />
      <circle cx="139" cy="130" r="10" fill="#fbbf24" />
      <rect x="5" y="130" width="8" height="60" fill="#fbbf24" />
      <circle cx="9" cy="130" r="10" fill="#fbbf24" />
      {/* Velvet rope */}
      <path d="M9 135 Q72 115 139 135" stroke="#dc2626" strokeWidth="8" fill="none" />
      
      {/* Bouncer - angry, imposing */}
      {/* Shadow on ground */}
      <ellipse cx="80" cy="185" rx="45" ry="8" fill="#44403c" opacity="0.4" />
      
      {/* Legs */}
      <rect x="55" y="145" width="22" height="45" fill="#1e293b" rx="3" />
      <rect x="83" y="145" width="22" height="45" fill="#1e293b" rx="3" />
      {/* Shoes */}
      <ellipse cx="66" cy="188" rx="14" ry="6" fill="#0f172a" />
      <ellipse cx="94" cy="188" rx="14" ry="6" fill="#0f172a" />
      
      {/* Body - black tight shirt */}
      <path d="M45 80 L45 150 L115 150 L115 80 Q115 60 80 60 Q45 60 45 80" fill="#0f172a" />
      {/* Chest muscles hint */}
      <path d="M60 90 Q80 100 100 90" stroke="#1e293b" strokeWidth="2" fill="none" />
      
      {/* Upper arms - coming from shoulders */}
      <ellipse cx="42" cy="95" rx="12" ry="18" fill="#d4a574" />
      <ellipse cx="118" cy="95" rx="12" ry="18" fill="#d4a574" />
      
      {/* Forearms crossed in front - left arm on top */}
      {/* Right forearm (goes behind) */}
      <path d="M118 105 Q100 115 75 120 L75 132 Q100 127 120 117 Z" fill="#c4956a" />
      {/* Left forearm (goes on top) */}
      <path d="M42 105 Q60 115 85 120 L85 132 Q60 127 40 117 Z" fill="#d4a574" />
      
      {/* Right fist (behind) */}
      <g transform="translate(68, 118)">
        <ellipse cx="0" cy="0" rx="9" ry="7" fill="#c4956a" />
        {/* Knuckle lines */}
        <line x1="-5" y1="-2" x2="-5" y2="3" stroke="#a3846a" strokeWidth="1" />
        <line x1="-1" y1="-3" x2="-1" y2="3" stroke="#a3846a" strokeWidth="1" />
        <line x1="3" y1="-3" x2="3" y2="3" stroke="#a3846a" strokeWidth="1" />
        {/* Thumb */}
        <ellipse cx="7" cy="3" rx="4" ry="3" fill="#c4956a" />
      </g>
      
      {/* Left fist (on top) */}
      <g transform="translate(92, 118)">
        <ellipse cx="0" cy="0" rx="9" ry="7" fill="#d4a574" />
        {/* Knuckle lines */}
        <line x1="-4" y1="-3" x2="-4" y2="3" stroke="#b8956e" strokeWidth="1" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="#b8956e" strokeWidth="1" />
        <line x1="4" y1="-2" x2="4" y2="3" stroke="#b8956e" strokeWidth="1" />
        {/* Thumb */}
        <ellipse cx="-7" cy="3" rx="4" ry="3" fill="#d4a574" />
      </g>
      
      {/* Neck - thick */}
      <rect x="68" y="48" width="24" height="18" fill="#d4a574" />
      
      {/* Head */}
      <ellipse cx="80" cy="35" rx="26" ry="28" fill="#d4a574" />
      
      {/* Buzz cut hair */}
      <ellipse cx="80" cy="18" rx="22" ry="12" fill="#44403c" />
      
      {/* Angry eyebrows - deeply furrowed, angled down */}
      <path d="M56 26 L70 31" stroke="#44403c" strokeWidth="5" strokeLinecap="round" />
      <path d="M90 31 L104 26" stroke="#44403c" strokeWidth="5" strokeLinecap="round" />
      
      {/* Sunglasses */}
      {/* Bridge */}
      <rect x="73" y="34" width="14" height="4" rx="2" fill="#0f172a" />
      {/* Left lens */}
      <rect x="54" y="32" width="20" height="12" rx="3" fill="#0f172a" />
      <rect x="56" y="34" width="16" height="8" rx="2" fill="#1e293b" />
      {/* Right lens */}
      <rect x="86" y="32" width="20" height="12" rx="3" fill="#0f172a" />
      <rect x="88" y="34" width="16" height="8" rx="2" fill="#1e293b" />
      {/* Arms of glasses */}
      <line x1="54" y1="36" x2="48" y2="38" stroke="#0f172a" strokeWidth="3" />
      <line x1="106" y1="36" x2="112" y2="38" stroke="#0f172a" strokeWidth="3" />
      
      {/* Nose - wide, flared */}
      <path d="M80 44 L76 52 L84 52 Z" fill="#b8956e" />
      <circle cx="76" cy="51" r="2" fill="#a3846a" />
      <circle cx="84" cy="51" r="2" fill="#a3846a" />
      
      {/* Mouth - tight angry frown */}
      <path d="M70 58 Q80 54 90 58" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
      
      {/* Jaw - square, clenched */}
      <path d="M54 45 Q54 62 80 66 Q106 62 106 45" stroke="#b8956e" strokeWidth="2" fill="none" />
      
      {/* Scar on cheek */}
      <line x1="98" y1="48" x2="104" y2="56" stroke="#a3846a" strokeWidth="2" />
      
      {/* Earpiece */}
      <rect x="108" y="38" width="4" height="10" rx="2" fill="#1e293b" />
      <path d="M110 48 L112 62" stroke="#1e293b" strokeWidth="2" />
    </svg>
  );
}

function RevenueMenuVisual() {
  return (
    <svg
      width="300"
      height="180"
      viewBox="0 0 300 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Menu board background */}
      <rect x="20" y="10" width="260" height="160" rx="8" fill="#292524" />
      
      {/* Decorative border */}
      <rect x="30" y="20" width="240" height="140" rx="4" fill="none" stroke="#78716c" strokeWidth="1" strokeDasharray="4" />
      
      {/* Menu header */}
      <text x="150" y="45" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fef3c7">REVENUE MENU</text>
      <line x1="60" y1="55" x2="240" y2="55" stroke="#78716c" strokeWidth="1" />
      
      {/* Menu items - left column */}
      <text x="50" y="75" fontSize="10" fill="#d6d3d1">Ads</text>
      <text x="50" y="95" fontSize="10" fill="#d6d3d1">Premium</text>
      <text x="50" y="115" fontSize="10" fill="#d6d3d1">Memberships</text>
      
      {/* Menu items - right column */}
      <text x="160" y="75" fontSize="10" fill="#d6d3d1">Super Chat</text>
      <text x="160" y="95" fontSize="10" fill="#d6d3d1">Super Thanks</text>
      <text x="160" y="115" fontSize="10" fill="#d6d3d1">Shopping</text>
      
      {/* Decorative dots */}
      <circle cx="45" cy="72" r="2" fill="#22c55e" />
      <circle cx="45" cy="92" r="2" fill="#8b5cf6" />
      <circle cx="45" cy="112" r="2" fill="#f97316" />
      <circle cx="155" cy="72" r="2" fill="#ec4899" />
      <circle cx="155" cy="92" r="2" fill="#06b6d4" />
      <circle cx="155" cy="112" r="2" fill="#eab308" />
      
      {/* Bottom tagline */}
      <text x="150" y="145" textAnchor="middle" fontSize="8" fill="#78716c">Served fresh with every view</text>
    </svg>
  );
}

function ApplyConveyorVisual() {
  return (
    <svg
      width="340"
      height="160"
      viewBox="0 0 340 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Staircase leading up to YPP door */}
      {/* Background */}
      <rect x="0" y="0" width="340" height="160" fill="#f8fafc" rx="8" />
      
      {/* Steps - ascending from left to right */}
      <rect x="20" y="130" width="45" height="20" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1" />
      <rect x="65" y="110" width="45" height="40" fill="#c7d2fe" stroke="#a5b4fc" strokeWidth="1" />
      <rect x="110" y="90" width="45" height="60" fill="#a5b4fc" stroke="#818cf8" strokeWidth="1" />
      <rect x="155" y="70" width="45" height="80" fill="#818cf8" stroke="#6366f1" strokeWidth="1" />
      <rect x="200" y="50" width="45" height="100" fill="#6366f1" stroke="#4f46e5" strokeWidth="1" />
      
      {/* Step labels */}
      <text x="42" y="145" textAnchor="middle" fontSize="8" fontWeight="600" fill="#4f46e5">Studio</text>
      <text x="87" y="125" textAnchor="middle" fontSize="8" fontWeight="600" fill="#4338ca">Earn</text>
      <text x="132" y="105" textAnchor="middle" fontSize="8" fontWeight="600" fill="#3730a3">Terms</text>
      <text x="177" y="85" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">AdSense</text>
      <text x="222" y="65" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">Submit</text>
      
      {/* Door at the top */}
      <rect x="255" y="20" width="70" height="100" fill="#1e293b" rx="4" />
      <rect x="262" y="27" width="56" height="86" fill="#334155" rx="2" />
      {/* Door window */}
      <rect x="275" y="35" width="30" height="25" fill="#22c55e" opacity="0.3" rx="2" />
      <text x="290" y="50" textAnchor="middle" fontSize="7" fill="#22c55e">YPP</text>
      {/* Door handle */}
      <circle cx="310" cy="75" r="4" fill="#fbbf24" />
      {/* Welcome mat */}
      <rect x="260" y="120" width="60" height="12" fill="#22c55e" rx="2" />
      <text x="290" y="129" textAnchor="middle" fontSize="6" fill="white">WELCOME</text>
      
      {/* Person climbing (simple figure on step 3) */}
      <circle cx="140" cy="72" r="8" fill="#fef3c7" />
      <rect x="135" y="80" width="10" height="15" rx="2" fill="#6366f1" />
      {/* Arm reaching up */}
      <line x1="145" y1="82" x2="155" y2="75" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
      
      {/* Small flag at top */}
      <line x1="315" y1="15" x2="315" y2="35" stroke="#64748b" strokeWidth="2" />
      <path d="M315 15 L330 20 L315 25 Z" fill="#22c55e" />
    </svg>
  );
}

function WaitingRoomVisual() {
  return (
    <svg
      width="320"
      height="120"
      viewBox="0 0 320 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Floor */}
      <rect x="10" y="90" width="300" height="20" fill="#f1f5f9" />
      
      {/* Chairs with week labels */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${30 + i * 75}, 0)`}>
          {/* Chair back */}
          <rect x="0" y="35" width="50" height="35" rx="4" fill={i < 2 ? "#e0e7ff" : "#f1f5f9"} stroke="#c7d2fe" strokeWidth="1" />
          {/* Chair seat */}
          <rect x="0" y="70" width="50" height="10" rx="2" fill={i < 2 ? "#c7d2fe" : "#e2e8f0"} />
          {/* Chair legs */}
          <rect x="5" y="80" width="4" height="10" fill="#94a3b8" />
          <rect x="41" y="80" width="4" height="10" fill="#94a3b8" />
          {/* Week label */}
          <text x="25" y="55" textAnchor="middle" fontSize="9" fill={i < 2 ? "#4f46e5" : "#94a3b8"}>Week {i + 1}</text>
        </g>
      ))}
      
      {/* Person sitting (week 1) */}
      <circle cx="55" cy="30" r="10" fill="#fef3c7" />
      <rect x="45" y="42" width="20" height="28" rx="4" fill="#6366f1" />
      
      {/* Clock on wall */}
      <circle cx="290" cy="30" r="15" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <line x1="290" y1="30" x2="290" y2="20" stroke="#1e293b" strokeWidth="2" />
      <line x1="290" y1="30" x2="298" y2="30" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  );
}

function DecisionSignpostVisual() {
  return (
    <svg
      width="280"
      height="180"
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Post */}
      <rect x="135" y="60" width="10" height="110" fill="#78716c" />
      
      {/* Ground */}
      <ellipse cx="140" cy="170" rx="30" ry="8" fill="#d6d3d1" />
      
      {/* Signs pointing different directions */}
      {/* Sign 1 - Subscribers - pointing left */}
      <path d="M50 40 L140 40 L140 60 L50 60 L35 50 Z" fill="#22c55e" />
      <text x="90" y="54" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">MORE SUBS</text>
      
      {/* Sign 2 - Watch time - pointing right */}
      <path d="M145 70 L230 70 L245 85 L230 100 L145 100 Z" fill="#8b5cf6" />
      <text x="190" y="89" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">WATCH TIME</text>
      
      {/* Sign 3 - Shorts - pointing left */}
      <path d="M50 110 L140 110 L140 130 L50 130 L35 120 Z" fill="#f97316" />
      <text x="90" y="124" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">SHORTS VIEWS</text>
      
      {/* Sign 4 - Earn early - pointing right and down */}
      <path d="M145 135 L210 135 L220 145 L210 155 L145 155 Z" fill="#06b6d4" />
      <text x="180" y="149" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">EARN EARLY</text>
    </svg>
  );
}

function DiversificationTableVisual() {
  return (
    <svg
      width="320"
      height="200"
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Multiple streams flowing into a pool */}
      {/* Background */}
      <rect x="0" y="0" width="320" height="200" fill="#f0fdf4" rx="8" />
      
      {/* Central pool/lake at bottom */}
      <ellipse cx="160" cy="168" rx="95" ry="25" fill="#22c55e" opacity="0.15" />
      <ellipse cx="160" cy="163" rx="85" ry="20" fill="#22c55e" opacity="0.25" />
      <ellipse cx="160" cy="158" rx="75" ry="15" fill="#22c55e" opacity="0.4" />
      <text x="160" y="163" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#166534">YOUR INCOME</text>
      
      {/* Stream 1 - Ads (leftmost) */}
      <path d="M30 40 Q35 75 55 95 Q80 115 95 145" stroke="#6366f1" strokeWidth="10" fill="none" opacity="0.6" />
      <circle cx="30" cy="32" r="16" fill="#6366f1" />
      <text x="30" y="36" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">Ads</text>
      
      {/* Stream 2 - Sponsors */}
      <path d="M85 45 Q95 80 115 100 Q135 120 135 145" stroke="#8b5cf6" strokeWidth="10" fill="none" opacity="0.6" />
      <circle cx="85" cy="37" r="16" fill="#8b5cf6" />
      <text x="85" y="41" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Sponsors</text>
      
      {/* Stream 3 - Affiliate (center-left) */}
      <path d="M135 45 Q140 80 150 105 Q155 125 155 145" stroke="#a855f7" strokeWidth="10" fill="none" opacity="0.6" />
      <circle cx="135" cy="32" r="16" fill="#a855f7" />
      <text x="135" y="36" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Affiliate</text>
      
      {/* Stream 4 - Products (center-right) */}
      <path d="M185 45 Q180 80 170 105 Q165 125 165 145" stroke="#c026d3" strokeWidth="10" fill="none" opacity="0.6" />
      <circle cx="185" cy="32" r="16" fill="#c026d3" />
      <text x="185" y="36" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Products</text>
      
      {/* Stream 5 - Merch */}
      <path d="M235 45 Q225 80 205 100 Q185 120 185 145" stroke="#db2777" strokeWidth="10" fill="none" opacity="0.6" />
      <circle cx="235" cy="37" r="16" fill="#db2777" />
      <text x="235" y="41" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">Merch</text>
      
      {/* Stream 6 - Services (rightmost) */}
      <path d="M290 40 Q285 75 265 95 Q240 115 225 145" stroke="#ec4899" strokeWidth="10" fill="none" opacity="0.6" />
      <circle cx="290" cy="32" r="16" fill="#ec4899" />
      <text x="290" y="36" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">Services</text>
      
      {/* "Multiple streams" annotation */}
      <text x="160" y="192" textAnchor="middle" fontSize="9" fill="#64748b">Multiple streams = stability</text>
    </svg>
  );
}

function AffiliateAssemblyLineVisual() {
  return (
    <svg
      width="340"
      height="180"
      viewBox="0 0 340 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Clean horizontal flow - product recommendation to commission */}
      {/* Background */}
      <rect x="0" y="0" width="340" height="180" fill="#faf5ff" rx="8" />
      
      {/* Title */}
      <text x="170" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#7c3aed">How Affiliate Marketing Works</text>
      
      {/* Flow path - dotted line connecting all steps */}
      <path d="M45 70 L295 70" stroke="#e9d5ff" strokeWidth="3" strokeDasharray="6 4" />
      
      {/* Step 1 - You recommend */}
      <g>
        <rect x="15" y="38" width="60" height="64" rx="10" fill="white" stroke="#8b5cf6" strokeWidth="2" />
        {/* Person icon */}
        <circle cx="45" cy="55" r="12" fill="#c4b5fd" />
        <rect x="33" y="69" width="24" height="16" rx="4" fill="#c4b5fd" />
        {/* Speech bubble */}
        <path d="M60 50 L72 44 L72 58 L60 54 Z" fill="#8b5cf6" />
      </g>
      <text x="45" y="118" textAnchor="middle" fontSize="10" fontWeight="600" fill="#6d28d9">Recommend</text>
      
      {/* Arrow 1 */}
      <path d="M80 70 L95 70" stroke="#a78bfa" strokeWidth="2" />
      <path d="M92 65 L100 70 L92 75" fill="#a78bfa" />
      
      {/* Step 2 - Viewer sees */}
      <g>
        <rect x="100" y="38" width="60" height="64" rx="10" fill="white" stroke="#a855f7" strokeWidth="2" />
        {/* Eye icon */}
        <ellipse cx="130" cy="65" rx="18" ry="11" fill="none" stroke="#a855f7" strokeWidth="2.5" />
        <circle cx="130" cy="65" r="7" fill="#a855f7" />
        <circle cx="130" cy="65" r="3" fill="white" />
      </g>
      <text x="130" y="118" textAnchor="middle" fontSize="10" fontWeight="600" fill="#7c3aed">Viewer Sees</text>
      
      {/* Arrow 2 */}
      <path d="M165 70 L180 70" stroke="#a78bfa" strokeWidth="2" />
      <path d="M177 65 L185 70 L177 75" fill="#a78bfa" />
      
      {/* Step 3 - Clicks & buys */}
      <g>
        <rect x="185" y="38" width="60" height="64" rx="10" fill="white" stroke="#c026d3" strokeWidth="2" />
        {/* Cursor click icon */}
        <path d="M210 48 L210 78 L220 70 L228 85 L233 82 L225 68 L235 68 Z" fill="#c026d3" />
      </g>
      <text x="215" y="118" textAnchor="middle" fontSize="10" fontWeight="600" fill="#a21caf">Clicks & Buys</text>
      
      {/* Arrow 3 */}
      <path d="M250 70 L265 70" stroke="#a78bfa" strokeWidth="2" />
      <path d="M262 65 L270 70 L262 75" fill="#a78bfa" />
      
      {/* Step 4 - You earn (highlighted) */}
      <g>
        <rect x="270" y="38" width="60" height="64" rx="10" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
        {/* Money/coin icon */}
        <circle cx="300" cy="65" r="16" fill="#22c55e" />
        <text x="300" y="71" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">$</text>
      </g>
      <text x="300" y="118" textAnchor="middle" fontSize="10" fontWeight="600" fill="#166534">You Earn %</text>
      
      {/* Bottom note with FTC badge */}
      <rect x="95" y="135" width="150" height="28" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      <text x="170" y="152" textAnchor="middle" fontSize="9" fontWeight="600" fill="#92400e">Always disclose affiliate links</text>
      <text x="170" y="162" textAnchor="middle" fontSize="7" fill="#b45309">(FTC requirement)</text>
    </svg>
  );
}

function ExpectationRealityCheckVisual() {
  return (
    <svg
      width="340"
      height="160"
      viewBox="0 0 340 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Comparison of expectations versus reality for early YouTube earnings"
    >
      <title>Expectation vs Reality</title>
      {/* Left panel - What people imagine */}
      <rect x="10" y="10" width="150" height="140" rx="8" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
      <text x="85" y="32" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">WHAT PEOPLE IMAGINE</text>
      
      {/* Money bags */}
      <circle cx="50" cy="70" r="18" fill="#fcd34d" />
      <text x="50" y="75" textAnchor="middle" fontSize="14" fill="#92400e">$</text>
      <circle cx="85" cy="85" r="18" fill="#fcd34d" />
      <text x="85" y="90" textAnchor="middle" fontSize="14" fill="#92400e">$</text>
      <circle cx="120" cy="70" r="18" fill="#fcd34d" />
      <text x="120" y="75" textAnchor="middle" fontSize="14" fill="#92400e">$</text>
      
      <text x="85" y="125" textAnchor="middle" fontSize="8" fill="#92400e">&ldquo;I hit 1K subs,</text>
      <text x="85" y="137" textAnchor="middle" fontSize="8" fill="#92400e">I&apos;m rich now!&rdquo;</text>
      
      {/* Right panel - Reality */}
      <rect x="180" y="10" width="150" height="140" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" />
      <text x="255" y="32" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">WHAT ACTUALLY HAPPENS</text>
      
      {/* Small coins */}
      <circle cx="220" cy="75" r="8" fill="#bbf7d0" stroke="#22c55e" />
      <circle cx="240" cy="80" r="8" fill="#bbf7d0" stroke="#22c55e" />
      <circle cx="260" cy="78" r="8" fill="#bbf7d0" stroke="#22c55e" />
      <circle cx="280" cy="82" r="8" fill="#bbf7d0" stroke="#22c55e" />
      
      <text x="255" y="110" textAnchor="middle" fontSize="8" fill="#166534">$50-200/month early on</text>
      <text x="255" y="125" textAnchor="middle" fontSize="8" fill="#166534">Grows with effort over</text>
      <text x="255" y="137" textAnchor="middle" fontSize="8" fill="#166534">months and years</text>
    </svg>
  );
}

function TimelineLadderVisual() {
  return (
    <svg
      width="300"
      height="100"
      viewBox="0 0 300 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Growth curve */}
      <path d="M30 80 Q80 78 120 70 Q160 60 200 40 Q250 15 280 10" stroke="#22c55e" strokeWidth="3" fill="none" />
      
      {/* Stage labels */}
      <text x="30" y="95" fontSize="8" fill="#64748b">Early</text>
      <text x="120" y="95" fontSize="8" fill="#64748b">Steady</text>
      <text x="230" y="95" fontSize="8" fill="#64748b">Library Effect</text>
      
      {/* Dots on curve */}
      <circle cx="30" cy="80" r="4" fill="#22c55e" />
      <circle cx="120" cy="70" r="4" fill="#22c55e" />
      <circle cx="200" cy="40" r="4" fill="#22c55e" />
      <circle cx="280" cy="10" r="4" fill="#22c55e" />
      
      {/* Annotation */}
      <text x="200" y="60" fontSize="7" fill="#166534">Compounding kicks in</text>
    </svg>
  );
}

function MistakesMuseumVisual() {
  return (
    <svg
      width="320"
      height="100"
      viewBox="0 0 320 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Museum wall */}
      <rect x="10" y="10" width="300" height="80" fill="#fafaf9" />
      
      {/* Decorative molding */}
      <rect x="10" y="10" width="300" height="8" fill="#d6d3d1" />
      <rect x="10" y="82" width="300" height="8" fill="#d6d3d1" />
      
      {/* Picture frames */}
      <rect x="30" y="28" width="50" height="40" fill="#292524" stroke="#78716c" strokeWidth="3" />
      <rect x="100" y="28" width="50" height="40" fill="#292524" stroke="#78716c" strokeWidth="3" />
      <rect x="170" y="28" width="50" height="40" fill="#292524" stroke="#78716c" strokeWidth="3" />
      <rect x="240" y="28" width="50" height="40" fill="#292524" stroke="#78716c" strokeWidth="3" />
      
      {/* X marks in frames */}
      <path d="M42 40 L68 56 M68 40 L42 56" stroke="#dc2626" strokeWidth="2" />
      <path d="M112 40 L138 56 M138 40 L112 56" stroke="#dc2626" strokeWidth="2" />
      <path d="M182 40 L208 56 M208 40 L182 56" stroke="#dc2626" strokeWidth="2" />
      <path d="M252 40 L278 56 M278 40 L252 56" stroke="#dc2626" strokeWidth="2" />
      
      {/* Museum banner */}
      <text x="160" y="98" textAnchor="middle" fontSize="8" fill="#78716c">MONETIZATION WING</text>
    </svg>
  );
}

function ProgressThermometerVisual() {
  return (
    <svg
      width="300"
      height="140"
      viewBox="0 0 300 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Progress thermometers showing subscribers and watch hours"
    >
      <title>Progress Thermometers</title>
      {/* Thermometer 1 - Subscribers */}
      <rect x="50" y="20" width="30" height="90" rx="15" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="54" y="70" width="22" height="36" rx="11" fill="#22c55e" />
      <circle cx="65" cy="100" r="18" fill="#22c55e" />
      <text x="65" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">650</text>
      
      {/* Goal marker */}
      <line x1="40" y1="30" x2="50" y2="30" stroke="#64748b" strokeWidth="1" />
      <text x="35" y="34" textAnchor="end" fontSize="8" fill="#64748b">1K</text>
      
      {/* Label */}
      <text x="65" y="130" textAnchor="middle" fontSize="9" fill="#64748b">Subscribers</text>
      
      {/* Thermometer 2 - Watch Hours */}
      <rect x="170" y="20" width="30" height="90" rx="15" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="174" y="55" width="22" height="51" rx="11" fill="#8b5cf6" />
      <circle cx="185" cy="100" r="18" fill="#8b5cf6" />
      <text x="185" y="100" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">2,400</text>
      <text x="185" y="110" textAnchor="middle" fontSize="6" fill="white">hrs</text>
      
      {/* Goal marker */}
      <line x1="160" y1="30" x2="170" y2="30" stroke="#64748b" strokeWidth="1" />
      <text x="155" y="34" textAnchor="end" fontSize="8" fill="#64748b">4K</text>
      
      {/* Label */}
      <text x="185" y="130" textAnchor="middle" fontSize="9" fill="#64748b">Watch Hours</text>
      
      {/* OR text between */}
      <text x="125" y="75" textAnchor="middle" fontSize="10" fill="#94a3b8">or</text>
      
      {/* Shorts option indicator */}
      <rect x="230" y="60" width="50" height="30" rx="4" fill="#fff7ed" stroke="#f97316" strokeWidth="1" />
      <text x="255" y="75" textAnchor="middle" fontSize="7" fill="#c2410c">Shorts:</text>
      <text x="255" y="85" textAnchor="middle" fontSize="7" fill="#c2410c">10M views</text>
    </svg>
  );
}

function RollingWindowVisual() {
  return (
    <svg
      width="320"
      height="80"
      viewBox="0 0 320 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Timeline bar */}
      <rect x="20" y="35" width="280" height="20" rx="4" fill="#f1f5f9" stroke="#e2e8f0" />
      
      {/* 12-month window highlight */}
      <rect x="100" y="35" width="200" height="20" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
      
      {/* Old time falling off - faded */}
      <rect x="20" y="35" width="80" height="20" rx="4" fill="#f1f5f9" opacity="0.5" />
      <text x="60" y="49" textAnchor="middle" fontSize="8" fill="#94a3b8">Falls off</text>
      
      {/* Arrow showing direction */}
      <path d="M30 60 L50 60" stroke="#94a3b8" strokeWidth="1" />
      <path d="M45 55 L55 60 L45 65" fill="#94a3b8" />
      
      {/* Labels */}
      <text x="100" y="28" fontSize="8" fill="#64748b">12 months ago</text>
      <text x="280" y="28" fontSize="8" fill="#64748b">Today</text>
      
      {/* Counts label */}
      <text x="200" y="49" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#166534">Counts toward YPP</text>
    </svg>
  );
}

/* ================================================
   ICON COMPONENTS
   ================================================ */

function SubsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WatchTimeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShortsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M10 15l4-3-4-3v6z" fill="currentColor" />
    </svg>
  );
}

function AdRevenueIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

function PremiumIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" aria-hidden="true">
      <polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2" />
    </svg>
  );
}

function MembershipsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SupersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M12 7v2" />
      <path d="M12 13h.01" />
    </svg>
  );
}

function ShoppingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
