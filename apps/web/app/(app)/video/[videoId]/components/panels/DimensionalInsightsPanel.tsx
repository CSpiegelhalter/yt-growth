/**
 * DimensionalInsightsPanel - Display rich dimensional analytics
 * Shows subscriber breakdown, geographic performance, traffic details, demographics
 */

import { InsightCard } from "../ui";
import styles from "./panels.module.css";

type SubscriberBreakdown = {
  subscribers: { views: number; avgViewPct: number; ctr: number | null } | null;
  nonSubscribers: {
    views: number;
    avgViewPct: number;
    ctr: number | null;
  } | null;
  subscriberViewPct: number | null;
};

type GeographicBreakdown = {
  topCountries: Array<{
    country: string;
    countryName: string;
    views: number;
    viewsPct: number;
    avgViewPct: number | null;
  }>;
  primaryMarket: string | null;
};

type TrafficSourceDetail = {
  searchTerms: Array<{ term: string; views: number }> | null;
  suggestedVideos: Array<{ videoId: string; views: number }> | null;
  browseFeatures: Array<{ feature: string; views: number }> | null;
};

type DemographicBreakdown = {
  hasData: boolean;
  byAge: Array<{ ageGroup: string; views: number; viewsPct: number }>;
  byGender: Array<{ gender: string; views: number; viewsPct: number }>;
} | null;

type Props = {
  subscriberBreakdown?: SubscriberBreakdown | null;
  geoBreakdown?: GeographicBreakdown | null;
  trafficDetail?: TrafficSourceDetail | null;
  demographicBreakdown?: DemographicBreakdown | null;
  impressionsCtr?: number | null;
};

export function DimensionalInsightsPanel({
  subscriberBreakdown,
  geoBreakdown,
  trafficDetail,
  demographicBreakdown,
  impressionsCtr,
}: Props) {
  return (
    <div className={styles.panelStack}>
      <DiscoveryPerformanceCard impressionsCtr={impressionsCtr} />
      <SubscriberBehaviorCard breakdown={subscriberBreakdown} />
      <GeographicCard breakdown={geoBreakdown} />
      <TrafficDetailCard detail={trafficDetail} />
      <DemographicsCard breakdown={demographicBreakdown} />
    </div>
  );
}

function getCtrAssessment(ctr: number): string {
  if (ctr > 10) {return "Strong thumbnail performance";}
  if (ctr > 5) {return "Average thumbnail performance";}
  return "Thumbnail may need improvement";
}

function DiscoveryPerformanceCard({
  impressionsCtr,
}: {
  impressionsCtr?: number | null;
}) {
  if (impressionsCtr == null) {return null;}
  return (
    <InsightCard title="Discovery performance">
      <div className={styles.metricGrid}>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Thumbnail CTR</div>
          <div className={styles.metricValue}>
            {impressionsCtr.toFixed(2)}%
          </div>
          <div className={styles.metricDetail}>
            {getCtrAssessment(impressionsCtr)}
          </div>
        </div>
      </div>
    </InsightCard>
  );
}

function SubscriberBehaviorCard({
  breakdown,
}: {
  breakdown?: SubscriberBreakdown | null;
}) {
  if (breakdown?.subscriberViewPct == null) {return null;}

  return (
    <InsightCard title="Subscriber vs non-subscriber behavior">
      <div className={styles.metricGrid}>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Views from subscribers</div>
          <div className={styles.metricValue}>
            {breakdown.subscriberViewPct?.toFixed(0)}%
          </div>
          {breakdown.subscribers && (
            <div className={styles.metricDetail}>
              {breakdown.subscribers.views.toLocaleString()} views
              {" \u2022 "}
              {breakdown.subscribers.avgViewPct.toFixed(1)}% retention
            </div>
          )}
        </div>

        {breakdown.nonSubscribers && (
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>Non-subscriber retention</div>
            <div className={styles.metricValue}>
              {breakdown.nonSubscribers.avgViewPct.toFixed(1)}%
            </div>
            <div className={styles.metricDetail}>
              {breakdown.nonSubscribers.views.toLocaleString()} views
            </div>
          </div>
        )}
      </div>

      <SubscriberRetentionNote breakdown={breakdown} />
    </InsightCard>
  );
}

function SubscriberRetentionNote({
  breakdown,
}: {
  breakdown: SubscriberBreakdown;
}) {
  if (!breakdown.subscribers || !breakdown.nonSubscribers) {return null;}

  const subscribersBetter =
    breakdown.subscribers.avgViewPct > breakdown.nonSubscribers.avgViewPct;
  return (
    <div className={styles.insightNote}>
      {subscribersBetter ? "\u2713 " : "\u26A0 "}
      {subscribersBetter
        ? "Subscribers retain better - content matches channel expectations"
        : "Non-subscribers retain better - consider if you're serving your core audience"}
    </div>
  );
}

function GeographicCard({
  breakdown,
}: {
  breakdown?: GeographicBreakdown | null;
}) {
  if (!breakdown || breakdown.topCountries.length === 0) {return null;}

  return (
    <InsightCard title="Top countries">
      <div className={styles.countryList}>
        {breakdown.topCountries.slice(0, 5).map((country, idx) => (
          <div key={country.country} className={styles.countryItem}>
            <div className={styles.countryRank}>#{idx + 1}</div>
            <div className={styles.countryInfo}>
              <div className={styles.countryName}>{country.countryName}</div>
              <div className={styles.countryStats}>
                {country.viewsPct.toFixed(1)}% of views
                {country.avgViewPct != null &&
                  ` \u2022 ${country.avgViewPct.toFixed(1)}% retention`}
              </div>
            </div>
          </div>
        ))}
      </div>
      {breakdown.primaryMarket && (
        <div className={styles.insightNote}>
          Primary market: {breakdown.primaryMarket}
        </div>
      )}
    </InsightCard>
  );
}

function hasTrafficData(detail?: TrafficSourceDetail | null): boolean {
  if (!detail) {return false;}
  return !!(
    detail.searchTerms ||
    detail.suggestedVideos ||
    detail.browseFeatures
  );
}

function TrafficDetailCard({
  detail,
}: {
  detail?: TrafficSourceDetail | null;
}) {
  if (!hasTrafficData(detail) || !detail) {return null;}

  return (
    <InsightCard title="Traffic source breakdown">
      <SearchTermsSection terms={detail.searchTerms} />
      <SuggestedVideosSection videos={detail.suggestedVideos} />
      <BrowseFeaturesSection features={detail.browseFeatures} />
    </InsightCard>
  );
}

function SearchTermsSection({
  terms,
}: {
  terms: Array<{ term: string; views: number }> | null;
}) {
  if (!terms || terms.length === 0) {return null;}
  return (
    <div className={styles.trafficSection}>
      <div className={styles.trafficSectionTitle}>Top search terms</div>
      <div className={styles.searchTermList}>
        {terms.slice(0, 5).map((term, idx) => (
          <div key={idx} className={styles.searchTermItem}>
            <span className={styles.searchTerm}>
              &ldquo;{term.term}&rdquo;
            </span>
            <span className={styles.searchViews}>
              {term.views.toLocaleString()} views
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestedVideosSection({
  videos,
}: {
  videos: Array<{ videoId: string; views: number }> | null;
}) {
  if (!videos || videos.length === 0) {return null;}
  return (
    <div className={styles.trafficSection}>
      <div className={styles.trafficSectionTitle}>Top suggested sources</div>
      <div className={styles.suggestedList}>
        {videos.slice(0, 3).map((video, idx) => (
          <div key={idx} className={styles.suggestedItem}>
            <a
              href={`https://youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.suggestedLink}
            >
              {video.videoId}
            </a>
            <span className={styles.suggestedViews}>
              {video.views.toLocaleString()} views
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrowseFeaturesSection({
  features,
}: {
  features: Array<{ feature: string; views: number }> | null;
}) {
  if (!features || features.length === 0) {return null;}
  return (
    <div className={styles.trafficSection}>
      <div className={styles.trafficSectionTitle}>Browse features</div>
      <div className={styles.browseList}>
        {features.slice(0, 3).map((feature, idx) => (
          <div key={idx} className={styles.browseItem}>
            <span className={styles.browseName}>{feature.feature}</span>
            <span className={styles.browseViews}>
              {feature.views.toLocaleString()} views
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemographicsCard({
  breakdown,
}: {
  breakdown?: DemographicBreakdown | null;
}) {
  if (!breakdown?.hasData) {return null;}

  return (
    <InsightCard title="Audience demographics">
      {breakdown.byAge.length > 0 && (
        <div className={styles.demoSection}>
          <div className={styles.demoLabel}>Age groups</div>
          <div className={styles.demoGrid}>
            {breakdown.byAge.map((age) => (
              <div key={age.ageGroup} className={styles.demoItem}>
                <div className={styles.demoGroup}>{age.ageGroup}</div>
                <div className={styles.demoPct}>
                  {age.viewsPct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {breakdown.byGender.length > 0 && (
        <div className={styles.demoSection}>
          <div className={styles.demoLabel}>Gender split</div>
          <div className={styles.demoGrid}>
            {breakdown.byGender.map((gender) => (
              <div key={gender.gender} className={styles.demoItem}>
                <div className={styles.demoGroup}>{gender.gender}</div>
                <div className={styles.demoPct}>
                  {gender.viewsPct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </InsightCard>
  );
}
