/**
 * Body content for YouTube Monetization Requirements article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Monetization Overview</h2>
        <p className={s.sectionText}>
          YouTube monetization means earning money from your videos. The primary path is 
          the YouTube Partner Program (YPP), which lets you earn from ads shown on your 
          content. Once accepted, you gain access to multiple revenue streams including 
          ad revenue, channel memberships, Super Chat, and more.
        </p>
        <p className={s.sectionText}>
          Understanding the requirements is essential for planning your channel&apos;s 
          growth. Many creators focus only on subscriber counts, but the requirements 
          include watch hours or views as well. You need to hit both thresholds before 
          you can apply.
        </p>
        <p className={s.sectionText}>
          Important warning: Do not try to shortcut these requirements by buying fake 
          subscribers or views. This approach will destroy your channel. YouTube detects 
          fake engagement, removes it, and can terminate channels that violate their 
          policies. See our detailed guide on{" "}
          <Link href="/learn/free-youtube-subscribers">
            why fake growth destroys channels
          </Link>.
        </p>
      </section>

      {/* Requirements Checklist */}
      <section id="requirements-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Partner Program Requirements Checklist</h2>
        <p className={s.sectionText}>
          To join the YouTube Partner Program and start earning money, you must meet 
          all of the following requirements:
        </p>
        <h3 className={s.subheading}>Subscriber Threshold</h3>
        <p className={s.sectionText}>
          You need at least <strong>1,000 subscribers</strong> on your channel. This 
          threshold ensures you have built some audience before monetizing. Subscribers 
          must be real, engaged followers. Fake or purchased subscribers will be removed 
          and can result in channel termination.
        </p>
        <h3 className={s.subheading}>Watch Time or Shorts Views</h3>
        <p className={s.sectionText}>
          You need to meet one of these engagement thresholds:
        </p>
        <ul className={s.list}>
          <li>
            <strong>4,000 public watch hours</strong> in the last 12 months (for long-form 
            content), OR
          </li>
          <li>
            <strong>10 million public Shorts views</strong> in the last 90 days (for 
            Shorts-focused creators)
          </li>
        </ul>
        <p className={s.sectionText}>
          Watch hours only count from public videos. Private, unlisted, and deleted 
          videos do not contribute. Live streams count toward watch hours, which is 
          why some creators use streaming to accelerate this requirement.
        </p>
        <h3 className={s.subheading}>Additional Requirements</h3>
        <ul className={s.list}>
          <li>
            <strong>No active Community Guidelines strikes:</strong> Even one strike can 
            delay your application. Three strikes result in channel termination.
          </li>
          <li>
            <strong>Two-step verification enabled:</strong> You must have 2FA enabled on 
            your Google account for security.
          </li>
          <li>
            <strong>Access to advanced features:</strong> Your channel must have access 
            to YouTube&apos;s advanced features in YouTube Studio.
          </li>
          <li>
            <strong>An AdSense account:</strong> You need to create and link a Google 
            AdSense account to receive payments.
          </li>
          <li>
            <strong>Live in an eligible country:</strong> The YouTube Partner Program 
            is available in most countries, but check YouTube&apos;s documentation for 
            your specific region.
          </li>
          <li>
            <strong>Follow monetization policies:</strong> Your content must comply with 
            YouTube&apos;s advertiser-friendly content guidelines.
          </li>
        </ul>
      </section>

      {/* Partner Program Benefits */}
      <section id="partner-program" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Partner Program Benefits</h2>
        <p className={s.sectionText}>
          Once accepted into YPP, you gain access to multiple monetization features:
        </p>
        <h3 className={s.subheading}>Ad Revenue</h3>
        <p className={s.sectionText}>
          Earn a share of advertising revenue from ads shown on your videos. YouTube 
          places pre-roll, mid-roll, and display ads on your content and shares the 
          revenue with you. For most creators, this becomes the foundation of YouTube 
          income.
        </p>
        <h3 className={s.subheading}>YouTube Premium Revenue</h3>
        <p className={s.sectionText}>
          Earn a portion of revenue when YouTube Premium members watch your content. 
          Premium subscribers pay YouTube directly for an ad-free experience, and 
          creators receive a share based on watch time from Premium viewers.
        </p>
        <h3 className={s.subheading}>Channel Memberships</h3>
        <p className={s.sectionText}>
          Offer paid monthly memberships to your audience. Members pay a recurring fee 
          in exchange for perks like custom badges, emotes, exclusive content, and 
          community access. This creates predictable monthly income.
        </p>
        <h3 className={s.subheading}>Super Chat and Super Stickers</h3>
        <p className={s.sectionText}>
          During live streams and Premieres, viewers can pay to highlight their messages 
          in chat. Super Chat messages appear pinned and colored based on the amount paid. 
          Super Stickers are animated images viewers can purchase.
        </p>
        <h3 className={s.subheading}>Super Thanks</h3>
        <p className={s.sectionText}>
          Viewers can send one-time tips on your regular videos, not just live streams. 
          Super Thanks lets fans support content they love with a direct payment.
        </p>
        <h3 className={s.subheading}>Shopping Features</h3>
        <p className={s.sectionText}>
          Sell products directly from your videos. YouTube Shopping lets you tag products, 
          create product shelves, and integrate with e-commerce platforms. This works 
          well for creators who sell merchandise or recommend products.
        </p>
        <p className={s.sectionText}>
          For actual earnings numbers and CPM rates, see our guide on{" "}
          <Link href="/learn/how-much-does-youtube-pay">how much YouTube pays</Link>.
        </p>
      </section>

      {/* How to Apply */}
      <section id="how-to-apply" className={s.section}>
        <h2 className={s.sectionTitle}>How to Apply for YouTube Monetization</h2>
        <p className={s.sectionText}>
          Once you meet all requirements, follow these steps to apply:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Open YouTube Studio:</strong> Go to studio.youtube.com and sign in.
          </li>
          <li>
            <strong>Click Earn in the left menu:</strong> This shows your monetization 
            status and whether you are eligible to apply.
          </li>
          <li>
            <strong>Click Apply if you are eligible:</strong> If you see an Apply button, 
            you have met the requirements. If not, you will see progress toward the 
            thresholds.
          </li>
          <li>
            <strong>Read and agree to Partner Program terms:</strong> Review the terms 
            carefully. You are agreeing to YouTube&apos;s monetization policies.
          </li>
          <li>
            <strong>Sign up for Google AdSense:</strong> You need an AdSense account to 
            receive payments. If you do not have one, you will create it during this step.
          </li>
          <li>
            <strong>Set your monetization preferences:</strong> Choose which ad formats 
            you want on your videos and other settings.
          </li>
          <li>
            <strong>Submit your channel for review:</strong> YouTube will review your 
            channel to ensure it meets their policies.
          </li>
        </ol>
        <h3 className={s.subheading}>Review Timeline</h3>
        <p className={s.sectionText}>
          YouTube typically reviews applications within 2 to 4 weeks, but it can take 
          longer during busy periods. You will receive an email when your application 
          is approved or denied. If denied, YouTube will explain why and you can 
          reapply after addressing the issues.
        </p>
        <h3 className={s.subheading}>Common Denial Reasons</h3>
        <ul className={s.list}>
          <li>Content that violates advertiser-friendly guidelines</li>
          <li>Reused content without significant added value</li>
          <li>Artificially inflated views or subscribers</li>
          <li>Misleading metadata (titles, descriptions, tags)</li>
          <li>Content not suitable for advertising</li>
        </ul>
      </section>

      {/* While You Wait */}
      <section id="while-you-wait" className={s.section}>
        <h2 className={s.sectionTitle}>What to Do While Working Toward Monetization</h2>
        <p className={s.sectionText}>
          If you have not reached the thresholds yet, here is how to accelerate your 
          progress while building a sustainable channel:
        </p>
        <h3 className={s.subheading}>Growing Subscribers</h3>
        <ul className={s.list}>
          <li>
            <strong>Create content that gives viewers a reason to return:</strong> Think 
            about what future videos will offer. Series content works especially well.
          </li>
          <li>
            <strong>Ask for the subscribe after delivering value:</strong> A well-timed 
            ask after a useful insight converts better than asking at the start.
          </li>
          <li>
            <strong>Stay focused on your niche:</strong> Consistent topics help viewers 
            know what to expect, making them more likely to subscribe.
          </li>
          <li>
            <strong>Check your subscriber conversion rate:</strong> See our{" "}
            <Link href="/learn/how-to-get-more-subscribers">subscriber growth guide</Link>{" "}
            for detailed strategies.
          </li>
        </ul>
        <h3 className={s.subheading}>Building Watch Hours</h3>
        <ul className={s.list}>
          <li>
            <strong>Improve retention:</strong> Longer watch time per video means faster 
            progress toward 4,000 hours. See our{" "}
            <Link href="/learn/youtube-retention-analysis">retention guide</Link>.
          </li>
          <li>
            <strong>Create longer videos if the content supports it:</strong> A 15-minute 
            video with 50% retention contributes more watch time than a 5-minute video 
            with the same retention.
          </li>
          <li>
            <strong>Use playlists:</strong> Encourage viewers to watch multiple videos in 
            a session by organizing content into logical playlists.
          </li>
          <li>
            <strong>Focus on evergreen topics:</strong> Videos that remain relevant over 
            time continue accumulating watch hours for months and years.
          </li>
          <li>
            <strong>Consider live streaming:</strong> Live streams can accumulate 
            significant watch hours, especially if you build a regular audience.
          </li>
        </ul>
        <h3 className={s.subheading}>Building for Shorts Views</h3>
        <ul className={s.list}>
          <li>
            <strong>Post Shorts consistently:</strong> The Shorts shelf rewards regular 
            uploaders. Consider posting Shorts several times per week.
          </li>
          <li>
            <strong>Hook viewers immediately:</strong> You have less than one second to 
            grab attention. Start with movement, questions, or surprising statements.
          </li>
          <li>
            <strong>Study trending formats:</strong> Pay attention to what Shorts styles 
            are getting traction in your niche.
          </li>
          <li>
            <strong>Repurpose long-form content:</strong> Pull highlights from your best 
            videos and turn them into Shorts to work toward both thresholds.
          </li>
        </ul>
      </section>

      {/* Revenue Streams */}
      <section id="revenue-streams" className={s.section}>
        <h2 className={s.sectionTitle}>Revenue Streams Explained</h2>
        <p className={s.sectionText}>
          Understanding different revenue streams helps you build a diversified income:
        </p>
        <h3 className={s.subheading}>Ad Revenue</h3>
        <p className={s.sectionText}>
          When ads play on your videos, you earn a share of the revenue. YouTube takes 
          approximately 45%, and you keep 55%. However, this varies based on ad format, 
          viewer location, content category, and seasonality. CPM (cost per mille, or 
          cost per 1,000 impressions) varies widely from $1 to $30+ depending on your 
          niche and audience.
        </p>
        <h3 className={s.subheading}>Sponsorships</h3>
        <p className={s.sectionText}>
          Brands pay you directly to promote their products or services in your videos. 
          This does not require YouTube Partner Program membership. Even small channels 
          can attract sponsors if they have an engaged, targeted audience. Sponsorship 
          rates typically range from $10 to $50 per 1,000 views, but vary enormously.
        </p>
        <h3 className={s.subheading}>Affiliate Marketing</h3>
        <p className={s.sectionText}>
          Earn commission on sales made through your affiliate links. When you recommend 
          products and viewers buy through your links, you receive a percentage. This 
          works well for review channels, tutorial creators, and anyone recommending 
          tools or products. Common programs include Amazon Associates and brand-specific 
          affiliate programs.
        </p>
        <h3 className={s.subheading}>Digital Products and Services</h3>
        <p className={s.sectionText}>
          Sell your own products based on your expertise. Options include online courses, 
          ebooks, templates, presets, coaching, consulting, and community memberships. 
          These often generate more revenue per customer than ads or affiliates.
        </p>
        <h3 className={s.subheading}>Physical Merchandise</h3>
        <p className={s.sectionText}>
          Sell branded merchandise to your audience. T-shirts, hats, mugs, and other 
          items with your brand or catchphrases. Print-on-demand services make this 
          accessible without inventory. Works best for creators with strong brand 
          identity and engaged communities.
        </p>
      </section>

      {/* Affiliate Basics */}
      <section id="affiliate-basics" className={s.section}>
        <h2 className={s.sectionTitle}>Affiliate Marketing Basics for Creators</h2>
        <p className={s.sectionText}>
          Affiliate marketing lets you earn money before reaching monetization thresholds. 
          Here is how to get started:
        </p>
        <h3 className={s.subheading}>How Affiliate Marketing Works</h3>
        <ol className={s.numberedList}>
          <li>
            <strong>Join affiliate programs:</strong> Sign up for programs related to 
            your niche. Amazon Associates is the most common, but many brands have their 
            own programs with higher commissions.
          </li>
          <li>
            <strong>Get your unique links:</strong> Each program provides tracking links 
            that credit sales to your account.
          </li>
          <li>
            <strong>Mention products naturally:</strong> Recommend products you actually 
            use and believe in. Forced recommendations hurt trust.
          </li>
          <li>
            <strong>Add links to descriptions:</strong> Include affiliate links with 
            clear disclosure that they are affiliate links.
          </li>
          <li>
            <strong>Mention the links in your video:</strong> Tell viewers where to find 
            the links. Links in the first line of description get more clicks.
          </li>
          <li>
            <strong>Track what converts:</strong> Review your affiliate dashboard to see 
            which products and videos generate sales.
          </li>
        </ol>
        <h3 className={s.subheading}>Disclosure Requirements</h3>
        <p className={s.sectionText}>
          You are legally required to disclose affiliate relationships. In the US, the 
          FTC requires clear disclosure. Include text like affiliate links below or 
          I may earn a commission if you purchase through my links in your description. 
          Many creators also mention it verbally.
        </p>
        <h3 className={s.subheading}>Best Practices</h3>
        <ul className={s.list}>
          <li>Only recommend products you would recommend without the commission</li>
          <li>Be honest about limitations and alternatives</li>
          <li>Create genuinely helpful content, not just sales pitches</li>
          <li>Track and optimize which content converts best</li>
        </ul>
      </section>

      {/* Realistic Expectations */}
      <section id="realistic-expectations" className={s.section}>
        <h2 className={s.sectionTitle}>Realistic Monetization Expectations</h2>
        <p className={s.sectionText}>
          Setting realistic expectations helps you stay motivated and make smart decisions:
        </p>
        <h3 className={s.subheading}>Early Stage Earnings</h3>
        <p className={s.sectionText}>
          Most channels earn very little in their first year of monetization. Reaching 
          1,000 subscribers and 4,000 watch hours is an accomplishment, but it typically 
          translates to $50 to $200 per month in ad revenue depending on your niche and 
          audience. Do not quit your job based on early YouTube earnings.
        </p>
        <h3 className={s.subheading}>Ad Revenue Is Rarely Enough Alone</h3>
        <p className={s.sectionText}>
          Successful full-time creators typically diversify. Ad revenue might be 30-50% 
          of total income, with sponsorships, affiliate marketing, and products making 
          up the rest. Relying solely on ad revenue requires very high view counts.
        </p>
        <h3 className={s.subheading}>Niche Matters Significantly</h3>
        <p className={s.sectionText}>
          Finance, business, and technology channels often earn 5x to 10x more per view 
          than gaming or entertainment channels. Advertisers pay more to reach certain 
          demographics. Consider your niche&apos;s monetization potential, but do not 
          choose a niche only for money.
        </p>
        <h3 className={s.subheading}>Growth Takes Time</h3>
        <p className={s.sectionText}>
          Building sustainable income from YouTube typically takes 2 to 5 years of 
          consistent effort. Treat early years as investment in learning and audience 
          building. The compounding effect of a content library takes time to materialize.
        </p>
        <h3 className={s.subheading}>Consistency Compounds</h3>
        <p className={s.sectionText}>
          Regular uploads build audiences faster than sporadic posting. A channel that 
          posts weekly for two years will almost always outperform one that posts 
          randomly. Consistency also trains the algorithm to expect and promote your content.
        </p>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Monetization Mistakes to Avoid</h2>
        <p className={s.sectionText}>
          Avoid these common mistakes that slow down or sabotage monetization:
        </p>
        <h3 className={s.subheading}>Buying Fake Subscribers or Views</h3>
        <p className={s.sectionText}>
          This is the most damaging mistake. Fake engagement gets your channel terminated. 
          Even if not terminated, fake subscribers tank your engagement metrics, making 
          YouTube show your content to fewer people. There are no shortcuts.
        </p>
        <h3 className={s.subheading}>Focusing Only on Ad Revenue</h3>
        <p className={s.sectionText}>
          Diversify your income streams from the start. Build an email list, explore 
          affiliate programs, consider what products or services you could offer. Do 
          not wait until monetization to think about business models.
        </p>
        <h3 className={s.subheading}>Ignoring Community Guidelines</h3>
        <p className={s.sectionText}>
          Community Guidelines strikes delay monetization and can result in features 
          being disabled. Learn the guidelines, avoid risky content, and respond 
          appropriately if you receive a strike.
        </p>
        <h3 className={s.subheading}>Rushing Low-Quality Content</h3>
        <p className={s.sectionText}>
          Trying to hit thresholds quickly by posting lots of mediocre content backfires. 
          Poor content has low retention and engagement, which signals to YouTube that 
          your channel is not worth promoting. Quality over quantity in the long run.
        </p>
        <h3 className={s.subheading}>Not Disclosing Sponsorships</h3>
        <p className={s.sectionText}>
          Failing to disclose paid partnerships is illegal in many countries and violates 
          YouTube&apos;s policies. Always clearly disclose when content is sponsored.
        </p>
        <h3 className={s.subheading}>Expecting Immediate Income</h3>
        <p className={s.sectionText}>
          Monetization is a milestone, not a finish line. Early ad revenue is usually 
          modest. Keep improving your content, growing your audience, and developing 
          additional revenue streams.
        </p>
      </section>

      {/* Tracking Progress */}
      <section id="tracking-progress" className={s.section}>
        <h2 className={s.sectionTitle}>Tracking Your Progress Toward Monetization</h2>
        <p className={s.sectionText}>
          YouTube Studio shows your progress toward monetization thresholds:
        </p>
        <h3 className={s.subheading}>Where to Check</h3>
        <ol className={s.numberedList}>
          <li>Go to YouTube Studio</li>
          <li>Click Earn in the left menu</li>
          <li>View your progress toward 1,000 subscribers and 4,000 watch hours</li>
        </ol>
        <h3 className={s.subheading}>Understanding Watch Hours</h3>
        <p className={s.sectionText}>
          Watch hours are counted on a rolling 12-month basis. Hours from videos you 
          published more than 12 months ago still count if the watch time occurred 
          within the last 12 months. However, hours watched more than 12 months ago 
          drop off.
        </p>
        <h3 className={s.subheading}>Projecting Your Timeline</h3>
        <p className={s.sectionText}>
          Calculate your average monthly watch hours and subscribers gained. Divide 
          the remaining threshold by your monthly rate to estimate when you will qualify. 
          This helps you set realistic expectations and identify if you need to change 
          strategy.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Track your path to monetization.</strong> {BRAND.name} shows you which 
          videos drive subscribers and watch time, helping you reach thresholds faster 
          with data-driven decisions. See what is working and do more of it.
        </p>
      </div>
    </>
  );
}
