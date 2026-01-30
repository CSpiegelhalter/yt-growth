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
  const hasSubscriberData = subscriberBreakdown?.subscriberViewPct != null;
  const hasGeoData = geoBreakdown && geoBreakdown.topCountries.length > 0;
  const hasTrafficDetail =
    trafficDetail &&
    (trafficDetail.searchTerms ||
      trafficDetail.suggestedVideos ||
      trafficDetail.browseFeatures);
  const hasDemographicData = demographicBreakdown?.hasData;

  // Don't show if no data
  if (
    !hasSubscriberData &&
    !hasGeoData &&
    !hasTrafficDetail &&
    !hasDemographicData &&
    impressionsCtr == null
  ) {
    return null;
  }

  return (
    <div className={styles.panelStack}>
      {/* Discovery Performance */}
      {impressionsCtr != null && (
        <InsightCard title="Discovery performance">
          <div className={styles.metricGrid}>
            <div className={styles.metricItem}>
              <div className={styles.metricLabel}>Thumbnail CTR</div>
              <div className={styles.metricValue}>
                {impressionsCtr.toFixed(2)}%
              </div>
              <div className={styles.metricDetail}>
                {impressionsCtr > 10
                  ? "Strong thumbnail performance"
                  : impressionsCtr > 5
                    ? "Average thumbnail performance"
                    : "Thumbnail may need improvement"}
              </div>
            </div>
          </div>
        </InsightCard>
      )}

      {/* Subscriber Behavior */}
      {hasSubscriberData && subscriberBreakdown && (
        <InsightCard title="Subscriber vs non-subscriber behavior">
          <div className={styles.metricGrid}>
            <div className={styles.metricItem}>
              <div className={styles.metricLabel}>Views from subscribers</div>
              <div className={styles.metricValue}>
                {subscriberBreakdown.subscriberViewPct?.toFixed(0)}%
              </div>
              {subscriberBreakdown.subscribers && (
                <div className={styles.metricDetail}>
                  {subscriberBreakdown.subscribers.views.toLocaleString()} views
                  • {subscriberBreakdown.subscribers.avgViewPct.toFixed(1)}%
                  retention
                </div>
              )}
            </div>

            {subscriberBreakdown.nonSubscribers && (
              <div className={styles.metricItem}>
                <div className={styles.metricLabel}>
                  Non-subscriber retention
                </div>
                <div className={styles.metricValue}>
                  {subscriberBreakdown.nonSubscribers.avgViewPct.toFixed(1)}%
                </div>
                <div className={styles.metricDetail}>
                  {subscriberBreakdown.nonSubscribers.views.toLocaleString()}{" "}
                  views
                </div>
              </div>
            )}
          </div>

          {subscriberBreakdown.subscribers &&
            subscriberBreakdown.nonSubscribers && (
              <div className={styles.insightNote}>
                {subscriberBreakdown.subscribers.avgViewPct >
                subscriberBreakdown.nonSubscribers.avgViewPct
                  ? "✓ Subscribers retain better - content matches channel expectations"
                  : "⚠ Non-subscribers retain better - consider if you're serving your core audience"}
              </div>
            )}
        </InsightCard>
      )}

      {/* Geographic Performance */}
      {hasGeoData && geoBreakdown && (
        <InsightCard title="Top countries">
          <div className={styles.countryList}>
            {geoBreakdown.topCountries.slice(0, 5).map((country, idx) => (
              <div key={country.country} className={styles.countryItem}>
                <div className={styles.countryRank}>#{idx + 1}</div>
                <div className={styles.countryInfo}>
                  <div className={styles.countryName}>
                    {country.countryName}
                  </div>
                  <div className={styles.countryStats}>
                    {country.viewsPct.toFixed(1)}% of views
                    {country.avgViewPct &&
                      ` • ${country.avgViewPct.toFixed(1)}% retention`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {geoBreakdown.primaryMarket && (
            <div className={styles.insightNote}>
              Primary market: {geoBreakdown.primaryMarket}
            </div>
          )}
        </InsightCard>
      )}

      {/* Traffic Source Details */}
      {hasTrafficDetail && trafficDetail && (
        <InsightCard title="Traffic source breakdown">
          {trafficDetail.searchTerms &&
            trafficDetail.searchTerms.length > 0 && (
              <div className={styles.trafficSection}>
                <div className={styles.trafficSectionTitle}>
                  Top search terms
                </div>
                <div className={styles.searchTermList}>
                  {trafficDetail.searchTerms.slice(0, 5).map((term, idx) => (
                    <div key={idx} className={styles.searchTermItem}>
                      <span className={styles.searchTerm}>"{term.term}"</span>
                      <span className={styles.searchViews}>
                        {term.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {trafficDetail.suggestedVideos &&
            trafficDetail.suggestedVideos.length > 0 && (
              <div className={styles.trafficSection}>
                <div className={styles.trafficSectionTitle}>
                  Top suggested sources
                </div>
                <div className={styles.suggestedList}>
                  {trafficDetail.suggestedVideos
                    .slice(0, 3)
                    .map((video, idx) => (
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
            )}

          {trafficDetail.browseFeatures &&
            trafficDetail.browseFeatures.length > 0 && (
              <div className={styles.trafficSection}>
                <div className={styles.trafficSectionTitle}>
                  Browse features
                </div>
                <div className={styles.browseList}>
                  {trafficDetail.browseFeatures
                    .slice(0, 3)
                    .map((feature, idx) => (
                      <div key={idx} className={styles.browseItem}>
                        <span className={styles.browseName}>
                          {feature.feature}
                        </span>
                        <span className={styles.browseViews}>
                          {feature.views.toLocaleString()} views
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </InsightCard>
      )}

      {/* Demographics */}
      {hasDemographicData && demographicBreakdown && (
        <InsightCard title="Audience demographics">
          {demographicBreakdown.byAge.length > 0 && (
            <div className={styles.demoSection}>
              <div className={styles.demoLabel}>Age groups</div>
              <div className={styles.demoGrid}>
                {demographicBreakdown.byAge.map((age) => (
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

          {demographicBreakdown.byGender.length > 0 && (
            <div className={styles.demoSection}>
              <div className={styles.demoLabel}>Gender split</div>
              <div className={styles.demoGrid}>
                {demographicBreakdown.byGender.map((gender) => (
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
      )}
    </div>
  );
}
